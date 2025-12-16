import asyncHandler from "express-async-handler";
import { getAuth } from "@clerk/express";
import { clerkClient } from "@clerk/express";
import User from "../models/user.model.js";
import {
  verifyStudentEmail,
  createVerification,
  completeVerification,
  resendVerification,
  checkVerificationStatus,
  suggestUniversitiesByDomain,
  extractDomain,
} from "../services/emailVerification.js";

// POST /api/verification/check-email
export const checkEmail = asyncHandler(async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: "Email is required" });
  }

  const result = await verifyStudentEmail(email);
  res.status(200).json(result);
});

// POST /api/verification/start
export const startVerification = asyncHandler(async (req, res) => {
  const { userId } = getAuth(req);
  const { studentEmail } = req.body;

  if (!studentEmail) {
    return res.status(400).json({ error: "Student email is required" });
  }

  const user = await User.findOne({ clerkId: userId });
  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }

  if (user.isVerifiedStudent) {
    return res.status(400).json({ error: "Already verified as a student" });
  }

  try {
    const verification = await createVerification(user._id, studentEmail);

    // Send verification email via Clerk
    const verificationUrl = `${process.env.FRONTEND_URL || "http://localhost:3000"}/verify?token=${verification.token}`;

    try {
      await clerkClient.emails.createEmail({
        fromEmailName: "Academy Hub",
        emailAddressId: studentEmail,
        subject: "Verify your student email",
        body: `
          <h2>Verify Your Student Email</h2>
          <p>Click the link below to verify your student email address:</p>
          <a href="${verificationUrl}">${verificationUrl}</a>
          <p>Or use this verification code: <strong>${verification.code}</strong></p>
          <p>This link expires in 24 hours.</p>
        `,
      });
    } catch (emailError) {
      console.log("Clerk email not sent (may need configuration):", emailError.message);
    }

    res.status(200).json({
      message: "Verification email sent",
      email: studentEmail,
      university: verification.university,
      expiresAt: verification.expiresAt,
      token: process.env.NODE_ENV === "development" ? verification.token : undefined,
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// POST /api/verification/verify
export const verify = asyncHandler(async (req, res) => {
  const { userId } = getAuth(req);
  const { token } = req.body;

  if (!token) {
    return res.status(400).json({ error: "Verification token is required" });
  }

  const user = await User.findOne({ clerkId: userId });
  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }

  try {
    const result = await completeVerification(user._id, token);

    res.status(200).json({
      message: result.message,
      isVerified: true,
      university: result.university
        ? {
            _id: result.university._id,
            name: result.university.name,
            city: result.university.city,
            state: result.university.state,
          }
        : null,
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// POST /api/verification/verify-token (public, for email link)
export const verifyToken = asyncHandler(async (req, res) => {
  const { token } = req.body;

  if (!token) {
    return res.status(400).json({ error: "Token is required" });
  }

  const user = await User.findOne({
    verificationToken: token,
    verificationTokenExpires: { $gt: new Date() },
  });

  if (!user) {
    return res.status(400).json({ error: "Invalid or expired token" });
  }

  try {
    const result = await completeVerification(user._id, token);

    res.status(200).json({
      message: result.message,
      isVerified: true,
      university: result.university
        ? {
            _id: result.university._id,
            name: result.university.name,
          }
        : null,
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// POST /api/verification/resend
export const resend = asyncHandler(async (req, res) => {
  const { userId } = getAuth(req);

  const user = await User.findOne({ clerkId: userId });
  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }

  try {
    const verification = await resendVerification(user._id);

    const verificationUrl = `${process.env.FRONTEND_URL || "http://localhost:3000"}/verify?token=${verification.token}`;

    try {
      await clerkClient.emails.createEmail({
        fromEmailName: "Academy Hub",
        emailAddressId: verification.email,
        subject: "Verify your student email",
        body: `
          <h2>Verify Your Student Email</h2>
          <p>Click the link below to verify your student email address:</p>
          <a href="${verificationUrl}">${verificationUrl}</a>
          <p>Or use this verification code: <strong>${verification.code}</strong></p>
          <p>This link expires in 24 hours.</p>
        `,
      });
    } catch (emailError) {
      console.log("Clerk email not sent:", emailError.message);
    }

    res.status(200).json({
      message: "Verification email resent",
      email: verification.email,
      expiresAt: verification.expiresAt,
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// GET /api/verification/status
export const getStatus = asyncHandler(async (req, res) => {
  const { userId } = getAuth(req);

  const user = await User.findOne({ clerkId: userId });
  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }

  try {
    const status = await checkVerificationStatus(user._id);
    res.status(200).json(status);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// GET /api/verification/suggest
export const suggest = asyncHandler(async (req, res) => {
  const { domain, limit = 10 } = req.query;

  if (!domain || domain.length < 2) {
    return res.status(400).json({ error: "Domain must be at least 2 characters" });
  }

  const universities = await suggestUniversitiesByDomain(domain, parseInt(limit));
  res.status(200).json({ universities });
});

// POST /api/verification/cancel
export const cancelVerification = asyncHandler(async (req, res) => {
  const { userId } = getAuth(req);

  const user = await User.findOne({ clerkId: userId });
  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }

  user.studentEmail = undefined;
  user.verificationToken = undefined;
  user.verificationTokenExpires = undefined;
  await user.save();

  res.status(200).json({ message: "Verification cancelled" });
});
