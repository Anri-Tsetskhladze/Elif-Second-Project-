import { View, Text, TouchableOpacity, Linking } from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface StatCardProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string | number;
  color?: string;
  bgColor?: string;
}

const StatCard = ({
  icon,
  label,
  value,
  color = "#6366F1",
  bgColor = "bg-indigo-50",
}: StatCardProps) => (
  <View className={`flex-1 ${bgColor} p-4 rounded-xl`}>
    <View className="flex-row items-center mb-2">
      <Ionicons name={icon} size={18} color={color} />
      <Text className="text-gray-500 text-xs ml-1.5">{label}</Text>
    </View>
    <Text className="font-bold text-gray-900 text-lg">{value}</Text>
  </View>
);

interface UniversityStatsProps {
  university: {
    studentCount?: number;
    admissionRate?: number;
    graduationRate?: number;
    tuitionInState?: number;
    tuitionOutState?: number;
    acceptanceRate?: number;
    website?: string;
    foundedYear?: number;
    type?: string;
  };
  showWebsite?: boolean;
}

const formatNumber = (num?: number): string => {
  if (!num) return "N/A";
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toLocaleString();
};

const formatCurrency = (num?: number): string => {
  if (!num) return "N/A";
  return `$${num.toLocaleString()}`;
};

const formatPercent = (num?: number): string => {
  if (!num) return "N/A";
  return `${num}%`;
};

const UniversityStats = ({ university, showWebsite = true }: UniversityStatsProps) => {
  const openWebsite = () => {
    if (university.website) {
      const url = university.website.startsWith("http")
        ? university.website
        : `https://${university.website}`;
      Linking.openURL(url);
    }
  };

  return (
    <View>
      {/* Primary Stats */}
      <View className="flex-row gap-3 mb-3">
        <StatCard
          icon="people"
          label="Students"
          value={formatNumber(university.studentCount)}
          color="#6366F1"
          bgColor="bg-indigo-50"
        />
        <StatCard
          icon="school"
          label="Acceptance"
          value={formatPercent(university.acceptanceRate || university.admissionRate)}
          color="#10B981"
          bgColor="bg-emerald-50"
        />
      </View>

      <View className="flex-row gap-3 mb-3">
        <StatCard
          icon="ribbon"
          label="Graduation"
          value={formatPercent(university.graduationRate)}
          color="#F59E0B"
          bgColor="bg-amber-50"
        />
        <StatCard
          icon="calendar"
          label="Founded"
          value={university.foundedYear || "N/A"}
          color="#8B5CF6"
          bgColor="bg-purple-50"
        />
      </View>

      {/* Tuition */}
      {(university.tuitionInState || university.tuitionOutState) && (
        <View className="bg-gray-50 p-4 rounded-xl mb-3">
          <View className="flex-row items-center mb-3">
            <Ionicons name="cash-outline" size={18} color="#6B7280" />
            <Text className="text-gray-700 font-semibold ml-2">Tuition & Fees</Text>
          </View>
          <View className="flex-row">
            {university.tuitionInState && (
              <View className="flex-1">
                <Text className="text-gray-500 text-xs">In-State</Text>
                <Text className="text-gray-900 font-bold text-lg">
                  {formatCurrency(university.tuitionInState)}
                </Text>
              </View>
            )}
            {university.tuitionOutState && (
              <View className="flex-1">
                <Text className="text-gray-500 text-xs">Out-of-State</Text>
                <Text className="text-gray-900 font-bold text-lg">
                  {formatCurrency(university.tuitionOutState)}
                </Text>
              </View>
            )}
          </View>
        </View>
      )}

      {/* Type */}
      {university.type && (
        <View className="flex-row items-center bg-gray-50 p-4 rounded-xl mb-3">
          <Ionicons name="business-outline" size={18} color="#6B7280" />
          <Text className="text-gray-500 ml-2">Institution Type:</Text>
          <Text className="text-gray-900 font-medium ml-2 capitalize">
            {university.type}
          </Text>
        </View>
      )}

      {/* Website */}
      {showWebsite && university.website && (
        <TouchableOpacity
          className="flex-row items-center bg-indigo-50 p-4 rounded-xl"
          onPress={openWebsite}
        >
          <Ionicons name="globe-outline" size={18} color="#6366F1" />
          <Text className="text-indigo-600 ml-2 flex-1" numberOfLines={1}>
            {university.website.replace(/^https?:\/\//, "")}
          </Text>
          <Ionicons name="open-outline" size={18} color="#6366F1" />
        </TouchableOpacity>
      )}
    </View>
  );
};

export default UniversityStats;
