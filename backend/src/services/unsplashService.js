import { ENV } from "../config/env.js";

const UNSPLASH_BASE_URL = "https://api.unsplash.com";

// Simple in-memory cache to avoid duplicate API calls
const imageCache = new Map();
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

function getCacheKey(universityName) {
  return universityName.toLowerCase().trim();
}

function getFromCache(universityName) {
  const key = getCacheKey(universityName);
  const cached = imageCache.get(key);

  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }

  if (cached) {
    imageCache.delete(key);
  }

  return null;
}

function setCache(universityName, data) {
  const key = getCacheKey(universityName);
  imageCache.set(key, {
    data,
    timestamp: Date.now(),
  });
}

// Search for campus photos
export async function searchCampusImages(universityName, count = 5) {
  const accessKey = ENV.UNSPLASH_ACCESS_KEY;
  if (!accessKey) {
    throw new Error("UNSPLASH_ACCESS_KEY not configured");
  }

  // Check cache first
  const cached = getFromCache(universityName);
  if (cached) {
    return cached.slice(0, count);
  }

  const query = encodeURIComponent(`${universityName} campus university`);
  const url = `${UNSPLASH_BASE_URL}/search/photos?query=${query}&per_page=${Math.min(count, 10)}&client_id=${accessKey}`;

  const response = await fetch(url);

  if (!response.ok) {
    if (response.status === 403) {
      throw new Error("Unsplash API rate limit exceeded");
    }
    throw new Error(`Unsplash API error: ${response.status}`);
  }

  const data = await response.json();

  const images = data.results.map((photo) => ({
    id: photo.id,
    url: photo.urls.regular,
    fullUrl: photo.urls.full,
    thumbnail: photo.urls.thumb,
    small: photo.urls.small,
    alt: photo.alt_description || `${universityName} campus`,
    credit: {
      name: photo.user.name,
      username: photo.user.username,
      profileUrl: photo.user.links.html,
      portfolioUrl: photo.user.portfolio_url,
    },
    downloadUrl: photo.links.download,
    color: photo.color,
    width: photo.width,
    height: photo.height,
  }));

  // Cache the results
  setCache(universityName, images);

  return images;
}

// Get a random campus image
export async function getRandomCampusImage(universityName) {
  const accessKey = ENV.UNSPLASH_ACCESS_KEY;
  if (!accessKey) {
    return null;
  }

  const query = encodeURIComponent(`${universityName} campus`);
  const url = `${UNSPLASH_BASE_URL}/photos/random?query=${query}&client_id=${accessKey}`;

  try {
    const response = await fetch(url);
    if (!response.ok) return null;

    const photo = await response.json();
    return {
      id: photo.id,
      url: photo.urls.regular,
      thumbnail: photo.urls.thumb,
      credit: {
        name: photo.user.name,
        username: photo.user.username,
        profileUrl: photo.user.links.html,
      },
    };
  } catch (error) {
    console.error("Error fetching random campus image:", error.message);
    return null;
  }
}

// Update campus images for a specific university in the database
export async function updateUniversityCampusImages(University, universityId) {
  try {
    const university = await University.findById(universityId);
    if (!university) {
      throw new Error("University not found");
    }

    const images = await searchCampusImages(university.name, 10);

    // Update university with new images
    university.campusImages = images.map((img) => ({
      url: img.url,
      thumbnail: img.thumbnail,
      alt: img.alt,
      credit: img.credit.name,
      creditUrl: img.credit.profileUrl,
    }));
    university.lastImageUpdate = new Date();

    await university.save();

    return {
      universityId: university._id,
      name: university.name,
      imagesCount: images.length,
    };
  } catch (error) {
    console.error(`Error updating images for university ${universityId}:`, error.message);
    throw error;
  }
}

// Batch update campus images for multiple universities
export async function batchUpdateCampusImages(University, query = {}, limit = 10) {
  const universities = await University.find(query)
    .limit(limit)
    .select("_id name");

  const results = [];
  const errors = [];

  for (const uni of universities) {
    try {
      // Add delay to respect rate limits (50 requests/hour = ~1 per 72 seconds)
      await new Promise((resolve) => setTimeout(resolve, 2000));

      const result = await updateUniversityCampusImages(University, uni._id);
      results.push(result);
    } catch (error) {
      errors.push({
        universityId: uni._id,
        name: uni.name,
        error: error.message,
      });
    }
  }

  return { results, errors };
}

// Get campus images with fallback
export async function getCampusImagesWithFallback(universityName, count = 5) {
  try {
    const images = await searchCampusImages(universityName, count);
    if (images.length > 0) {
      return images;
    }
  } catch (error) {
    console.error("Campus images fetch error:", error.message);
  }

  // Return placeholder if API fails or no results
  return [
    {
      id: "placeholder",
      url: `https://source.unsplash.com/800x600/?university,campus`,
      thumbnail: `https://source.unsplash.com/200x150/?university,campus`,
      alt: `${universityName} campus`,
      credit: {
        name: "Unsplash",
        username: "unsplash",
        profileUrl: "https://unsplash.com",
      },
    },
  ];
}

// Clear cache (useful for testing or manual refresh)
export function clearImageCache() {
  imageCache.clear();
}

// Get cache stats
export function getCacheStats() {
  return {
    size: imageCache.size,
    keys: Array.from(imageCache.keys()),
  };
}

export default {
  searchCampusImages,
  getRandomCampusImage,
  updateUniversityCampusImages,
  batchUpdateCampusImages,
  getCampusImagesWithFallback,
  clearImageCache,
  getCacheStats,
};
