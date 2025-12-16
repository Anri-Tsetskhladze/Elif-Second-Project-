import express from "express";
import {
  checkEmail,
  startVerification,
  verify,
  verifyToken,
  resend,
  getStatus,
  suggest,
  cancelVerification,
} from "../controllers/verification.controller.js";
import { protectRoute } from "../middleware/auth.middleware.js";

const router = express.Router();

// Public routes
router.post("/check-email", checkEmail);
router.post("/verify-token", verifyToken);
router.get("/suggest", suggest);

// Protected routes
router.post("/start", protectRoute, startVerification);
router.post("/verify", protectRoute, verify);
router.post("/resend", protectRoute, resend);
router.get("/status", protectRoute, getStatus);
router.post("/cancel", protectRoute, cancelVerification);

export default router;
