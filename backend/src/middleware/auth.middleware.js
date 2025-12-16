import { getAuth } from "@clerk/express";
import User from "../models/user.model.js";

// Basic authentication check
export const protectRoute = async (req, res, next) => {
  if (!req.auth().isAuthenticated) {
    return res.status(401).json({ message: "Unauthorized - you must be logged in" });
  }
  next();
};

// Attach user document to request
export const attachUser = async (req, res, next) => {
  try {
    const { userId } = getAuth(req);
    if (!userId) {
      req.dbUser = null;
      return next();
    }

    const user = await User.findOne({ clerkId: userId });
    req.dbUser = user;
    next();
  } catch (error) {
    console.error("Error attaching user:", error);
    req.dbUser = null;
    next();
  }
};

// Require verified student status
export const requireVerifiedStudent = async (req, res, next) => {
  try {
    const { userId } = getAuth(req);
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const user = req.dbUser || await User.findOne({ clerkId: userId });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (!user.isVerifiedStudent) {
      return res.status(403).json({
        message: "Student verification required",
        code: "STUDENT_VERIFICATION_REQUIRED",
      });
    }

    req.dbUser = user;
    next();
  } catch (error) {
    console.error("Error in requireVerifiedStudent:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Require membership in a specific university
export const requireUniversityMember = (paramName = "universityId") => {
  return async (req, res, next) => {
    try {
      const { userId } = getAuth(req);
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const user = req.dbUser || await User.findOne({ clerkId: userId });
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const universityId = req.params[paramName] || req.body.universityId;
      if (!universityId) {
        return res.status(400).json({ message: "University ID required" });
      }

      if (!user.university || user.university.toString() !== universityId) {
        return res.status(403).json({
          message: "You must be a member of this university",
          code: "UNIVERSITY_MEMBERSHIP_REQUIRED",
        });
      }

      req.dbUser = user;
      next();
    } catch (error) {
      console.error("Error in requireUniversityMember:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  };
};

// Require user to have a university
export const requireUniversity = async (req, res, next) => {
  try {
    const { userId } = getAuth(req);
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const user = req.dbUser || await User.findOne({ clerkId: userId });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (!user.university) {
      return res.status(403).json({
        message: "You must join a university first",
        code: "UNIVERSITY_REQUIRED",
      });
    }

    req.dbUser = user;
    next();
  } catch (error) {
    console.error("Error in requireUniversity:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Admin only middleware
export const requireAdmin = async (req, res, next) => {
  try {
    const { userId } = getAuth(req);
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const user = req.dbUser || await User.findOne({ clerkId: userId });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.role !== "admin" && user.role !== "moderator") {
      return res.status(403).json({
        message: "Admin access required",
        code: "ADMIN_REQUIRED",
      });
    }

    req.dbUser = user;
    next();
  } catch (error) {
    console.error("Error in requireAdmin:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Optional auth - attaches user if logged in, continues anyway
export const optionalAuth = async (req, res, next) => {
  try {
    const auth = req.auth();
    if (auth.isAuthenticated) {
      const user = await User.findOne({ clerkId: auth.userId });
      req.dbUser = user;
    } else {
      req.dbUser = null;
    }
    next();
  } catch (error) {
    req.dbUser = null;
    next();
  }
};
