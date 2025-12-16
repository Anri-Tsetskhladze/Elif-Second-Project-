import express from "express";
import {
  getReviews,
  getUniversityReviews,
  getUserReviews,
  getReview,
  createReview,
  updateReview,
  deleteReview,
  markHelpful,
  reportReview,
  getMyReview,
} from "../controllers/review.controller.js";
import { protectRoute, optionalAuth } from "../middleware/auth.middleware.js";

const router = express.Router();

// Public routes (specific paths before dynamic :id)
router.get("/", optionalAuth, getReviews);
router.get("/university/:universityId", optionalAuth, getUniversityReviews);
router.get("/user/:userId", getUserReviews);
router.get("/me/university/:universityId", protectRoute, getMyReview);
router.get("/:id", optionalAuth, getReview);

// Protected routes
router.post("/", protectRoute, createReview);
router.put("/:id", protectRoute, updateReview);
router.delete("/:id", protectRoute, deleteReview);
router.post("/:id/helpful", protectRoute, markHelpful);
router.post("/:id/report", protectRoute, reportReview);

export default router;
