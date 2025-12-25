export interface User {
  _id: string;
  username: string;
  fullName?: string;
  firstName?: string;
  lastName?: string;
  profileImg?: string;
  profilePicture?: string;
  isVerifiedStudent?: boolean;
  university?: string;
}

export interface University {
  _id: string;
  name: string;
  images?: { logo?: string };
}

export interface Comment {
  _id: string;
  content: string;
  createdAt: string;
  user: User;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
}

export interface ForumPost {
  _id: string;
  title: string;
  content: string;
  images?: string[];
  category: string;
  tags: string[];
  user: User;
  university?: University;
  createdAt: string;
  updatedAt?: string;
  likes: string[];
  likesCount: number;
  bookmarks?: string[];
  bookmarksCount?: number;
  replyCount: number;
  viewCount: number;
  isQuestion: boolean;
  isAnswered: boolean;
  acceptedAnswer?: ForumPost;
  isPinned: boolean;
  isLocked: boolean;
  isEdited: boolean;
  visibility: "public" | "university" | "followers" | "private";
  isAnonymous: boolean;
  isLiked?: boolean;
  isBookmarked?: boolean;
  parentPost?: string;
  nestedReplies?: ForumPost[];
  hasMoreNested?: boolean;
  nestedCount?: number;
}

// Legacy Post type for backwards compatibility
export interface Post {
  _id: string;
  content: string;
  image?: string;
  createdAt: string;
  user: User;
  likes: string[];
  comments: Comment[];
}

export interface Notification {
  _id: string;
  from: {
    username: string;
    firstName: string;
    lastName: string;
    profilePicture?: string;
  };
  to: string;
  type: "like" | "comment" | "follow" | "reply" | "answer_accepted";
  post?: {
    _id: string;
    title?: string;
    content: string;
    image?: string;
  };
  comment?: {
    _id: string;
    content: string;
  };
  createdAt: string;
}

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export interface CategoryRatings {
  academics?: number;
  campusLife?: number;
  facilities?: number;
  value?: number;
  location?: number;
  safety?: number;
}

export interface Review {
  _id: string;
  author: User | { username: string; isAnonymous: true };
  university: University & { city?: string; state?: string };
  overallRating: number;
  title?: string;
  content?: string;
  categoryRatings?: CategoryRatings;
  pros?: string[];
  cons?: string[];
  isAnonymous: boolean;
  helpfulVotes?: string[];
  helpfulCount: number;
  isHelpful?: boolean;
  isOwn?: boolean;
  status: "active" | "hidden" | "flagged";
  createdAt: string;
  updatedAt?: string;
}

export interface ReviewStats {
  avgOverall: number;
  avgAcademics?: number;
  avgCampusLife?: number;
  avgFacilities?: number;
  avgValue?: number;
  avgLocation?: number;
  avgSafety?: number;
  totalReviews: number;
  rating5: number;
  rating4: number;
  rating3: number;
  rating2: number;
  rating1: number;
}

export type NoteType = "lecture" | "exam" | "summary" | "assignment" | "lab" | "other";
export type FileType = "pdf" | "doc" | "docx" | "ppt" | "pptx" | "xls" | "xlsx" | "image";

export interface NoteFile {
  url: string;
  fileName: string;
  fileType: FileType;
  fileSize: number;
  publicId?: string;
}

export interface Note {
  _id: string;
  title: string;
  description?: string;
  files: NoteFile[];
  thumbnail?: string;
  subject: string;
  course?: string;
  professor?: string;
  semester?: string;
  noteType: NoteType;
  tags?: string[];
  university: University;
  author: User;
  likes: string[];
  likesCount: number;
  saves: string[];
  savesCount: number;
  downloadCount: number;
  isPublic: boolean;
  status: "active" | "hidden" | "flagged";
  isLiked?: boolean;
  isSaved?: boolean;
  isOwn?: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface NoteStats {
  totalNotes: number;
  totalDownloads: number;
  popularSubjects: { subject: string; count: number }[];
}

export interface SearchSuggestion {
  type: "university" | "subject" | "tag";
  text: string;
}

export interface GlobalSearchResults {
  query: string;
  results: {
    universities: UniversitySearchResult[];
    users: UserSearchResult[];
    posts: PostSearchResult[];
    notes: NoteSearchResult[];
  };
  counts: {
    universities: number;
    users: number;
    posts: number;
    notes: number;
    total: number;
  };
}

export interface UniversitySearchResult {
  _id?: string;
  id?: number;
  name: string;
  city?: string;
  state?: string;
  country?: string;
  images?: { logo?: string };
  rating?: number;
  reviewCount?: number;
  studentCount?: number;
  stats?: {
    studentSize?: number;
    admissionRate?: number;
    avgSat?: number;
    avgAct?: number;
  };
  costs?: {
    tuitionInState?: number;
    tuitionOutState?: number;
  };
}

export interface UserSearchResult {
  _id: string;
  username: string;
  firstName?: string;
  lastName?: string;
  fullName?: string;
  profilePicture?: string;
  isVerifiedStudent?: boolean;
  university?: string;
}

export interface PostSearchResult {
  _id: string;
  title: string;
  content: string;
  category: string;
  tags?: string[];
  user: User;
  university?: University;
  likesCount: number;
  replyCount: number;
  viewCount: number;
  isQuestion: boolean;
  isAnswered: boolean;
  createdAt: string;
}

export interface NoteSearchResult {
  _id: string;
  title: string;
  description?: string;
  subject: string;
  course?: string;
  noteType: NoteType;
  thumbnail?: string;
  author: User;
  university: University;
  likesCount: number;
  downloadCount: number;
  createdAt: string;
}

export interface ReviewSearchResult {
  _id: string;
  title?: string;
  content?: string;
  overallRating: number;
  helpfulCount: number;
  isAnonymous: boolean;
  author: User;
  university: University & { city?: string; state?: string };
  createdAt: string;
}
