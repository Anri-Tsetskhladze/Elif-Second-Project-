import asyncHandler from "express-async-handler";
import { getAuth } from "@clerk/express";
import { Note, User, University } from "../models/index.js";
import noteService from "../services/noteService.js";

// Get all notes with filters
export const getNotes = asyncHandler(async (req, res) => {
  const { userId } = getAuth(req);
  const {
    q,
    subject,
    course,
    noteType,
    university,
    sortBy = "newest",
    page = 1,
    limit = 20,
  } = req.query;

  const user = userId ? await User.findOne({ clerkId: userId }) : null;
  const query = { status: "active", isPublic: true };

  if (subject) query.subject = new RegExp(subject, "i");
  if (course) query.course = new RegExp(course, "i");
  if (noteType) query.noteType = noteType;
  if (university) query.university = university;

  let notes;
  let total;

  if (q && q.length >= 2) {
    query.$text = { $search: q };
    [notes, total] = await Promise.all([
      Note.find(query, { score: { $meta: "textScore" } })
        .sort({ score: { $meta: "textScore" } })
        .skip((parseInt(page) - 1) * parseInt(limit))
        .limit(parseInt(limit))
        .populate("uploader", "username firstName lastName profilePicture isVerifiedStudent")
        .populate("university", "name")
        .lean(),
      Note.countDocuments(query),
    ]);
  } else {
    let sort = { createdAt: -1 };
    if (sortBy === "popular") sort = { downloadCount: -1, createdAt: -1 };
    if (sortBy === "mostDownloaded") sort = { downloadCount: -1 };

    [notes, total] = await Promise.all([
      Note.find(query)
        .sort(sort)
        .skip((parseInt(page) - 1) * parseInt(limit))
        .limit(parseInt(limit))
        .populate("uploader", "username firstName lastName profilePicture isVerifiedStudent")
        .populate("university", "name")
        .lean(),
      Note.countDocuments(query),
    ]);
  }

  const enrichedNotes = notes.map(note => ({
    ...note,
    isLiked: user ? note.likes?.some(id => id.toString() === user._id.toString()) : false,
    isSaved: user ? note.saves?.some(id => id.toString() === user._id.toString()) : false,
    likesCount: note.likes?.length || 0,
    savesCount: note.saves?.length || 0,
  }));

  res.json({
    notes: enrichedNotes,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / parseInt(limit)),
    },
  });
});

// Get notes by university
export const getNotesByUniversity = asyncHandler(async (req, res) => {
  const { userId } = getAuth(req);
  const { universityId } = req.params;
  const { subject, noteType, sortBy = "newest", page = 1, limit = 20 } = req.query;

  const user = userId ? await User.findOne({ clerkId: userId }) : null;
  const query = { university: universityId, status: "active", isPublic: true };

  if (subject) query.subject = new RegExp(subject, "i");
  if (noteType) query.noteType = noteType;

  let sort = { createdAt: -1 };
  if (sortBy === "popular") sort = { downloadCount: -1, createdAt: -1 };
  if (sortBy === "mostDownloaded") sort = { downloadCount: -1 };

  const [notes, total, subjects] = await Promise.all([
    Note.find(query)
      .sort(sort)
      .skip((parseInt(page) - 1) * parseInt(limit))
      .limit(parseInt(limit))
      .populate("uploader", "username firstName lastName profilePicture isVerifiedStudent")
      .lean(),
    Note.countDocuments(query),
    Note.getPopularSubjects(universityId, 20),
  ]);

  const enrichedNotes = notes.map(note => ({
    ...note,
    isLiked: user ? note.likes?.some(id => id.toString() === user._id.toString()) : false,
    isSaved: user ? note.saves?.some(id => id.toString() === user._id.toString()) : false,
    likesCount: note.likes?.length || 0,
    savesCount: note.saves?.length || 0,
  }));

  res.json({
    notes: enrichedNotes,
    subjects,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / parseInt(limit)),
    },
  });
});

// Get notes by subject
export const getNotesBySubject = asyncHandler(async (req, res) => {
  const { userId } = getAuth(req);
  const { subject } = req.params;
  const { university, noteType, sortBy = "newest", page = 1, limit = 20 } = req.query;

  const user = userId ? await User.findOne({ clerkId: userId }) : null;
  const query = { subject: new RegExp(`^${subject}$`, "i"), status: "active", isPublic: true };

  if (university) query.university = university;
  if (noteType) query.noteType = noteType;

  let sort = { createdAt: -1 };
  if (sortBy === "popular") sort = { downloadCount: -1, createdAt: -1 };
  if (sortBy === "mostDownloaded") sort = { downloadCount: -1 };

  const [notes, total] = await Promise.all([
    Note.find(query)
      .sort(sort)
      .skip((parseInt(page) - 1) * parseInt(limit))
      .limit(parseInt(limit))
      .populate("uploader", "username firstName lastName profilePicture isVerifiedStudent")
      .populate("university", "name")
      .lean(),
    Note.countDocuments(query),
  ]);

  const enrichedNotes = notes.map(note => ({
    ...note,
    isLiked: user ? note.likes?.some(id => id.toString() === user._id.toString()) : false,
    isSaved: user ? note.saves?.some(id => id.toString() === user._id.toString()) : false,
    likesCount: note.likes?.length || 0,
    savesCount: note.saves?.length || 0,
  }));

  res.json({
    notes: enrichedNotes,
    subject,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / parseInt(limit)),
    },
  });
});

// Get notes by user
export const getNotesByUser = asyncHandler(async (req, res) => {
  const { userId: viewerId } = getAuth(req);
  const { userId } = req.params;
  const { page = 1, limit = 20 } = req.query;

  const viewer = viewerId ? await User.findOne({ clerkId: viewerId }) : null;
  const targetUser = await User.findById(userId);

  if (!targetUser) {
    return res.status(404).json({ error: "User not found" });
  }

  const isOwner = viewer && viewer._id.toString() === userId;
  const query = { uploader: userId, status: "active" };
  if (!isOwner) query.isPublic = true;

  const [notes, total] = await Promise.all([
    Note.find(query)
      .sort({ createdAt: -1 })
      .skip((parseInt(page) - 1) * parseInt(limit))
      .limit(parseInt(limit))
      .populate("university", "name")
      .lean(),
    Note.countDocuments(query),
  ]);

  const enrichedNotes = notes.map(note => ({
    ...note,
    isLiked: viewer ? note.likes?.some(id => id.toString() === viewer._id.toString()) : false,
    isSaved: viewer ? note.saves?.some(id => id.toString() === viewer._id.toString()) : false,
    likesCount: note.likes?.length || 0,
    savesCount: note.saves?.length || 0,
  }));

  res.json({
    notes: enrichedNotes,
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

// Get saved notes
export const getSavedNotes = asyncHandler(async (req, res) => {
  const { userId } = getAuth(req);
  const { page = 1, limit = 20 } = req.query;

  const user = await User.findOne({ clerkId: userId });
  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }

  const query = { saves: user._id, status: "active" };

  const [notes, total] = await Promise.all([
    Note.find(query)
      .sort({ createdAt: -1 })
      .skip((parseInt(page) - 1) * parseInt(limit))
      .limit(parseInt(limit))
      .populate("uploader", "username firstName lastName profilePicture isVerifiedStudent")
      .populate("university", "name")
      .lean(),
    Note.countDocuments(query),
  ]);

  const enrichedNotes = notes.map(note => ({
    ...note,
    isLiked: note.likes?.some(id => id.toString() === user._id.toString()),
    isSaved: true,
    likesCount: note.likes?.length || 0,
    savesCount: note.saves?.length || 0,
  }));

  res.json({
    notes: enrichedNotes,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / parseInt(limit)),
    },
  });
});

// Get single note
export const getNote = asyncHandler(async (req, res) => {
  const { userId } = getAuth(req);
  const { id } = req.params;

  const user = userId ? await User.findOne({ clerkId: userId }) : null;

  const note = await Note.findById(id)
    .populate("uploader", "username firstName lastName profilePicture isVerifiedStudent")
    .populate("university", "name city state")
    .lean();

  if (!note || note.status !== "active") {
    return res.status(404).json({ error: "Note not found" });
  }

  if (!note.isPublic && (!user || note.uploader._id.toString() !== user._id.toString())) {
    return res.status(403).json({ error: "This note is private" });
  }

  res.json({
    note: {
      ...note,
      isLiked: user ? note.likes?.some(id => id.toString() === user._id.toString()) : false,
      isSaved: user ? note.saves?.some(id => id.toString() === user._id.toString()) : false,
      isOwn: user ? note.uploader._id.toString() === user._id.toString() : false,
      likesCount: note.likes?.length || 0,
      savesCount: note.saves?.length || 0,
    },
  });
});

// Create note
export const createNote = asyncHandler(async (req, res) => {
  const { userId } = getAuth(req);
  const {
    title,
    description,
    universityId,
    subject,
    course,
    professor,
    semester,
    noteType,
    tags,
    isPublic,
  } = req.body;

  const user = await User.findOne({ clerkId: userId });
  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }

  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ error: "At least one file is required" });
  }

  if (!title || title.trim().length < 3) {
    return res.status(400).json({ error: "Title must be at least 3 characters" });
  }

  // Upload files
  const uploadedFiles = await noteService.uploadMultipleFiles(req.files, "notes");

  // Generate thumbnail for first PDF
  let thumbnailUrl = null;
  const firstPdf = uploadedFiles.find(f => f.fileType === "pdf");
  if (firstPdf) {
    thumbnailUrl = await noteService.generateThumbnail(firstPdf.url);
  } else {
    const firstImage = uploadedFiles.find(f => f.fileType === "image");
    if (firstImage) {
      thumbnailUrl = firstImage.url;
    }
  }

  // Format course code
  const formattedCourse = noteService.formatCourseCode(course);

  // Parse tags
  let parsedTags = [];
  if (tags) {
    parsedTags = typeof tags === "string" ? tags.split(",").map(t => t.trim().toLowerCase()) : tags;
  }

  const note = await Note.create({
    uploader: user._id,
    title: title.trim(),
    description: description?.trim(),
    university: universityId || user.university,
    subject: subject?.trim(),
    course: formattedCourse,
    professor: professor?.trim(),
    semester: semester?.trim(),
    noteType: noteType || "other",
    files: uploadedFiles,
    thumbnailUrl,
    tags: parsedTags.slice(0, 10),
    isPublic: isPublic !== false,
  });

  // Add subject to suggestions
  if (subject) noteService.addSubject(subject);

  const populated = await Note.findById(note._id)
    .populate("uploader", "username firstName lastName profilePicture isVerifiedStudent")
    .populate("university", "name");

  res.status(201).json({
    message: "Note uploaded successfully",
    note: populated,
  });
});

// Update note
export const updateNote = asyncHandler(async (req, res) => {
  const { userId } = getAuth(req);
  const { id } = req.params;
  const { title, description, subject, course, professor, semester, noteType, tags, isPublic } = req.body;

  const user = await User.findOne({ clerkId: userId });
  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }

  const note = await Note.findById(id);
  if (!note) {
    return res.status(404).json({ error: "Note not found" });
  }

  if (note.uploader.toString() !== user._id.toString()) {
    return res.status(403).json({ error: "You can only edit your own notes" });
  }

  if (title !== undefined) note.title = title.trim();
  if (description !== undefined) note.description = description?.trim();
  if (subject !== undefined) note.subject = subject?.trim();
  if (course !== undefined) note.course = noteService.formatCourseCode(course);
  if (professor !== undefined) note.professor = professor?.trim();
  if (semester !== undefined) note.semester = semester?.trim();
  if (noteType !== undefined) note.noteType = noteType;
  if (isPublic !== undefined) note.isPublic = isPublic;

  if (tags !== undefined) {
    const parsedTags = typeof tags === "string" ? tags.split(",").map(t => t.trim().toLowerCase()) : tags;
    note.tags = parsedTags.slice(0, 10);
  }

  await note.save();

  const populated = await Note.findById(note._id)
    .populate("uploader", "username firstName lastName profilePicture isVerifiedStudent")
    .populate("university", "name");

  res.json({
    message: "Note updated successfully",
    note: populated,
  });
});

// Delete note
export const deleteNote = asyncHandler(async (req, res) => {
  const { userId } = getAuth(req);
  const { id } = req.params;

  const user = await User.findOne({ clerkId: userId });
  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }

  const note = await Note.findById(id);
  if (!note) {
    return res.status(404).json({ error: "Note not found" });
  }

  const isOwner = note.uploader.toString() === user._id.toString();
  const isAdmin = user.role === "admin" || user.role === "moderator";

  if (!isOwner && !isAdmin) {
    return res.status(403).json({ error: "You can only delete your own notes" });
  }

  await note.deleteOne();

  res.json({ message: "Note deleted successfully" });
});

// Toggle like
export const toggleLike = asyncHandler(async (req, res) => {
  const { userId } = getAuth(req);
  const { id } = req.params;

  const user = await User.findOne({ clerkId: userId });
  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }

  const note = await Note.findById(id);
  if (!note || note.status !== "active") {
    return res.status(404).json({ error: "Note not found" });
  }

  const userIdStr = user._id.toString();
  const isLiked = note.likes.some(id => id.toString() === userIdStr);

  if (isLiked) {
    note.likes = note.likes.filter(id => id.toString() !== userIdStr);
  } else {
    note.likes.push(user._id);
  }

  await note.save();

  res.json({
    message: isLiked ? "Like removed" : "Note liked",
    isLiked: !isLiked,
    likesCount: note.likes.length,
  });
});

// Toggle save
export const toggleSave = asyncHandler(async (req, res) => {
  const { userId } = getAuth(req);
  const { id } = req.params;

  const user = await User.findOne({ clerkId: userId });
  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }

  const note = await Note.findById(id);
  if (!note || note.status !== "active") {
    return res.status(404).json({ error: "Note not found" });
  }

  const userIdStr = user._id.toString();
  const isSaved = note.saves.some(id => id.toString() === userIdStr);

  if (isSaved) {
    note.saves = note.saves.filter(id => id.toString() !== userIdStr);
  } else {
    note.saves.push(user._id);
  }

  await note.save();

  res.json({
    message: isSaved ? "Note unsaved" : "Note saved",
    isSaved: !isSaved,
    savesCount: note.saves.length,
  });
});

// Get download URL
export const getDownloadUrl = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { fileIndex = 0 } = req.query;

  const note = await Note.findById(id);
  if (!note || note.status !== "active") {
    return res.status(404).json({ error: "Note not found" });
  }

  const file = note.files[parseInt(fileIndex)];
  if (!file) {
    return res.status(404).json({ error: "File not found" });
  }

  // Increment download count
  note.downloadCount += 1;
  await note.save();

  const downloadUrl = noteService.getDownloadUrl(file.url);

  res.json({
    downloadUrl,
    fileName: file.fileName,
    fileType: file.fileType,
    downloadCount: note.downloadCount,
  });
});

// Get subject suggestions
export const getSubjectSuggestions = asyncHandler(async (req, res) => {
  const { q, university } = req.query;

  const suggestions = await noteService.suggestSubjects(q, university, Note);

  res.json({ suggestions });
});

// Get course suggestions
export const getCourseSuggestions = asyncHandler(async (req, res) => {
  const { q, university } = req.query;

  const suggestions = await noteService.suggestCourses(q, university, Note);

  res.json({ suggestions });
});

// Get popular subjects
export const getPopularSubjects = asyncHandler(async (req, res) => {
  const { university, limit = 20 } = req.query;

  const subjects = await Note.getPopularSubjects(university, parseInt(limit));

  res.json({ subjects });
});
