// MongoDB Query Optimization Helpers

// Standard projections for different entities
export const PROJECTIONS = {
  // User projections
  userMinimal: { username: 1, fullName: 1, profileImage: 1, isVerified: 1 },
  userBasic: { username: 1, fullName: 1, profileImage: 1, isVerified: 1, bio: 1, university: 1 },
  userPublic: {
    username: 1, fullName: 1, profileImage: 1, isVerified: 1, bio: 1,
    university: 1, major: 1, graduationYear: 1, followersCount: 1, followingCount: 1
  },
  userFull: { password: 0, clerkId: 0, __v: 0 },

  // Post projections
  postList: {
    content: 1, author: 1, category: 1, likesCount: 1, commentsCount: 1,
    viewsCount: 1, isLiked: 1, isBookmarked: 1, createdAt: 1, images: 1
  },
  postDetail: { __v: 0 },

  // University projections
  universityList: {
    name: 1, slug: 1, "images.logo": 1, "images.banner": 1,
    "location.city": 1, "location.state": 1, "location.country": 1,
    "stats.studentsCount": 1, "stats.reviewsCount": 1, "stats.averageRating": 1,
    type: 1, ranking: 1
  },
  universityDetail: { __v: 0 },

  // Note projections
  noteList: {
    title: 1, description: 1, subject: 1, course: 1, noteType: 1, fileType: 1,
    author: 1, university: 1, downloadCount: 1, likeCount: 1, viewCount: 1,
    isLiked: 1, isSaved: 1, createdAt: 1
  },
  noteDetail: { __v: 0 },

  // Review projections
  reviewList: {
    title: 1, content: 1, rating: 1, ratings: 1, author: 1, university: 1,
    helpfulCount: 1, commentsCount: 1, isHelpful: 1, createdAt: 1
  },
  reviewDetail: { __v: 0 },

  // Notification projections
  notificationList: {
    type: 1, category: 1, title: 1, body: 1, sender: 1, data: 1,
    actionUrl: 1, isRead: 1, priority: 1, createdAt: 1
  },
};

// Pagination helper with cursor-based pagination support
export const paginate = (query, options = {}) => {
  const { page = 1, limit = 20, cursor, cursorField = "_id" } = options;

  // Cursor-based pagination (more efficient for large datasets)
  if (cursor) {
    query.where(cursorField).lt(cursor);
    return query.limit(limit);
  }

  // Offset-based pagination
  const skip = (page - 1) * limit;
  return query.skip(skip).limit(limit);
};

// Build sort options
export const buildSort = (sortBy, sortOrder = "desc") => {
  const sortOptions = {
    newest: { createdAt: -1 },
    oldest: { createdAt: 1 },
    popular: { likesCount: -1, createdAt: -1 },
    mostViewed: { viewsCount: -1, createdAt: -1 },
    mostDownloaded: { downloadCount: -1, createdAt: -1 },
    topRated: { "stats.averageRating": -1, "stats.reviewsCount": -1 },
    alphabetical: { name: 1 },
    trending: { trendingScore: -1, createdAt: -1 },
  };

  return sortOptions[sortBy] || sortOptions.newest;
};

// Apply lean() for read-only queries
export const leanQuery = (query) => {
  return query.lean({ virtuals: true });
};

// Efficient count query
export const countDocuments = async (Model, filter = {}) => {
  // Use estimatedDocumentCount for large collections without filter
  if (Object.keys(filter).length === 0) {
    return Model.estimatedDocumentCount();
  }
  return Model.countDocuments(filter);
};

// Batch fetch helper
export const batchFetch = async (Model, ids, projection = {}) => {
  if (!ids || ids.length === 0) return [];

  return Model.find({ _id: { $in: ids } })
    .select(projection)
    .lean();
};

// Aggregate pipeline helpers
export const aggregateHelpers = {
  // Match stage
  match: (conditions) => ({ $match: conditions }),

  // Lookup (join) with optimization
  lookup: (from, localField, foreignField, as, pipeline = []) => ({
    $lookup: {
      from,
      localField,
      foreignField,
      as,
      pipeline,
    },
  }),

  // Unwind with preserveNull
  unwind: (path, preserveNull = true) => ({
    $unwind: { path: `$${path}`, preserveNullAndEmptyArrays: preserveNull },
  }),

  // Pagination in aggregate
  paginateAggregate: (page = 1, limit = 20) => [
    { $skip: (page - 1) * limit },
    { $limit: limit },
  ],

  // Add fields for computed values
  addFields: (fields) => ({ $addFields: fields }),

  // Sort
  sort: (sortBy) => ({ $sort: buildSort(sortBy) }),

  // Project
  project: (fields) => ({ $project: fields }),

  // Group
  group: (groupBy, accumulator) => ({ $group: { _id: groupBy, ...accumulator } }),

  // Facet for parallel aggregations
  facet: (facets) => ({ $facet: facets }),
};

// Create index helper (for development/migration)
export const createIndexes = async (Model, indexes) => {
  for (const index of indexes) {
    try {
      await Model.collection.createIndex(index.fields, index.options || {});
      console.log(`Index created: ${JSON.stringify(index.fields)}`);
    } catch (error) {
      if (error.code !== 85) { // 85 = index already exists
        console.error(`Index creation failed: ${error.message}`);
      }
    }
  }
};

// Query builder class for complex queries
export class QueryBuilder {
  constructor(Model) {
    this.Model = Model;
    this.query = {};
    this.options = {};
    this.populateFields = [];
    this.selectFields = null;
  }

  where(conditions) {
    this.query = { ...this.query, ...conditions };
    return this;
  }

  select(fields) {
    this.selectFields = fields;
    return this;
  }

  populate(field, select = null) {
    this.populateFields.push({ path: field, select });
    return this;
  }

  sort(sortBy) {
    this.options.sort = buildSort(sortBy);
    return this;
  }

  paginate(page, limit) {
    this.options.skip = (page - 1) * limit;
    this.options.limit = limit;
    return this;
  }

  async exec() {
    let query = this.Model.find(this.query, this.selectFields, this.options);

    for (const pop of this.populateFields) {
      query = query.populate(pop.path, pop.select);
    }

    return query.lean();
  }

  async count() {
    return countDocuments(this.Model, this.query);
  }

  async execWithCount() {
    const [data, total] = await Promise.all([
      this.exec(),
      this.count(),
    ]);

    return {
      data,
      total,
      page: Math.floor(this.options.skip / this.options.limit) + 1,
      limit: this.options.limit,
      pages: Math.ceil(total / this.options.limit),
    };
  }
}

export default {
  PROJECTIONS,
  paginate,
  buildSort,
  leanQuery,
  countDocuments,
  batchFetch,
  aggregateHelpers,
  createIndexes,
  QueryBuilder,
};
