import { Image as RNImage, PixelRatio, Dimensions } from "react-native";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const PIXEL_RATIO = PixelRatio.get();

// Cloudinary base URL - update with your cloud name
const CLOUDINARY_BASE = "https://res.cloudinary.com/YOUR_CLOUD_NAME/image/upload";

// Image quality presets
export const IMAGE_QUALITY = {
  thumbnail: { quality: 60, width: 150 },
  small: { quality: 70, width: 300 },
  medium: { quality: 80, width: 600 },
  large: { quality: 85, width: 900 },
  full: { quality: 90, width: 1200 },
};

// Get optimal image width based on container width and pixel ratio
export const getOptimalWidth = (containerWidth: number): number => {
  const optimalWidth = containerWidth * PIXEL_RATIO;
  // Round to nearest 100 for better caching
  return Math.ceil(optimalWidth / 100) * 100;
};

// Build Cloudinary URL with transformations
export const getCloudinaryUrl = (
  publicId: string,
  options: {
    width?: number;
    height?: number;
    quality?: number;
    crop?: "fill" | "fit" | "scale" | "thumb" | "crop";
    format?: "auto" | "webp" | "jpg" | "png";
    aspectRatio?: string;
  } = {}
): string => {
  const {
    width,
    height,
    quality = 80,
    crop = "fill",
    format = "auto",
    aspectRatio,
  } = options;

  const transformations: string[] = [];

  if (width) transformations.push(`w_${width}`);
  if (height) transformations.push(`h_${height}`);
  if (quality) transformations.push(`q_${quality}`);
  if (crop) transformations.push(`c_${crop}`);
  if (format) transformations.push(`f_${format}`);
  if (aspectRatio) transformations.push(`ar_${aspectRatio}`);

  // Add auto format and quality optimization
  transformations.push("fl_progressive");

  return `${CLOUDINARY_BASE}/${transformations.join(",")}/${publicId}`;
};

// Get optimized image URL based on use case
export const getOptimizedImageUrl = (
  url: string | undefined,
  preset: keyof typeof IMAGE_QUALITY = "medium",
  customWidth?: number
): string | undefined => {
  if (!url) return undefined;

  // If it's already a Cloudinary URL, transform it
  if (url.includes("cloudinary.com")) {
    const { quality, width } = IMAGE_QUALITY[preset];
    const finalWidth = customWidth || width;

    // Extract public ID from URL
    const match = url.match(/\/upload\/(?:v\d+\/)?(.+)/);
    if (match) {
      const publicId = match[1];
      return getCloudinaryUrl(publicId, {
        width: finalWidth,
        quality,
        crop: "fill",
        format: "auto",
      });
    }
  }

  // For other URLs, return as-is (consider using a proxy service)
  return url;
};

// Avatar optimization
export const getAvatarUrl = (
  url: string | undefined,
  size: "small" | "medium" | "large" = "medium"
): string | undefined => {
  const sizes = {
    small: 48,
    medium: 96,
    large: 192,
  };

  if (!url) return undefined;

  if (url.includes("cloudinary.com")) {
    const match = url.match(/\/upload\/(?:v\d+\/)?(.+)/);
    if (match) {
      return getCloudinaryUrl(match[1], {
        width: sizes[size],
        height: sizes[size],
        crop: "fill",
        quality: 80,
        format: "auto",
      });
    }
  }

  return url;
};

// Banner/cover image optimization
export const getBannerUrl = (
  url: string | undefined,
  containerWidth: number = SCREEN_WIDTH
): string | undefined => {
  if (!url) return undefined;

  const optimalWidth = getOptimalWidth(containerWidth);

  if (url.includes("cloudinary.com")) {
    const match = url.match(/\/upload\/(?:v\d+\/)?(.+)/);
    if (match) {
      return getCloudinaryUrl(match[1], {
        width: optimalWidth,
        aspectRatio: "16:9",
        crop: "fill",
        quality: 85,
        format: "auto",
      });
    }
  }

  return url;
};

// Prefetch images for better UX
export const prefetchImages = async (urls: string[]): Promise<void> => {
  const validUrls = urls.filter(Boolean) as string[];

  await Promise.allSettled(
    validUrls.map((url) =>
      RNImage.prefetch(url).catch(() => {
        // Silently fail prefetch errors
      })
    )
  );
};

// Get image dimensions (useful for aspect ratio calculations)
export const getImageDimensions = (
  url: string
): Promise<{ width: number; height: number }> => {
  return new Promise((resolve, reject) => {
    RNImage.getSize(
      url,
      (width, height) => resolve({ width, height }),
      (error) => reject(error)
    );
  });
};

// Calculate aspect ratio
export const calculateAspectRatio = (width: number, height: number): number => {
  return width / height;
};

// Get responsive image dimensions based on container
export const getResponsiveDimensions = (
  originalWidth: number,
  originalHeight: number,
  containerWidth: number,
  maxHeight?: number
): { width: number; height: number } => {
  const aspectRatio = originalWidth / originalHeight;
  let width = containerWidth;
  let height = containerWidth / aspectRatio;

  if (maxHeight && height > maxHeight) {
    height = maxHeight;
    width = maxHeight * aspectRatio;
  }

  return { width, height };
};

// Image cache configuration
export const IMAGE_CACHE_CONFIG = {
  // Maximum cache size in bytes (100MB)
  maxCacheSize: 100 * 1024 * 1024,
  // Cache TTL in milliseconds (7 days)
  ttl: 7 * 24 * 60 * 60 * 1000,
};

export default {
  IMAGE_QUALITY,
  getOptimalWidth,
  getCloudinaryUrl,
  getOptimizedImageUrl,
  getAvatarUrl,
  getBannerUrl,
  prefetchImages,
  getImageDimensions,
  calculateAspectRatio,
  getResponsiveDimensions,
  IMAGE_CACHE_CONFIG,
};
