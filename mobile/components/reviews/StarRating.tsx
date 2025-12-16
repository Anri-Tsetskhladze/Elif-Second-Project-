import { View, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface StarRatingProps {
  value: number;
  onChange?: (value: number) => void;
  size?: number;
  readonly?: boolean;
  color?: string;
  showHalf?: boolean;
}

const StarRating = ({
  value,
  onChange,
  size = 24,
  readonly = false,
  color = "#F59E0B",
  showHalf = true,
}: StarRatingProps) => {
  const stars = [1, 2, 3, 4, 5];

  const getStarIcon = (starValue: number): keyof typeof Ionicons.glyphMap => {
    if (value >= starValue) {
      return "star";
    }
    if (showHalf && value >= starValue - 0.5) {
      return "star-half";
    }
    return "star-outline";
  };

  const handlePress = (starValue: number) => {
    if (readonly || !onChange) return;
    // Toggle off if pressing same value
    if (value === starValue) {
      onChange(starValue - 1);
    } else {
      onChange(starValue);
    }
  };

  if (readonly) {
    return (
      <View className="flex-row items-center">
        {stars.map((star) => (
          <Ionicons
            key={star}
            name={getStarIcon(star)}
            size={size}
            color={color}
            style={{ marginRight: 2 }}
          />
        ))}
      </View>
    );
  }

  return (
    <View className="flex-row items-center">
      {stars.map((star) => (
        <TouchableOpacity
          key={star}
          onPress={() => handlePress(star)}
          activeOpacity={0.7}
          hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
        >
          <Ionicons
            name={getStarIcon(star)}
            size={size}
            color={color}
            style={{ marginRight: 4 }}
          />
        </TouchableOpacity>
      ))}
    </View>
  );
};

export default StarRating;
