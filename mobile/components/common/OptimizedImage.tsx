import { useState, useCallback, memo } from "react";
import {
  Image,
  ImageProps,
  View,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import { getOptimizedImageUrl, getAvatarUrl, getBannerUrl } from "@/utils/imageOptimization";

interface OptimizedImageProps extends Omit<ImageProps, "source"> {
  uri?: string;
  fallbackUri?: string;
  preset?: "thumbnail" | "small" | "medium" | "large" | "full";
  variant?: "default" | "avatar" | "banner";
  avatarSize?: "small" | "medium" | "large";
  containerWidth?: number;
  showLoader?: boolean;
  loaderColor?: string;
  fallbackComponent?: React.ReactNode;
}

const OptimizedImage = memo(({
  uri,
  fallbackUri,
  preset = "medium",
  variant = "default",
  avatarSize = "medium",
  containerWidth,
  showLoader = true,
  loaderColor = "#6366F1",
  fallbackComponent,
  style,
  ...props
}: OptimizedImageProps) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  // Get optimized URL based on variant
  const getOptimizedUrl = useCallback(() => {
    if (!uri) return undefined;

    switch (variant) {
      case "avatar":
        return getAvatarUrl(uri, avatarSize);
      case "banner":
        return getBannerUrl(uri, containerWidth);
      default:
        return getOptimizedImageUrl(uri, preset, containerWidth);
    }
  }, [uri, variant, avatarSize, containerWidth, preset]);

  const optimizedUri = getOptimizedUrl();

  const handleLoadStart = useCallback(() => {
    setIsLoading(true);
    setHasError(false);
  }, []);

  const handleLoadEnd = useCallback(() => {
    setIsLoading(false);
  }, []);

  const handleError = useCallback(() => {
    setIsLoading(false);
    setHasError(true);
  }, []);

  // If no URI and no fallback, show fallback component
  if (!optimizedUri && !fallbackUri) {
    return fallbackComponent ? <>{fallbackComponent}</> : null;
  }

  // If error and has fallback, try fallback
  const sourceUri = hasError && fallbackUri ? fallbackUri : optimizedUri;

  return (
    <View style={[styles.container, style]}>
      <Image
        {...props}
        source={{ uri: sourceUri }}
        style={[styles.image, style]}
        onLoadStart={handleLoadStart}
        onLoadEnd={handleLoadEnd}
        onError={handleError}
        // Enable progressive loading for JPEG
        progressiveRenderingEnabled
        // Cache the image
        fadeDuration={200}
      />
      {isLoading && showLoader && (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="small" color={loaderColor} />
        </View>
      )}
    </View>
  );
});

OptimizedImage.displayName = "OptimizedImage";

const styles = StyleSheet.create({
  container: {
    position: "relative",
    overflow: "hidden",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  loaderContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(243, 244, 246, 0.5)",
  },
});

export default OptimizedImage;
