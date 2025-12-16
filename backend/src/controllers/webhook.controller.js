import { Webhook } from "svix";
import User from "../models/user.model.js";
import University from "../models/university.model.js";
import { verifyStudentEmail } from "../services/emailVerification.js";

// Verify Clerk webhook signature
function verifyWebhook(req) {
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;
  if (!WEBHOOK_SECRET) {
    throw new Error("CLERK_WEBHOOK_SECRET not configured");
  }

  const svixId = req.headers["svix-id"];
  const svixTimestamp = req.headers["svix-timestamp"];
  const svixSignature = req.headers["svix-signature"];

  if (!svixId || !svixTimestamp || !svixSignature) {
    throw new Error("Missing svix headers");
  }

  const wh = new Webhook(WEBHOOK_SECRET);
  return wh.verify(JSON.stringify(req.body), {
    "svix-id": svixId,
    "svix-timestamp": svixTimestamp,
    "svix-signature": svixSignature,
  });
}

// Handle user.created event
async function handleUserCreated(data) {
  const { id: clerkId, email_addresses, first_name, last_name, image_url } = data;

  const primaryEmail = email_addresses?.find((e) => e.id === data.primary_email_address_id);
  const email = primaryEmail?.email_address;

  if (!email) {
    console.log("No email found for user:", clerkId);
    return null;
  }

  // Check if user already exists
  const existingUser = await User.findOne({ clerkId });
  if (existingUser) {
    return existingUser;
  }

  // Check if email is from a known university
  const verification = await verifyStudentEmail(email);
  let university = null;
  let isVerifiedStudent = false;

  if (verification.isValid && verification.university) {
    university = verification.university._id;
    isVerifiedStudent = verification.isAcademicDomain;
  }

  // Generate username from email
  const baseUsername = email.split("@")[0].toLowerCase().replace(/[^a-z0-9_]/g, "");
  let username = baseUsername;
  let counter = 1;

  while (await User.findOne({ username })) {
    username = `${baseUsername}${counter}`;
    counter++;
  }

  // Create user
  const user = await User.create({
    clerkId,
    email,
    firstName: first_name || "",
    lastName: last_name || "",
    username,
    profilePicture: image_url || "",
    university,
    universityJoinedAt: university ? new Date() : undefined,
    isVerifiedStudent,
    studentVerifiedAt: isVerifiedStudent ? new Date() : undefined,
    studentEmail: verification.isAcademicDomain ? email : undefined,
    role: isVerifiedStudent ? "student" : "prospective",
  });

  // Update university member count
  if (university) {
    await University.findByIdAndUpdate(university, {
      $inc: { "communityStats.totalMembers": 1 },
    });
  }

  console.log("User created:", user.username, university ? `(${verification.university.name})` : "");
  return user;
}

// Handle user.updated event
async function handleUserUpdated(data) {
  const { id: clerkId, email_addresses, first_name, last_name, image_url } = data;

  const user = await User.findOne({ clerkId });
  if (!user) {
    return handleUserCreated(data);
  }

  const primaryEmail = email_addresses?.find((e) => e.id === data.primary_email_address_id);
  const email = primaryEmail?.email_address;

  const updates = {};
  if (first_name !== undefined) updates.firstName = first_name || "";
  if (last_name !== undefined) updates.lastName = last_name || "";
  if (image_url !== undefined) updates.profilePicture = image_url || "";
  if (email && email !== user.email) updates.email = email;

  if (Object.keys(updates).length > 0) {
    await User.findByIdAndUpdate(user._id, updates);
  }

  return user;
}

// Handle user.deleted event
async function handleUserDeleted(data) {
  const { id: clerkId } = data;

  const user = await User.findOne({ clerkId });
  if (!user) return null;

  // Update university member count
  if (user.university) {
    await University.findByIdAndUpdate(user.university, {
      $inc: { "communityStats.totalMembers": -1 },
    });
  }

  await User.findByIdAndDelete(user._id);
  console.log("User deleted:", user.username);
  return user;
}

// Main webhook handler
export const handleClerkWebhook = async (req, res) => {
  try {
    const payload = verifyWebhook(req);
    const { type, data } = payload;

    console.log("Clerk webhook received:", type);

    let result = null;

    switch (type) {
      case "user.created":
        result = await handleUserCreated(data);
        break;
      case "user.updated":
        result = await handleUserUpdated(data);
        break;
      case "user.deleted":
        result = await handleUserDeleted(data);
        break;
      default:
        console.log("Unhandled webhook type:", type);
    }

    res.status(200).json({ success: true, type, processed: !!result });
  } catch (error) {
    console.error("Webhook error:", error.message);
    res.status(400).json({ error: error.message });
  }
};

// Sync existing user (manual trigger)
export const syncUserFromClerk = async (req, res) => {
  try {
    const { clerkId } = req.params;

    // Get user from Clerk
    const { clerkClient } = await import("@clerk/express");
    const clerkUser = await clerkClient.users.getUser(clerkId);

    const result = await handleUserCreated({
      id: clerkUser.id,
      email_addresses: clerkUser.emailAddresses,
      primary_email_address_id: clerkUser.primaryEmailAddressId,
      first_name: clerkUser.firstName,
      last_name: clerkUser.lastName,
      image_url: clerkUser.imageUrl,
    });

    res.status(200).json({ success: true, user: result });
  } catch (error) {
    console.error("Sync error:", error);
    res.status(500).json({ error: error.message });
  }
};
