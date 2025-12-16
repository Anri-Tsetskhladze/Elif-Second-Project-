import { View, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { CategoryRatings, ReviewStats } from "@/types";

interface RatingBreakdownProps {
  ratings: CategoryRatings;
  averages?: Partial<ReviewStats>;
  showComparison?: boolean;
}

const CATEGORY_CONFIG: Record<keyof CategoryRatings, { label: string; icon: keyof typeof Ionicons.glyphMap }> = {
  academics: { label: "Academics", icon: "school" },
  campusLife: { label: "Campus Life", icon: "people" },
  facilities: { label: "Facilities", icon: "business" },
  value: { label: "Value for Money", icon: "cash" },
  location: { label: "Location", icon: "location" },
  safety: { label: "Safety", icon: "shield-checkmark" },
};

const RatingBar = ({
  label,
  icon,
  value,
  average,
  showComparison,
}: {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  value?: number;
  average?: number;
  showComparison?: boolean;
}) => {
  if (value == null) return null;

  const percentage = (value / 5) * 100;
  const avgPercentage = average ? (average / 5) * 100 : 0;

  return (
    <View className="mb-3">
      <View className="flex-row items-center justify-between mb-1">
        <View className="flex-row items-center">
          <Ionicons name={icon} size={14} color="#6B7280" />
          <Text className="text-gray-700 text-sm ml-2">{label}</Text>
        </View>
        <View className="flex-row items-center">
          <Text className="text-gray-900 font-medium text-sm">{value.toFixed(1)}</Text>
          {showComparison && average && (
            <Text className="text-gray-400 text-xs ml-1">
              (avg: {average.toFixed(1)})
            </Text>
          )}
        </View>
      </View>
      <View className="h-2 bg-gray-200 rounded-full overflow-hidden">
        {showComparison && average && (
          <View
            className="absolute h-full bg-gray-300 rounded-full"
            style={{ width: `${avgPercentage}%` }}
          />
        )}
        <View
          className="h-full bg-amber-500 rounded-full"
          style={{ width: `${percentage}%` }}
        />
      </View>
    </View>
  );
};

const RatingBreakdown = ({
  ratings,
  averages,
  showComparison = false,
}: RatingBreakdownProps) => {
  const getAverage = (key: keyof CategoryRatings): number | undefined => {
    if (!averages) return undefined;
    const avgKey = `avg${key.charAt(0).toUpperCase()}${key.slice(1)}` as keyof ReviewStats;
    return averages[avgKey] as number | undefined;
  };

  return (
    <View className="bg-gray-50 p-3 rounded-lg mb-3">
      {(Object.keys(CATEGORY_CONFIG) as Array<keyof CategoryRatings>).map((key) => (
        <RatingBar
          key={key}
          label={CATEGORY_CONFIG[key].label}
          icon={CATEGORY_CONFIG[key].icon}
          value={ratings[key]}
          average={getAverage(key)}
          showComparison={showComparison}
        />
      ))}
    </View>
  );
};

export default RatingBreakdown;
