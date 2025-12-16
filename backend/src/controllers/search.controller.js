import searchService from "../services/searchService.js";

// Global search across all types
export const globalSearch = async (req, res) => {
  try {
    const { q, type, limit } = req.query;

    if (!q || q.trim().length < 2) {
      return res.status(400).json({ error: "Search query must be at least 2 characters" });
    }

    const userId = req.auth?.userId;
    const options = {
      limit: parseInt(limit) || 5,
      userId,
    };

    // If type is specified, search only that type
    if (type && type !== "all") {
      let results;
      let total;

      switch (type) {
        case "universities":
          ({ results, total } = await searchService.searchUniversities(q, { limit: parseInt(limit) || 20 }));
          break;
        case "users":
          ({ results, total } = await searchService.searchUsers(q, { limit: parseInt(limit) || 20 }));
          break;
        case "posts":
          ({ results, total } = await searchService.searchPosts(q, { ...req.query, limit: parseInt(limit) || 20 }));
          break;
        case "notes":
          ({ results, total } = await searchService.searchNotes(q, { ...req.query, limit: parseInt(limit) || 20 }));
          break;
        case "reviews":
          ({ results, total } = await searchService.searchReviews(q, { ...req.query, limit: parseInt(limit) || 20 }));
          break;
        default:
          return res.status(400).json({ error: "Invalid search type" });
      }

      // Save to history if logged in
      if (userId) {
        await searchService.saveSearchHistory(userId, q);
      }

      return res.json({
        query: q,
        type,
        results,
        total,
      });
    }

    // Global search across all types
    const searchResults = await searchService.globalSearch(q, options);
    res.json(searchResults);
  } catch (error) {
    console.error("Global search error:", error);
    res.status(500).json({ error: "Search failed" });
  }
};

// Search universities
export const searchUniversities = async (req, res) => {
  try {
    const { q, page, limit, sortBy } = req.query;

    if (!q || q.trim().length < 2) {
      return res.status(400).json({ error: "Search query must be at least 2 characters" });
    }

    const options = {
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 20,
      sortBy: sortBy || "score",
    };

    const { results, total } = await searchService.searchUniversities(q, options);

    res.json({
      query: q,
      universities: results,
      pagination: {
        page: options.page,
        limit: options.limit,
        total,
        pages: Math.ceil(total / options.limit),
      },
    });
  } catch (error) {
    console.error("University search error:", error);
    res.status(500).json({ error: "Search failed" });
  }
};

// Search users
export const searchUsers = async (req, res) => {
  try {
    const { q, page, limit } = req.query;

    if (!q || q.trim().length < 2) {
      return res.status(400).json({ error: "Search query must be at least 2 characters" });
    }

    const options = {
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 20,
      currentUserId: req.auth?.userId,
    };

    const { results, total } = await searchService.searchUsers(q, options);

    res.json({
      query: q,
      users: results,
      pagination: {
        page: options.page,
        limit: options.limit,
        total,
        pages: Math.ceil(total / options.limit),
      },
    });
  } catch (error) {
    console.error("User search error:", error);
    res.status(500).json({ error: "Search failed" });
  }
};

// Search posts/forums
export const searchPosts = async (req, res) => {
  try {
    const { q, page, limit, category, universityId, sortBy } = req.query;

    if (!q || q.trim().length < 2) {
      return res.status(400).json({ error: "Search query must be at least 2 characters" });
    }

    const options = {
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 20,
      category,
      universityId,
      sortBy: sortBy || "relevance",
    };

    const { results, total } = await searchService.searchPosts(q, options);

    res.json({
      query: q,
      posts: results,
      pagination: {
        page: options.page,
        limit: options.limit,
        total,
        pages: Math.ceil(total / options.limit),
      },
    });
  } catch (error) {
    console.error("Post search error:", error);
    res.status(500).json({ error: "Search failed" });
  }
};

// Search notes
export const searchNotes = async (req, res) => {
  try {
    const { q, page, limit, universityId, subject, noteType, sortBy } = req.query;

    if (!q || q.trim().length < 2) {
      return res.status(400).json({ error: "Search query must be at least 2 characters" });
    }

    const options = {
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 20,
      universityId,
      subject,
      noteType,
      sortBy: sortBy || "relevance",
    };

    const { results, total } = await searchService.searchNotes(q, options);

    res.json({
      query: q,
      notes: results,
      pagination: {
        page: options.page,
        limit: options.limit,
        total,
        pages: Math.ceil(total / options.limit),
      },
    });
  } catch (error) {
    console.error("Note search error:", error);
    res.status(500).json({ error: "Search failed" });
  }
};

// Search reviews
export const searchReviews = async (req, res) => {
  try {
    const { q, page, limit, universityId, minRating } = req.query;

    if (!q || q.trim().length < 2) {
      return res.status(400).json({ error: "Search query must be at least 2 characters" });
    }

    const options = {
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 20,
      universityId,
      minRating: minRating ? parseInt(minRating) : undefined,
    };

    const { results, total } = await searchService.searchReviews(q, options);

    res.json({
      query: q,
      reviews: results,
      pagination: {
        page: options.page,
        limit: options.limit,
        total,
        pages: Math.ceil(total / options.limit),
      },
    });
  } catch (error) {
    console.error("Review search error:", error);
    res.status(500).json({ error: "Search failed" });
  }
};

// Get autocomplete suggestions
export const getSuggestions = async (req, res) => {
  try {
    const { q, limit } = req.query;

    if (!q || q.trim().length < 2) {
      return res.json({ suggestions: [] });
    }

    const suggestions = await searchService.getSuggestions(q, {
      limit: parseInt(limit) || 8,
    });

    res.json({ suggestions });
  } catch (error) {
    console.error("Suggestions error:", error);
    res.status(500).json({ error: "Failed to get suggestions" });
  }
};

// Get user's recent searches
export const getRecentSearches = async (req, res) => {
  try {
    const userId = req.auth.userId;
    const { limit } = req.query;

    const searches = await searchService.getRecentSearches(userId, parseInt(limit) || 10);

    res.json({ searches });
  } catch (error) {
    console.error("Recent searches error:", error);
    res.status(500).json({ error: "Failed to get recent searches" });
  }
};

// Clear user's search history
export const clearSearchHistory = async (req, res) => {
  try {
    const userId = req.auth.userId;

    await searchService.clearSearchHistory(userId);

    res.json({ message: "Search history cleared" });
  } catch (error) {
    console.error("Clear search history error:", error);
    res.status(500).json({ error: "Failed to clear search history" });
  }
};

// Get popular searches
export const getPopularSearches = async (req, res) => {
  try {
    const { limit } = req.query;

    const searches = await searchService.getPopularSearches(parseInt(limit) || 10);

    res.json({ searches });
  } catch (error) {
    console.error("Popular searches error:", error);
    res.status(500).json({ error: "Failed to get popular searches" });
  }
};
