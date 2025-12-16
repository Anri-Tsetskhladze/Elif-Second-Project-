import asyncHandler from "express-async-handler";
import { getAuth } from "@clerk/express";
import { Review, User, University } from "../models/index.js";

// Get all reviews with filters
export const getReviews = asyncHandler(async (req, res) => {
  const { userId } = getAuth(req);
  const { universityId, rating, sortBy = "newest", page = 1, limit = 10 } = req.query;

  const user = userId ? await User.findOne({ clerkId: userId }) : null;
  const query = { status: "active" };

  if (universityId) {
    query.university = universityId;
  }

  if (rating) {
    query.overallRating = parseInt(rating);
  }

  let sort = { createdAt: -1 };
  switch (sortBy) {
    case "helpful":
      sort = { helpfulCount: -1, createdAt: -1 };
      break;
    case "highest":
      sort = { overallRating: -1, createdAt: -1 };
      break;
    case "lowest":
      sort = { overallRating: 1, createdAt: -1 };
      break;
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const [reviews, total] = await Promise.all([
    Review.find(query)
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit))
      .populate("author", "username firstName lastName profilePicture isVerifiedStudent")
      .populate("university", "name city state images.logo")
      .lean(),
    Review.countDocuments(query),
  ]);

  const enrichedReviews = reviews.map(review => {
    const isHelpful = user ? review.helpfulVotes?.some(id => id.toString() === user._id.toString()) : false;

    // Hide author info for anonymous reviews
    if (review.isAnonymous) {
      return {
        ...review,
        author: { username: "Anonymous", isAnonymous: true },
        isHelpful,
        helpfulCount: review.helpfulVotes?.length || 0,
      };
    }

    return {
      ...review,
      isHelpful,
      helpfulCount: review.helpfulVotes?.length || 0,
    };
  });

  res.json({
    reviews: enrichedReviews,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / parseInt(limit)),
    },
  });
});

// Get reviews for a university
export const getUniversityReviews = asyncHandler(async (req, res) => {
  const { userId } = getAuth(req);
  const { universityId } = req.params;
  const { rating, sortBy = "newest", page = 1, limit = 10 } = req.query;

  const user = userId ? await User.findOne({ clerkId: userId }) : null;
  const query = { university: universityId, status: "active" };

  if (rating) {
    query.overallRating = parseInt(rating);
  }

  let sort = { createdAt: -1 };
  switch (sortBy) {
    case "helpful":
      sort = { helpfulCount: -1, createdAt: -1 };
      break;
    case "highest":
      sort = { overallRating: -1, createdAt: -1 };
      break;
    case "lowest":
      sort = { overallRating: 1, createdAt: -1 };
      break;
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const [reviews, total, stats] = await Promise.all([
    Review.find(query)
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit))
      .populate("author", "username firstName lastName profilePicture isVerifiedStudent")
      .lean(),
    Review.countDocuments(query),
    Review.getStats(universityId),
  ]);

  const enrichedReviews = reviews.map(review => {
    const isHelpful = user ? review.helpfulVotes?.some(id => id.toString() === user._id.toString()) : false;

    if (review.isAnonymous) {
      return {
        ...review,
        author: { username: "Anonymous", isAnonymous: true },
        isHelpful,
        helpfulCount: review.helpfulVotes?.length || 0,
      };
    }

    return {
      ...review,
      isHelpful,
      helpfulCount: review.helpfulVotes?.length || 0,
    };
  });

  res.json({
    reviews: enrichedReviews,
    stats,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / parseInt(limit)),
    },
  });
});

// Get reviews by user
export const getUserReviews = asyncHandler(async (req, res) => {
  const { userId: targetUserId } = req.params;
  const { page = 1, limit = 10 } = req.query;

  const targetUser = await User.findById(targetUserId);
  if (!targetUser) {
    return res.status(404).json({ error: "User not found" });
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const [reviews, total] = await Promise.all([
    Review.find({ author: targetUserId, status: "active", isAnonymous: false })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate("university", "name city state images.logo")
      .lean(),
    Review.countDocuments({ author: targetUserId, status: "active", isAnonymous: false }),
  ]);

  const enrichedReviews = reviews.map(review => ({
    ...review,
    helpfulCount: review.helpfulVotes?.length || 0,
  }));

  res.json({
    reviews: enrichedReviews,
    user: {
      _id: targetUser._id,
      username: targetUser.username,
      firstName: targetUser.firstName,
      lastName: targetUser.lastName,
    },
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / parseInt(limit)),
    },
  });
});

// Get single review
export const getReview = asyncHandler(async (req, res) => {
  const { userId } = getAuth(req);
  const { id } = req.params;

  const user = userId ? await User.findOne({ clerkId: userId }) : null;

  const review = await Review.findById(id)
    .populate("author", "username firstName lastName profilePicture isVerifiedStudent")
    .populate("university", "name city state images.logo")
    .lean();

  if (!review) {
    return res.status(404).json({ error: "Review not found" });
  }

  if (review.status !== "active") {
    return res.status(404).json({ error: "Review not found" });
  }

  const isHelpful = user ? review.helpfulVotes?.some(id => id.toString() === user._id.toString()) : false;
  const isOwn = user ? review.author._id.toString() === user._id.toString() : false;

  let responseReview = {
    ...review,
    isHelpful,
    isOwn,
    helpfulCount: review.helpfulVotes?.length || 0,
  };

  if (review.isAnonymous && !isOwn) {
    responseReview.author = { username: "Anonymous", isAnonymous: true };
  }

  res.json({ review: responseReview });
});

// Create review
export const createReview = asyncHandler(async (req, res) => {
  const { userId } = getAuth(req);
  const {
    universityId,
    overallRating,
    title,
    content,
    categoryRatings,
    pros,
    cons,
    isAnonymous,
  } = req.body;

  const user = await User.findOne({ clerkId: userId });
  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }

  const university = await University.findById(universityId);
  if (!university) {
    return res.status(404).json({ error: "University not found" });
  }

  // Check if user already reviewed this university
  const existingReview = await Review.findOne({
    author: user._id,
    university: universityId,
  });

  if (existingReview) {
    return res.status(400).json({ error: "You have already reviewed this university" });
  }

  // Calculate overall from category ratings if not provided
  let calculatedOverall = overallRating;
  if (!calculatedOverall && categoryRatings) {
    const values = Object.values(categoryRatings).filter(v => v != null);
    if (values.length > 0) {
      calculatedOverall = Math.round(values.reduce((a, b) => a + b, 0) / values.length);
    }
  }

  if (!calculatedOverall || calculatedOverall < 1 || calculatedOverall > 5) {
    return res.status(400).json({ error: "Valid rating required (1-5)" });
  }

  const review = await Review.create({
    author: user._id,
    university: universityId,
    overallRating: calculatedOverall,
    title,
    content,
    categoryRatings,
    pros: pros?.slice(0, 5),
    cons: cons?.slice(0, 5),
    isAnonymous: isAnonymous || false,
  });

  const populated = await Review.findById(review._id)
    .populate("author", "username firstName lastName profilePicture isVerifiedStudent")
    .populate("university", "name city state images.logo");

  res.status(201).json({
    message: "Review created successfully",
    review: populated,
  });
});

// Update review
export const updateReview = asyncHandler(async (req, res) => {
  const { userId } = getAuth(req);
  const { id } = req.params;
  const { overallRating, title, content, categoryRatings, pros, cons, isAnonymous } = req.body;

  const user = await User.findOne({ clerkId: userId });
  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }

  const review = await Review.findById(id);
  if (!review) {
    return res.status(404).json({ error: "Review not found" });
  }

  if (review.author.toString() !== user._id.toString()) {
    return res.status(403).json({ error: "You can only edit your own reviews" });
  }

  // Update fields
  if (overallRating !== undefined) review.overallRating = overallRating;
  if (title !== undefined) review.title = title;
  if (content !== undefined) review.content = content;
  if (categoryRatings !== undefined) review.categoryRatings = categoryRatings;
  if (pros !== undefined) review.pros = pros.slice(0, 5);
  if (cons !== undefined) review.cons = cons.slice(0, 5);
  if (isAnonymous !== undefined) review.isAnonymous = isAnonymous;

  await review.save();

  const populated = await Review.findById(review._id)
    .populate("author", "username firstName lastName profilePicture isVerifiedStudent")
    .populate("university", "name city state images.logo");

  res.json({
    message: "Review updated successfully",
    review: populated,
  });
});

// Delete review
export const deleteReview = asyncHandler(async (req, res) => {
  const { userId } = getAuth(req);
  const { id } = req.params;

  const user = await User.findOne({ clerkId: userId });
  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }

  const review = await Review.findById(id);
  if (!review) {
    return res.status(404).json({ error: "Review not found" });
  }

  const isOwner = review.author.toString() === user._id.toString();
  const isAdmin = user.role === "admin" || user.role === "moderator";

  if (!isOwner && !isAdmin) {
    return res.status(403).json({ error: "You can only delete your own reviews" });
  }

  await review.deleteOne();

  res.json({ message: "Review deleted successfully" });
});

// Mark review as helpful
export const markHelpful = asyncHandler(async (req, res) => {
  const { userId } = getAuth(req);
  const { id } = req.params;

  const user = await User.findOne({ clerkId: userId });
  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }

  const review = await Review.findById(id);
  if (!review) {
    return res.status(404).json({ error: "Review not found" });
  }

  if (review.status !== "active") {
    return res.status(400).json({ error: "Cannot vote on this review" });
  }

  // Toggle helpful vote
  const userIdStr = user._id.toString();
  const alreadyVoted = review.helpfulVotes.some(id => id.toString() === userIdStr);

  if (alreadyVoted) {
    review.helpfulVotes = review.helpfulVotes.filter(id => id.toString() !== userIdStr);
  } else {
    review.helpfulVotes.push(user._id);
  }

  await review.save();

  res.json({
    message: alreadyVoted ? "Vote removed" : "Marked as helpful",
    isHelpful: !alreadyVoted,
    helpfulCount: review.helpfulVotes.length,
  });
});

// Report review
export const reportReview = asyncHandler(async (req, res) => {
  const { userId } = getAuth(req);
  const { id } = req.params;
  const { reason } = req.body;

  const user = await User.findOne({ clerkId: userId });
  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }

  const review = await Review.findById(id);
  if (!review) {
    return res.status(404).json({ error: "Review not found" });
  }

  // Check if already reported by this user
  const alreadyReported = review.reports.some(r => r.user.toString() === user._id.toString());
  if (alreadyReported) {
    return res.status(400).json({ error: "You have already reported this review" });
  }

  review.reports.push({
    user: user._id,
    reason: reason || "No reason provided",
  });
  review.reportCount += 1;

  // Auto-flag if too many reports
  if (review.reportCount >= 5) {
    review.status = "flagged";
  }

  await review.save();

  res.json({ message: "Review reported successfully" });
});

// Get my review for a university
export const getMyReview = asyncHandler(async (req, res) => {
  const { userId } = getAuth(req);
  const { universityId } = req.params;

  const user = await User.findOne({ clerkId: userId });
  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }

  const review = await Review.findOne({
    author: user._id,
    university: universityId,
  })
    .populate("university", "name city state images.logo")
    .lean();

  if (!review) {
    return res.json({ review: null, hasReviewed: false });
  }

  res.json({
    review: {
      ...review,
      helpfulCount: review.helpfulVotes?.length || 0,
    },
    hasReviewed: true,
  });
});
