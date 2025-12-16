import rateLimit from "express-rate-limit";

// Store for tracking requests (can be replaced with Redis for distributed systems)
const createRateLimiter = (options) => {
  return rateLimit({
    windowMs: options.windowMs || 60 * 1000, // 1 minute default
    max: options.max || 100,
    message: {
      error: options.message || "Too many requests, please try again later",
      retryAfter: Math.ceil((options.windowMs || 60000) / 1000),
    },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => {
      // Use user ID if authenticated, otherwise IP
      return req.auth?.userId || req.ip;
    },
    skip: (req) => {
      // Skip rate limiting for certain conditions
      return false;
    },
    handler: (req, res, next, options) => {
      res.status(429).json(options.message);
    },
  });
};

// General API rate limit
export const generalLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  max: 100, // 100 requests per minute
  message: "Too many requests, please slow down",
});

// Search rate limit (more restrictive)
export const searchLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  max: 30, // 30 searches per minute
  message: "Too many search requests, please wait a moment",
});

// Post creation rate limit
export const postCreationLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  max: 5, // 5 posts per minute
  message: "You're posting too quickly, please slow down",
});

// File upload rate limit
export const uploadLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // 10 uploads per minute
  message: "Too many uploads, please wait a moment",
});

// Auth rate limit (strictest)
export const authLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 attempts per 15 minutes
  message: "Too many authentication attempts, please try again later",
});

// Comment/reply rate limit
export const commentLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  max: 20, // 20 comments per minute
  message: "You're commenting too quickly, please slow down",
});

// Like rate limit
export const likeLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  max: 60, // 60 likes per minute
  message: "You're liking too quickly, please slow down",
});

// Follow rate limit
export const followLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  max: 30, // 30 follows per minute
  message: "You're following too quickly, please slow down",
});

// Notification rate limit
export const notificationLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  max: 60, // 60 requests per minute
  message: "Too many notification requests",
});

export default {
  generalLimiter,
  searchLimiter,
  postCreationLimiter,
  uploadLimiter,
  authLimiter,
  commentLimiter,
  likeLimiter,
  followLimiter,
  notificationLimiter,
};
