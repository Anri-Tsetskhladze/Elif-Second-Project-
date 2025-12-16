// Academy Hub - Backend Configuration

const APP_CONFIG = {
  name: 'Academy Hub',
  version: '1.0.0',
  environment: process.env.NODE_ENV || 'development',
  api: { version: 'v1', prefix: '/api' },
};

const SERVER_CONFIG = {
  port: parseInt(process.env.PORT, 10) || 5001,
  host: process.env.HOST || '0.0.0.0',
  cors: {
    origin: process.env.NODE_ENV === 'production' ? ['https://academyhub.app', 'https://www.academyhub.app'] : '*',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  },
  bodyLimit: '10mb',
  parameterLimit: 1000,
};

const DATABASE_CONFIG = {
  uri: process.env.MONGO_URI,
  options: { maxPoolSize: 10, serverSelectionTimeoutMS: 5000, socketTimeoutMS: 45000 },
  collections: {
    users: 'users', posts: 'posts', comments: 'comments', notifications: 'notifications',
    courses: 'courses', studyGroups: 'studygroups', events: 'events', universities: 'universities', marketplace: 'marketplace',
  },
};

const LIMITS = {
  post: { maxLength: 500, maxImages: 4, maxImageSizeMB: 10, maxVideoSizeMB: 50, maxVideoDurationSeconds: 60 },
  comment: { maxLength: 300 },
  profile: { bioMaxLength: 250, usernameMinLength: 3, usernameMaxLength: 20, locationMaxLength: 50, majorMaxLength: 100 },
  studyGroup: { nameMaxLength: 50, descriptionMaxLength: 500, maxMembers: 50 },
  event: { titleMaxLength: 100, descriptionMaxLength: 1000, maxAttendees: 500 },
  pagination: { defaultPageSize: 20, maxPageSize: 50 },
  upload: { maxFileSizeMB: 10, allowedImageTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'], allowedVideoTypes: ['video/mp4', 'video/quicktime'] },
};

const FEATURES = {
  auth: { clerkEnabled: true, studentEmailVerification: false },
  posts: { enabled: true, imageUpload: true, videoUpload: false, polls: false, scheduling: false },
  student: { universityFilter: false, courseIntegration: false, studyGroups: false, events: false, marketplace: false, anonymousPosts: false },
  security: { rateLimiting: true, arcjetEnabled: !!process.env.ARCJET_KEY, reportContent: false, blockUsers: false },
  externalApis: { collegeScorecardEnabled: !!process.env.COLLEGE_SCORECARD_API_KEY },
};

const RATE_LIMIT = {
  general: { windowMs: 15 * 60 * 1000, maxRequests: 100 },
  auth: { windowMs: 15 * 60 * 1000, maxRequests: 10 },
  posts: { windowMs: 60 * 1000, maxRequests: 10 },
  upload: { windowMs: 60 * 1000, maxRequests: 5 },
};

const CLOUDINARY_CONFIG = {
  cloudName: process.env.CLOUDINARY_CLOUD_NAME,
  apiKey: process.env.CLOUDINARY_API_KEY,
  apiSecret: process.env.CLOUDINARY_API_SECRET,
  uploadOptions: {
    postImage: { folder: 'academyhub/posts', transformation: [{ width: 1200, height: 1200, crop: 'limit' }, { quality: 'auto' }, { fetch_format: 'auto' }] },
    profilePicture: { folder: 'academyhub/profiles', transformation: [{ width: 400, height: 400, crop: 'fill', gravity: 'face' }, { quality: 'auto' }, { fetch_format: 'auto' }] },
    bannerImage: { folder: 'academyhub/banners', transformation: [{ width: 1500, height: 500, crop: 'fill' }, { quality: 'auto' }, { fetch_format: 'auto' }] },
  },
};

const CLERK_CONFIG = {
  publishableKey: process.env.CLERK_PUBLISHABLE_KEY,
  secretKey: process.env.CLERK_SECRET_KEY,
  session: { maxAge: 7 * 24 * 60 * 60 },
};

const NOTIFICATION_TYPES = {
  FOLLOW: 'follow', LIKE: 'like', COMMENT: 'comment', MENTION: 'mention',
  STUDY_GROUP_INVITE: 'study_group_invite', EVENT_REMINDER: 'event_reminder', COURSE_UPDATE: 'course_update',
};

const POST_CATEGORIES = {
  GENERAL: 'general', QUESTION: 'question', STUDY_GROUP: 'study_group', EVENT: 'event',
  RESOURCE: 'resource', MARKETPLACE: 'marketplace', HOUSING: 'housing', JOBS: 'jobs',
};

const USER_ROLES = { STUDENT: 'student', FACULTY: 'faculty', ALUMNI: 'alumni', ADMIN: 'admin', MODERATOR: 'moderator' };

const ACADEMIC_YEARS = { FRESHMAN: 'freshman', SOPHOMORE: 'sophomore', JUNIOR: 'junior', SENIOR: 'senior', GRADUATE: 'graduate', PHD: 'phd', ALUMNI: 'alumni', FACULTY: 'faculty' };

const EXTERNAL_APIS = {
  collegeScorecard: {
    baseUrl: 'https://api.data.gov/ed/collegescorecard/v1',
    apiKey: process.env.COLLEGE_SCORECARD_API_KEY,
    endpoints: { schools: '/schools' },
    fields: ['id', 'school.name', 'school.city', 'school.state', 'school.school_url', 'school.price_calculator_url', 'latest.student.size', 'latest.admissions.admission_rate.overall'].join(','),
  },
};

const ERROR_CODES = {
  AUTH_REQUIRED: { code: 1001, message: 'Authentication required' },
  AUTH_INVALID_TOKEN: { code: 1002, message: 'Invalid authentication token' },
  AUTH_EXPIRED_TOKEN: { code: 1003, message: 'Authentication token expired' },
  FORBIDDEN: { code: 2001, message: 'Access forbidden' },
  NOT_OWNER: { code: 2002, message: 'You do not own this resource' },
  VALIDATION_FAILED: { code: 3001, message: 'Validation failed' },
  INVALID_INPUT: { code: 3002, message: 'Invalid input provided' },
  CONTENT_TOO_LONG: { code: 3003, message: 'Content exceeds maximum length' },
  NOT_FOUND: { code: 4001, message: 'Resource not found' },
  USER_NOT_FOUND: { code: 4002, message: 'User not found' },
  POST_NOT_FOUND: { code: 4003, message: 'Post not found' },
  COMMENT_NOT_FOUND: { code: 4004, message: 'Comment not found' },
  RATE_LIMITED: { code: 5001, message: 'Too many requests' },
  INTERNAL_ERROR: { code: 9001, message: 'Internal server error' },
  DATABASE_ERROR: { code: 9002, message: 'Database error' },
  EXTERNAL_API_ERROR: { code: 9003, message: 'External API error' },
};

const PATTERNS = {
  username: /^[a-zA-Z0-9_]{3,20}$/,
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  eduEmail: /^[^\s@]+@[^\s@]+\.edu$/,
  objectId: /^[0-9a-fA-F]{24}$/,
};

module.exports = {
  APP_CONFIG, SERVER_CONFIG, DATABASE_CONFIG, LIMITS, FEATURES, RATE_LIMIT,
  CLOUDINARY_CONFIG, CLERK_CONFIG, NOTIFICATION_TYPES, POST_CATEGORIES,
  USER_ROLES, ACADEMIC_YEARS, EXTERNAL_APIS, ERROR_CODES, PATTERNS,
};
