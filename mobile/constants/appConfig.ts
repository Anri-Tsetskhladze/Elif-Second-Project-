// Academy Hub - App Configuration

export const APP_CONFIG = {
  name: 'Academy Hub',
  tagline: 'Connect. Learn. Succeed.',
  version: '1.0.0',
  buildNumber: 1,
  supportEmail: 'support@academyhub.app',
  websiteUrl: 'https://academyhub.app',
  privacyPolicyUrl: 'https://academyhub.app/privacy',
  termsOfServiceUrl: 'https://academyhub.app/terms',
} as const;

export const API_CONFIG = {
  baseUrl: process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5001/api',
  timeout: 30000,
  uploadTimeout: 120000,
  maxRetries: 3,
  retryDelay: 1000,

  endpoints: {
    auth: { sync: '/users/sync', me: '/users/me' },
    users: { profile: '/users/profile', follow: '/users/follow', search: '/users/search' },
    posts: { list: '/posts', create: '/posts', like: '/posts/:id/like', delete: '/posts/:id', byUser: '/posts/user/:username' },
    comments: { byPost: '/comments/post/:postId', create: '/comments/post/:postId', delete: '/comments/:id' },
    notifications: { list: '/notifications', delete: '/notifications/:id' },
    courses: { list: '/courses', search: '/courses/search', enroll: '/courses/:id/enroll' },
    studyGroups: { list: '/study-groups', create: '/study-groups', join: '/study-groups/:id/join' },
    events: { list: '/events', create: '/events', rsvp: '/events/:id/rsvp' },
    universities: { list: '/universities', search: '/universities/search' },
  },
} as const;

export const LIMITS = {
  post: { maxLength: 500, maxImages: 4, maxImageSizeMB: 10, maxVideoSizeMB: 50, maxVideoDurationSeconds: 60 },
  comment: { maxLength: 300 },
  profile: { bioMaxLength: 250, usernameMinLength: 3, usernameMaxLength: 20, locationMaxLength: 50, majorMaxLength: 100 },
  studyGroup: { nameMaxLength: 50, descriptionMaxLength: 500, maxMembers: 50 },
  event: { titleMaxLength: 100, descriptionMaxLength: 1000, maxAttendees: 500 },
  pagination: { defaultPageSize: 20, maxPageSize: 50 },
  search: { minQueryLength: 2, maxResults: 50, debounceMs: 300 },
} as const;

export const FEATURES = {
  auth: { googleOAuth: true, appleOAuth: true, emailPassword: false, studentEmailVerification: false },
  posts: { enabled: true, imageUpload: true, videoUpload: false, polls: false, scheduling: false, drafts: false },
  social: { likes: true, comments: true, shares: false, bookmarks: false, directMessages: false },
  student: { universityFilter: false, courseIntegration: false, studyGroups: false, events: false, marketplace: false, anonymousPosts: false, resourceSharing: false },
  profile: { bannerImage: true, editProfile: true, studentVerification: false, academicInfo: false },
  discovery: { trending: true, search: false, recommendations: false, hashtags: false },
  notifications: { inApp: true, push: false, email: false },
  security: { rateLimiting: true, reportContent: false, blockUsers: false },
  debug: { showApiLogs: __DEV__, showPerformanceMetrics: false, mockData: false },
} as const;

export const POST_CATEGORIES = [
  { id: 'general', label: 'General', icon: 'message-circle', color: '#6366F1' },
  { id: 'question', label: 'Question', icon: 'help-circle', color: '#F59E0B' },
  { id: 'study-group', label: 'Study Group', icon: 'users', color: '#10B981' },
  { id: 'event', label: 'Event', icon: 'calendar', color: '#EC4899' },
  { id: 'resource', label: 'Resource', icon: 'book-open', color: '#8B5CF6' },
  { id: 'marketplace', label: 'Marketplace', icon: 'shopping-bag', color: '#06B6D4' },
  { id: 'housing', label: 'Housing', icon: 'home', color: '#F97316' },
  { id: 'jobs', label: 'Jobs/Internships', icon: 'briefcase', color: '#14B8A6' },
] as const;

export type PostCategory = typeof POST_CATEGORIES[number]['id'];

export const ACADEMIC_YEARS = [
  { id: 'freshman', label: 'Freshman', year: 1 },
  { id: 'sophomore', label: 'Sophomore', year: 2 },
  { id: 'junior', label: 'Junior', year: 3 },
  { id: 'senior', label: 'Senior', year: 4 },
  { id: 'graduate', label: 'Graduate Student', year: 5 },
  { id: 'phd', label: 'PhD Candidate', year: 6 },
  { id: 'alumni', label: 'Alumni', year: 0 },
  { id: 'faculty', label: 'Faculty/Staff', year: -1 },
] as const;

export type AcademicYear = typeof ACADEMIC_YEARS[number]['id'];

export const NOTIFICATION_TYPES = {
  follow: { icon: 'user-plus', color: '#6366F1', label: 'followed you' },
  like: { icon: 'heart', color: '#EF4444', label: 'liked your post' },
  comment: { icon: 'message-circle', color: '#10B981', label: 'commented on your post' },
  mention: { icon: 'at-sign', color: '#F59E0B', label: 'mentioned you' },
  studyGroupInvite: { icon: 'users', color: '#8B5CF6', label: 'invited you to a study group' },
  eventReminder: { icon: 'calendar', color: '#EC4899', label: 'Event starting soon' },
  courseUpdate: { icon: 'book', color: '#06B6D4', label: 'Course update' },
} as const;

export const STORAGE_KEYS = {
  authToken: '@academyhub/auth_token',
  user: '@academyhub/user',
  theme: '@academyhub/theme',
  language: '@academyhub/language',
  notifications: '@academyhub/notifications_enabled',
  cachedPosts: '@academyhub/cached_posts',
  cachedProfile: '@academyhub/cached_profile',
  hasSeenOnboarding: '@academyhub/onboarding_complete',
  hasSelectedUniversity: '@academyhub/university_selected',
  postDraft: '@academyhub/post_draft',
} as const;

export const ANIMATION = {
  fast: 150,
  normal: 300,
  slow: 500,
  likeHeart: 300,
  modalSlide: 350,
  tabTransition: 200,
  pullToRefresh: 400,
} as const;

export const ERROR_MESSAGES = {
  network: 'Unable to connect. Please check your internet connection.',
  server: 'Something went wrong. Please try again later.',
  unauthorized: 'Please sign in to continue.',
  notFound: 'The content you\'re looking for doesn\'t exist.',
  rateLimited: 'Too many requests. Please wait a moment.',
  postTooLong: `Post must be ${LIMITS.post.maxLength} characters or less.`,
  bioTooLong: `Bio must be ${LIMITS.profile.bioMaxLength} characters or less.`,
  invalidUsername: 'Username can only contain letters, numbers, and underscores.',
  imageTooLarge: `Image must be less than ${LIMITS.post.maxImageSizeMB}MB.`,
  invalidImageType: 'Please select a valid image file (JPG, PNG, GIF).',
  uploadFailed: 'Failed to upload image. Please try again.',
} as const;

export const PATTERNS = {
  username: /^[a-zA-Z0-9_]{3,20}$/,
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  eduEmail: /^[^\s@]+@[^\s@]+\.edu$/,
  hashtag: /#[\w]+/g,
  mention: /@[\w]+/g,
  url: /https?:\/\/[^\s]+/g,
} as const;

export const DEFAULTS = {
  avatarUrl: 'https://ui-avatars.com/api/?name=User&background=6366F1&color=fff',
  bannerUrl: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=800',
  universityLogo: 'https://ui-avatars.com/api/?name=University&background=1F2937&color=fff',
} as const;
