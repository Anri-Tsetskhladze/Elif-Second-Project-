import axios, { AxiosInstance } from "axios";
import { useAuth } from "@clerk/clerk-expo";
import { Platform } from "react-native";

// Android emulator uses 10.0.2.2 to access host machine's localhost
const getApiUrl = () => {
  const envUrl = process.env.EXPO_PUBLIC_API_URL;
  if (envUrl && envUrl.includes("localhost") && Platform.OS === "android") {
    return envUrl.replace("localhost", "10.0.2.2");
  }
  return envUrl || "http://localhost:5001/api";
};

const API_BASE_URL = getApiUrl();

export const createApiClient = (getToken: () => Promise<string | null>): AxiosInstance => {
  const api = axios.create({ baseURL: API_BASE_URL });

  api.interceptors.request.use(async (config) => {
    const token = await getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });

  return api;
};

export const useApiClient = (): AxiosInstance => {
  const { getToken } = useAuth();
  return createApiClient(getToken);
};

export const userApi = {
  syncUser: (api: AxiosInstance) => api.post("/users/sync"),
  getCurrentUser: (api: AxiosInstance) => api.get("/users/me"),
  updateProfile: (api: AxiosInstance, data: any) => api.put("/users/profile", data),
  uploadProfileImage: (api: AxiosInstance, formData: FormData) =>
    api.post("/users/profile/image", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  getByUsername: (api: AxiosInstance, username: string) =>
    api.get(`/users/${username}`),
  getById: (api: AxiosInstance, userId: string) =>
    api.get(`/users/id/${userId}`),
  follow: (api: AxiosInstance, userId: string) =>
    api.post(`/users/${userId}/follow`),
  unfollow: (api: AxiosInstance, userId: string) =>
    api.post(`/users/${userId}/unfollow`),
  getFollowers: (api: AxiosInstance, userId: string, params?: { page?: number; limit?: number }) =>
    api.get(`/users/${userId}/followers`, { params }),
  getFollowing: (api: AxiosInstance, userId: string, params?: { page?: number; limit?: number }) =>
    api.get(`/users/${userId}/following`, { params }),
  getUserStats: (api: AxiosInstance, userId: string) =>
    api.get(`/users/${userId}/stats`),
  updatePrivacy: (api: AxiosInstance, settings: { isPrivate?: boolean; showEmail?: boolean }) =>
    api.put("/users/privacy", settings),
};

// Forum/Post API
export const forumApi = {
  // Categories
  getCategories: (api: AxiosInstance) => api.get("/posts/categories"),

  // Feed
  getFeed: (api: AxiosInstance, params?: {
    category?: string;
    university?: string;
    sortBy?: "newest" | "popular" | "unanswered";
    following?: boolean;
    page?: number;
    limit?: number;
  }) => api.get("/posts", { params }),

  // By category
  getByCategory: (api: AxiosInstance, category: string, params?: {
    university?: string;
    sortBy?: string;
    page?: number;
    limit?: number;
  }) => api.get(`/posts/category/${category}`, { params }),

  // Single post
  getPost: (api: AxiosInstance, postId: string) => api.get(`/posts/${postId}`),

  // Replies
  getReplies: (api: AxiosInstance, postId: string, params?: {
    page?: number;
    limit?: number;
    sortBy?: "oldest" | "newest" | "popular";
  }) => api.get(`/posts/${postId}/replies`, { params }),

  // Create post
  createPost: (api: AxiosInstance, data: FormData) =>
    api.post("/posts", data, {
      headers: { "Content-Type": "multipart/form-data" },
    }),

  // Create reply
  createReply: (api: AxiosInstance, postId: string, data: FormData) =>
    api.post(`/posts/${postId}/reply`, data, {
      headers: { "Content-Type": "multipart/form-data" },
    }),

  // Actions
  toggleLike: (api: AxiosInstance, postId: string) => api.post(`/posts/${postId}/like`),
  toggleBookmark: (api: AxiosInstance, postId: string) => api.post(`/posts/${postId}/bookmark`),
  acceptAnswer: (api: AxiosInstance, postId: string, replyId: string) =>
    api.post(`/posts/${postId}/accept-answer`, { replyId }),
  pinPost: (api: AxiosInstance, postId: string) => api.post(`/posts/${postId}/pin`),
  lockThread: (api: AxiosInstance, postId: string) => api.post(`/posts/${postId}/lock`),
  votePoll: (api: AxiosInstance, postId: string, optionIndex: number) =>
    api.post(`/posts/${postId}/vote`, { optionIndex }),

  // Edit/Delete
  editPost: (api: AxiosInstance, postId: string, data: { title?: string; content?: string; tags?: string }) =>
    api.put(`/posts/${postId}`, data),
  deletePost: (api: AxiosInstance, postId: string) => api.delete(`/posts/${postId}`),

  // User posts
  getUserPosts: (api: AxiosInstance, username: string, params?: { page?: number; limit?: number }) =>
    api.get(`/posts/user/${username}`, { params }),

  // Bookmarks
  getBookmarks: (api: AxiosInstance, params?: { page?: number; limit?: number }) =>
    api.get("/posts/me/bookmarks", { params }),

  // Search
  search: (api: AxiosInstance, params: { q: string; category?: string; university?: string; page?: number; limit?: number }) =>
    api.get("/posts/search", { params }),

  // Trending
  getTrending: (api: AxiosInstance, params?: { university?: string; limit?: number }) =>
    api.get("/posts/trending", { params }),

  // Unanswered
  getUnanswered: (api: AxiosInstance, params?: { university?: string; limit?: number }) =>
    api.get("/posts/unanswered", { params }),

  // Tags
  getPopularTags: (api: AxiosInstance, params?: { university?: string; limit?: number }) =>
    api.get("/posts/tags", { params }),
  getByTag: (api: AxiosInstance, tag: string, params?: { university?: string; page?: number; limit?: number }) =>
    api.get(`/posts/tags/${tag}`, { params }),
};

// Legacy post API for backwards compatibility
export const postApi = {
  createPost: (api: AxiosInstance, data: { content: string; image?: string }) =>
    api.post("/posts", data),
  getPosts: (api: AxiosInstance) => api.get("/posts"),
  getUserPosts: (api: AxiosInstance, username: string) => api.get(`/posts/user/${username}`),
  likePost: (api: AxiosInstance, postId: string) => api.post(`/posts/${postId}/like`),
  deletePost: (api: AxiosInstance, postId: string) => api.delete(`/posts/${postId}`),
};

export const commentApi = {
  createComment: (api: AxiosInstance, postId: string, content: string) =>
    api.post(`/comments/post/${postId}`, { content }),
};

export const verificationApi = {
  checkEmail: (api: AxiosInstance, email: string) =>
    api.post("/verification/check-email", { email }),
  start: (api: AxiosInstance, studentEmail: string) =>
    api.post("/verification/start", { studentEmail }),
  verify: (api: AxiosInstance, token: string) =>
    api.post("/verification/verify", { token }),
  resend: (api: AxiosInstance) =>
    api.post("/verification/resend"),
  getStatus: (api: AxiosInstance) =>
    api.get("/verification/status"),
  cancel: (api: AxiosInstance) =>
    api.post("/verification/cancel"),
  suggest: (api: AxiosInstance, domain: string) =>
    api.get(`/verification/suggest?domain=${domain}`),
};

export const universityApi = {
  search: (api: AxiosInstance, params: Record<string, any>) =>
    api.get("/universities", { params }),
  getPopular: (api: AxiosInstance, limit = 10) =>
    api.get(`/universities/popular?limit=${limit}`),
  getTopRated: (api: AxiosInstance, limit = 10) =>
    api.get(`/universities/top-rated?limit=${limit}`),
  getById: (api: AxiosInstance, id: string) =>
    api.get(`/universities/${id}`),
  verifyEmail: (api: AxiosInstance, email: string) =>
    api.get(`/universities/verify-email?email=${email}`),
  suggest: (api: AxiosInstance, query: string) =>
    api.get(`/universities/suggest?q=${query}`),
  join: (api: AxiosInstance, universityId: string) =>
    api.post(`/universities/${universityId}/join`),
  leave: (api: AxiosInstance, universityId: string) =>
    api.post(`/universities/${universityId}/leave`),
  getStudents: (api: AxiosInstance, universityId: string, params?: Record<string, any>) =>
    api.get(`/universities/${universityId}/students`, { params }),
  getPosts: (api: AxiosInstance, universityId: string, params?: Record<string, any>) =>
    api.get(`/universities/${universityId}/posts`, { params }),
  getReviews: (api: AxiosInstance, universityId: string, params?: Record<string, any>) =>
    api.get(`/universities/${universityId}/reviews`, { params }),
};

export const reviewApi = {
  getAll: (api: AxiosInstance, params?: {
    universityId?: string;
    rating?: number;
    sortBy?: string;
    page?: number;
    limit?: number;
  }) => api.get("/reviews", { params }),

  getByUniversity: (api: AxiosInstance, universityId: string, params?: {
    rating?: number;
    sortBy?: string;
    page?: number;
    limit?: number;
  }) => api.get(`/reviews/university/${universityId}`, { params }),

  getByUser: (api: AxiosInstance, userId: string, params?: {
    page?: number;
    limit?: number;
  }) => api.get(`/reviews/user/${userId}`, { params }),

  getById: (api: AxiosInstance, reviewId: string) =>
    api.get(`/reviews/${reviewId}`),

  getMyReview: (api: AxiosInstance, universityId: string) =>
    api.get(`/reviews/me/university/${universityId}`),

  create: (api: AxiosInstance, data: {
    universityId: string;
    overallRating: number;
    title?: string;
    content?: string;
    categoryRatings?: Record<string, number>;
    pros?: string[];
    cons?: string[];
    isAnonymous?: boolean;
  }) => api.post("/reviews", data),

  update: (api: AxiosInstance, reviewId: string, data: {
    overallRating?: number;
    title?: string;
    content?: string;
    categoryRatings?: Record<string, number>;
    pros?: string[];
    cons?: string[];
    isAnonymous?: boolean;
  }) => api.put(`/reviews/${reviewId}`, data),

  delete: (api: AxiosInstance, reviewId: string) =>
    api.delete(`/reviews/${reviewId}`),

  markHelpful: (api: AxiosInstance, reviewId: string) =>
    api.post(`/reviews/${reviewId}/helpful`),

  report: (api: AxiosInstance, reviewId: string, reason?: string) =>
    api.post(`/reviews/${reviewId}/report`, { reason }),
};

export const noteApi = {
  getAll: (api: AxiosInstance, params?: {
    subject?: string;
    course?: string;
    noteType?: string;
    universityId?: string;
    sortBy?: "newest" | "popular" | "mostDownloaded";
    search?: string;
    page?: number;
    limit?: number;
  }) => api.get("/notes", { params }),

  getByUniversity: (api: AxiosInstance, universityId: string, params?: {
    subject?: string;
    course?: string;
    noteType?: string;
    sortBy?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) => api.get(`/notes/university/${universityId}`, { params }),

  getBySubject: (api: AxiosInstance, subject: string, params?: {
    universityId?: string;
    sortBy?: string;
    page?: number;
    limit?: number;
  }) => api.get(`/notes/subject/${encodeURIComponent(subject)}`, { params }),

  getByUser: (api: AxiosInstance, userId: string, params?: {
    page?: number;
    limit?: number;
  }) => api.get(`/notes/user/${userId}`, { params }),

  getSaved: (api: AxiosInstance, params?: {
    page?: number;
    limit?: number;
  }) => api.get("/notes/saved", { params }),

  getById: (api: AxiosInstance, noteId: string) =>
    api.get(`/notes/${noteId}`),

  getDownloadUrl: (api: AxiosInstance, noteId: string) =>
    api.get(`/notes/${noteId}/download`),

  create: (api: AxiosInstance, formData: FormData) =>
    api.post("/notes", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),

  update: (api: AxiosInstance, noteId: string, data: {
    title?: string;
    description?: string;
    subject?: string;
    course?: string;
    professor?: string;
    semester?: string;
    noteType?: string;
    tags?: string[];
    isPublic?: boolean;
  }) => api.put(`/notes/${noteId}`, data),

  delete: (api: AxiosInstance, noteId: string) =>
    api.delete(`/notes/${noteId}`),

  toggleLike: (api: AxiosInstance, noteId: string) =>
    api.post(`/notes/${noteId}/like`),

  toggleSave: (api: AxiosInstance, noteId: string) =>
    api.post(`/notes/${noteId}/save`),

  getSubjectSuggestions: (api: AxiosInstance, query: string, universityId?: string) =>
    api.get("/notes/suggestions/subjects", { params: { q: query, universityId } }),

  getCourseSuggestions: (api: AxiosInstance, query: string, universityId?: string) =>
    api.get("/notes/suggestions/courses", { params: { q: query, universityId } }),

  getPopularSubjects: (api: AxiosInstance, universityId?: string, limit?: number) =>
    api.get("/notes/subjects/popular", { params: { universityId, limit } }),
};

export const searchApi = {
  globalSearch: (api: AxiosInstance, params: {
    q: string;
    type?: "all" | "universities" | "users" | "posts" | "notes" | "reviews";
    limit?: number;
  }) => api.get("/search", { params }),

  searchUniversities: (api: AxiosInstance, params: {
    q: string;
    page?: number;
    limit?: number;
    sortBy?: "score" | "name";
  }) => api.get("/search/universities", { params }),

  searchUsers: (api: AxiosInstance, params: {
    q: string;
    page?: number;
    limit?: number;
  }) => api.get("/search/users", { params }),

  searchPosts: (api: AxiosInstance, params: {
    q: string;
    category?: string;
    universityId?: string;
    sortBy?: "relevance" | "newest" | "popular";
    page?: number;
    limit?: number;
  }) => api.get("/search/posts", { params }),

  searchNotes: (api: AxiosInstance, params: {
    q: string;
    universityId?: string;
    subject?: string;
    noteType?: string;
    sortBy?: "relevance" | "newest" | "popular";
    page?: number;
    limit?: number;
  }) => api.get("/search/notes", { params }),

  searchReviews: (api: AxiosInstance, params: {
    q: string;
    universityId?: string;
    minRating?: number;
    page?: number;
    limit?: number;
  }) => api.get("/search/reviews", { params }),

  getSuggestions: (api: AxiosInstance, q: string, limit?: number) =>
    api.get("/search/suggestions", { params: { q, limit } }),

  getRecentSearches: (api: AxiosInstance, limit?: number) =>
    api.get("/search/recent", { params: { limit } }),

  clearSearchHistory: (api: AxiosInstance) =>
    api.delete("/search/recent"),

  getPopularSearches: (api: AxiosInstance, limit?: number) =>
    api.get("/search/popular", { params: { limit } }),
};
