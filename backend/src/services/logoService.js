import cloudinary from "cloudinary";

const RATE_LIMIT_DELAY = 200;
let lastRequestTime = 0;

async function rateLimit() {
  const now = Date.now();
  const elapsed = now - lastRequestTime;
  if (elapsed < RATE_LIMIT_DELAY) {
    await new Promise((resolve) => setTimeout(resolve, RATE_LIMIT_DELAY - elapsed));
  }
  lastRequestTime = Date.now();
}

// Extract domain from URL or email
function extractDomain(input) {
  if (!input) return null;

  if (input.includes("@")) {
    return input.split("@")[1]?.toLowerCase();
  }

  try {
    let domain = input.toLowerCase().trim();
    if (!domain.startsWith("http")) {
      domain = "https://" + domain;
    }
    const url = new URL(domain);
    return url.hostname.replace(/^www\./, "");
  } catch {
    return input.toLowerCase().replace(/^www\./, "");
  }
}

// Fetch from Logo.dev API
async function fetchLogoFromLogodev(domain) {
  const apiKey = process.env.LOGODEV_API_KEY;
  if (!apiKey) return null;

  await rateLimit();

  try {
    const url = `https://img.logo.dev/${domain}?token=${apiKey}&size=200&format=png`;
    const response = await fetch(url, { method: "HEAD" });

    if (response.ok) {
      return url;
    }
    return null;
  } catch {
    return null;
  }
}

// Fetch from Brandfetch API
async function fetchLogoFromBrandfetch(domain) {
  const apiKey = process.env.BRANDFETCH_API_KEY;
  if (!apiKey) return null;

  await rateLimit();

  try {
    const response = await fetch(`https://api.brandfetch.io/v2/brands/${domain}`, {
      headers: { Authorization: `Bearer ${apiKey}` },
    });

    if (!response.ok) return null;

    const data = await response.json();
    const logos = data.logos || [];

    // Prefer icon, then logo
    const icon = logos.find((l) => l.type === "icon");
    const logo = logos.find((l) => l.type === "logo");
    const selected = icon || logo;

    if (selected?.formats?.length) {
      const png = selected.formats.find((f) => f.format === "png");
      const svg = selected.formats.find((f) => f.format === "svg");
      return png?.src || svg?.src || selected.formats[0]?.src;
    }

    return null;
  } catch {
    return null;
  }
}

// Fetch from Google Favicon API (no key needed)
function fetchLogoFromGoogle(domain, size = 128) {
  if (!domain) return null;
  return `https://www.google.com/s2/favicons?domain=${domain}&sz=${size}`;
}

// Fetch from DuckDuckGo (backup, no key needed)
function fetchLogoFromDuckDuckGo(domain) {
  if (!domain) return null;
  return `https://icons.duckduckgo.com/ip3/${domain}.ico`;
}

// Generate initials-based placeholder SVG
function generateInitialsPlaceholder(name, bgColor = "#6366F1") {
  if (!name) return null;

  const words = name.split(/\s+/).filter(Boolean);
  let initials = "";

  if (words.length === 1) {
    initials = words[0].substring(0, 2).toUpperCase();
  } else {
    initials = words
      .slice(0, 2)
      .map((w) => w[0])
      .join("")
      .toUpperCase();
  }

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200">
      <rect width="200" height="200" fill="${bgColor}" rx="20"/>
      <text x="100" y="100" font-family="Arial, sans-serif" font-size="80" font-weight="bold"
            fill="white" text-anchor="middle" dominant-baseline="central">${initials}</text>
    </svg>
  `.trim();

  const base64 = Buffer.from(svg).toString("base64");
  return `data:image/svg+xml;base64,${base64}`;
}

// Upload image to Cloudinary
async function uploadToCloudinary(imageUrl, publicId) {
  if (!imageUrl || !process.env.CLOUDINARY_CLOUD_NAME) {
    return null;
  }

  try {
    cloudinary.v2.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });

    const result = await cloudinary.v2.uploader.upload(imageUrl, {
      public_id: publicId,
      folder: "university-logos",
      overwrite: true,
      resource_type: "image",
      transformation: [
        { width: 200, height: 200, crop: "limit" },
        { quality: "auto" },
        { format: "png" },
      ],
    });

    return result.secure_url;
  } catch (error) {
    console.error(`Cloudinary upload failed for ${publicId}:`, error.message);
    return null;
  }
}

// Check if URL is accessible
async function isUrlAccessible(url) {
  if (!url || url.startsWith("data:")) return true;

  try {
    const response = await fetch(url, { method: "HEAD" });
    return response.ok;
  } catch {
    return false;
  }
}

// Main logo fetch function
async function fetchLogo(domainOrUniversity, options = {}) {
  const {
    uploadToCloud = false,
    forceRefresh = false,
    fallbackColor = "#6366F1",
  } = options;

  let domain = null;
  let universityName = null;
  let universityId = null;

  // Handle university document or domain string
  if (typeof domainOrUniversity === "object") {
    const uni = domainOrUniversity;
    universityName = uni.name;
    universityId = uni._id?.toString();

    // Check cached logo
    if (!forceRefresh && uni.images?.logo) {
      const isCached = await isUrlAccessible(uni.images.logo);
      if (isCached) {
        return { url: uni.images.logo, source: "cached" };
      }
    }

    // Get domain from university
    domain = uni.emailDomains?.[0] || extractDomain(uni.website);
  } else {
    domain = extractDomain(domainOrUniversity);
  }

  if (!domain && !universityName) {
    return { url: null, source: "none", error: "No domain or name provided" };
  }

  let logoUrl = null;
  let source = null;

  // 1. Try Logo.dev
  if (domain) {
    logoUrl = await fetchLogoFromLogodev(domain);
    if (logoUrl) source = "logodev";
  }

  // 2. Try Brandfetch
  if (!logoUrl && domain) {
    logoUrl = await fetchLogoFromBrandfetch(domain);
    if (logoUrl) source = "brandfetch";
  }

  // 3. Try Google Favicon
  if (!logoUrl && domain) {
    logoUrl = fetchLogoFromGoogle(domain, 128);
    const accessible = await isUrlAccessible(logoUrl);
    if (accessible) {
      source = "google";
    } else {
      logoUrl = null;
    }
  }

  // 4. Try DuckDuckGo
  if (!logoUrl && domain) {
    logoUrl = fetchLogoFromDuckDuckGo(domain);
    const accessible = await isUrlAccessible(logoUrl);
    if (accessible) {
      source = "duckduckgo";
    } else {
      logoUrl = null;
    }
  }

  // 5. Generate placeholder
  if (!logoUrl && universityName) {
    logoUrl = generateInitialsPlaceholder(universityName, fallbackColor);
    source = "placeholder";
  }

  // Upload to Cloudinary if requested
  if (uploadToCloud && logoUrl && source !== "placeholder") {
    const publicId = universityId || domain?.replace(/\./g, "-") || "unknown";
    const cloudinaryUrl = await uploadToCloudinary(logoUrl, `logo-${publicId}`);
    if (cloudinaryUrl) {
      logoUrl = cloudinaryUrl;
      source = "cloudinary";
    }
  }

  return { url: logoUrl, source, domain };
}

// Batch fetch logos for multiple universities
async function batchFetchLogos(universities, options = {}) {
  const {
    uploadToCloud = false,
    forceRefresh = false,
    onProgress = null,
    concurrency = 3,
  } = options;

  const results = [];
  const total = universities.length;

  // Process in batches for concurrency control
  for (let i = 0; i < universities.length; i += concurrency) {
    const batch = universities.slice(i, i + concurrency);

    const batchResults = await Promise.all(
      batch.map(async (uni) => {
        try {
          const result = await fetchLogo(uni, { uploadToCloud, forceRefresh });
          return { university: uni, ...result, success: true };
        } catch (error) {
          return {
            university: uni,
            url: null,
            source: "error",
            error: error.message,
            success: false,
          };
        }
      })
    );

    results.push(...batchResults);

    if (onProgress) {
      onProgress({
        processed: results.length,
        total,
        percent: Math.round((results.length / total) * 100),
      });
    }
  }

  const stats = {
    total: results.length,
    success: results.filter((r) => r.success && r.url).length,
    failed: results.filter((r) => !r.success || !r.url).length,
    bySources: results.reduce((acc, r) => {
      acc[r.source] = (acc[r.source] || 0) + 1;
      return acc;
    }, {}),
  };

  return { results, stats };
}

// Update university with fetched logo
async function updateUniversityLogo(University, universityId, options = {}) {
  const university = await University.findById(universityId);
  if (!university) {
    throw new Error("University not found");
  }

  const result = await fetchLogo(university, {
    uploadToCloud: true,
    ...options,
  });

  if (result.url) {
    university.images = university.images || {};
    university.images.logo = result.url;
    await university.save();
  }

  return { university, logo: result };
}

// Batch update university logos
async function batchUpdateUniversityLogos(University, query = {}, options = {}) {
  const { limit = 100, onProgress = null } = options;

  const universities = await University.find({
    ...query,
    $or: [
      { "images.logo": { $exists: false } },
      { "images.logo": "" },
      { "images.logo": null },
    ],
  }).limit(limit);

  console.log(`Found ${universities.length} universities without logos`);

  const { results, stats } = await batchFetchLogos(universities, {
    uploadToCloud: true,
    onProgress,
  });

  // Update database
  let updated = 0;
  for (const result of results) {
    if (result.success && result.url && result.university._id) {
      try {
        await University.findByIdAndUpdate(result.university._id, {
          $set: { "images.logo": result.url },
        });
        updated++;
      } catch (error) {
        console.error(`Failed to update ${result.university.name}:`, error.message);
      }
    }
  }

  return { ...stats, updated };
}

export {
  fetchLogo,
  fetchLogoFromLogodev,
  fetchLogoFromBrandfetch,
  fetchLogoFromGoogle,
  fetchLogoFromDuckDuckGo,
  generateInitialsPlaceholder,
  uploadToCloudinary,
  batchFetchLogos,
  updateUniversityLogo,
  batchUpdateUniversityLogos,
  extractDomain,
};

export default {
  fetchLogo,
  fetchLogoFromLogodev,
  fetchLogoFromBrandfetch,
  fetchLogoFromGoogle,
  fetchLogoFromDuckDuckGo,
  generateInitialsPlaceholder,
  uploadToCloudinary,
  batchFetchLogos,
  updateUniversityLogo,
  batchUpdateUniversityLogos,
  extractDomain,
};
