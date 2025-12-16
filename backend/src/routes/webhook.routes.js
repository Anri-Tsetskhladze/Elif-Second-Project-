import express from "express";
import { handleClerkWebhook, syncUserFromClerk } from "../controllers/webhook.controller.js";
import { protectRoute, requireAdmin } from "../middleware/auth.middleware.js";

const router = express.Router();

// Clerk webhook endpoint (no auth - uses svix signature)
router.post("/clerk", express.raw({ type: "application/json" }), handleClerkWebhook);

// Manual sync (admin only)
router.post("/sync/:clerkId", protectRoute, requireAdmin, syncUserFromClerk);

export default router;
