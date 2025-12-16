import cloudinary from "../config/cloudinary.js";

const ALLOWED_TYPES = {
  "application/pdf": "pdf",
  "application/msword": "doc",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
  "application/vnd.ms-powerpoint": "ppt",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation": "pptx",
  "application/vnd.ms-excel": "xls",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "xlsx",
  "image/jpeg": "image",
  "image/png": "image",
  "image/gif": "image",
  "image/webp": "image",
};

const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25MB

export const validateFile = (file) => {
  if (!file) {
    return { valid: false, error: "No file provided" };
  }

  if (file.size > MAX_FILE_SIZE) {
    return { valid: false, error: `File too large. Maximum size is 25MB` };
  }

  const fileType = ALLOWED_TYPES[file.mimetype];
  if (!fileType) {
    return { valid: false, error: "File type not allowed. Supported: PDF, DOC, DOCX, PPT, PPTX, XLS, XLSX, images" };
  }

  return { valid: true, fileType };
};

export const uploadFile = async (file, folder = "notes") => {
  const validation = validateFile(file);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  const b64 = Buffer.from(file.buffer).toString("base64");
  const dataURI = `data:${file.mimetype};base64,${b64}`;

  const resourceType = validation.fileType === "image" ? "image" : "raw";

  const result = await cloudinary.uploader.upload(dataURI, {
    folder: `academy-hub/${folder}`,
    resource_type: resourceType,
    use_filename: true,
    unique_filename: true,
  });

  return {
    url: result.secure_url,
    fileName: file.originalname,
    fileType: validation.fileType,
    fileSize: file.size,
    publicId: result.public_id,
  };
};

export const uploadMultipleFiles = async (files, folder = "notes") => {
  if (!files || files.length === 0) {
    throw new Error("No files provided");
  }

  if (files.length > 10) {
    throw new Error("Maximum 10 files allowed");
  }

  const uploadPromises = files.map(file => uploadFile(file, folder));
  return Promise.all(uploadPromises);
};

export const generateThumbnail = async (pdfUrl) => {
  try {
    const result = await cloudinary.uploader.upload(pdfUrl, {
      folder: "academy-hub/thumbnails",
      format: "jpg",
      page: 1,
      transformation: [
        { width: 400, height: 566, crop: "fill" },
        { quality: "auto" },
      ],
    });
    return result.secure_url;
  } catch (error) {
    console.error("Thumbnail generation failed:", error);
    return null;
  }
};

export const deleteFile = async (publicId, resourceType = "raw") => {
  try {
    await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
    return true;
  } catch (error) {
    console.error("File deletion failed:", error);
    return false;
  }
};

export const getDownloadUrl = (url) => {
  if (url.includes("cloudinary.com")) {
    return url.replace("/upload/", "/upload/fl_attachment/");
  }
  return url;
};

// Subject/Course suggestions
const commonSubjects = new Set();

export const addSubject = (subject) => {
  if (subject && subject.trim()) {
    commonSubjects.add(subject.trim().toLowerCase());
  }
};

export const suggestSubjects = async (query, universityId, Note) => {
  if (!query || query.length < 2) return [];

  const regex = new RegExp(query, "i");

  const dbSubjects = await Note.aggregate([
    {
      $match: {
        status: "active",
        subject: regex,
        ...(universityId && { university: universityId }),
      },
    },
    { $group: { _id: "$subject" } },
    { $limit: 10 },
  ]);

  return dbSubjects.map(s => s._id).filter(Boolean);
};

export const suggestCourses = async (query, universityId, Note) => {
  if (!query || query.length < 2) return [];

  const regex = new RegExp(query, "i");

  const dbCourses = await Note.aggregate([
    {
      $match: {
        status: "active",
        course: regex,
        ...(universityId && { university: universityId }),
      },
    },
    { $group: { _id: "$course" } },
    { $limit: 10 },
  ]);

  return dbCourses.map(c => c._id).filter(Boolean);
};

export const formatCourseCode = (course) => {
  if (!course) return course;
  return course.trim().toUpperCase().replace(/\s+/g, " ");
};

export default {
  validateFile,
  uploadFile,
  uploadMultipleFiles,
  generateThumbnail,
  deleteFile,
  getDownloadUrl,
  addSubject,
  suggestSubjects,
  suggestCourses,
  formatCourseCode,
};
