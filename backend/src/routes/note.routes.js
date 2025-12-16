import express from "express";
import multer from "multer";
import {
  getNotes,
  getNotesByUniversity,
  getNotesBySubject,
  getNotesByUser,
  getSavedNotes,
  getNote,
  createNote,
  updateNote,
  deleteNote,
  toggleLike,
  toggleSave,
  getDownloadUrl,
  getSubjectSuggestions,
  getCourseSuggestions,
  getPopularSubjects,
} from "../controllers/note.controller.js";
import { protectRoute, optionalAuth } from "../middleware/auth.middleware.js";

const router = express.Router();

// Multer config for note files
const storage = multer.memoryStorage();
const noteUpload = multer({
  storage,
  limits: { fileSize: 25 * 1024 * 1024 }, // 25MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.ms-powerpoint",
      "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "image/jpeg",
      "image/png",
      "image/gif",
      "image/webp",
    ];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("File type not allowed"), false);
    }
  },
});

// Public routes (specific paths first)
router.get("/suggestions/subjects", getSubjectSuggestions);
router.get("/suggestions/courses", getCourseSuggestions);
router.get("/subjects/popular", getPopularSubjects);
router.get("/saved", protectRoute, getSavedNotes);
router.get("/university/:universityId", optionalAuth, getNotesByUniversity);
router.get("/subject/:subject", optionalAuth, getNotesBySubject);
router.get("/user/:userId", optionalAuth, getNotesByUser);
router.get("/", optionalAuth, getNotes);
router.get("/:id", optionalAuth, getNote);
router.get("/:id/download", getDownloadUrl);

// Protected routes
router.post("/", protectRoute, noteUpload.array("files", 10), createNote);
router.put("/:id", protectRoute, updateNote);
router.delete("/:id", protectRoute, deleteNote);
router.post("/:id/like", protectRoute, toggleLike);
router.post("/:id/save", protectRoute, toggleSave);

export default router;
