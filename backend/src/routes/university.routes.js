import express from "express";
import {
  getUniversities,
  getPopularUniversities,
  getTopRatedUniversities,
  getFeaturedUniversities,
  getCountries,
  getStates,
  verifyEmail,
  suggestUniversities,
  getNearbyUniversities,
  getUniversity,
  getUniversityReviews,
  getUniversityPosts,
  getUniversityNotes,
  getUniversityStudents,
  getUniversityStats,
  joinUniversity,
  leaveUniversity,
} from "../controllers/university.controller.js";
import { protectRoute } from "../middleware/auth.middleware.js";

const router = express.Router();

// Public routes
router.get("/", getUniversities);
router.get("/popular", getPopularUniversities);
router.get("/top-rated", getTopRatedUniversities);
router.get("/featured", getFeaturedUniversities);
router.get("/countries", getCountries);
router.get("/states", getStates);
router.get("/verify-email", verifyEmail);
router.get("/suggest", suggestUniversities);
router.get("/nearby", getNearbyUniversities);

// Single university routes (public)
router.get("/:id", getUniversity);
router.get("/:id/reviews", getUniversityReviews);
router.get("/:id/posts", getUniversityPosts);
router.get("/:id/notes", getUniversityNotes);
router.get("/:id/stats", getUniversityStats);

// Protected routes
router.get("/:id/students", protectRoute, getUniversityStudents);
router.post("/:id/join", protectRoute, joinUniversity);
router.post("/:id/leave", protectRoute, leaveUniversity);

export default router;
