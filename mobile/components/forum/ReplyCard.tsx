import { useState } from "react";
import { View, Text, Image, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { ForumPost } from "@/types";
import { formatDate } from "@/utils/formatters";

interface ReplyCardProps {
  reply: ForumPost;
  isAcceptedAnswer?: boolean;
  onLike: (replyId: string) => void;
  onAccept?: (replyId: string) => void;
  onReply?: (replyId: string, username: string) => void;
  canAccept?: boolean;
  currentUserId?: string;
  isNested?: boolean;
}

const ReplyCard = ({
  reply,
  isAcceptedAnswer = false,
  onLike,
  onAccept,
  onReply,
  canAccept = false,
  currentUserId,
  isNested = false,
}: ReplyCardProps) => {
  const [showNestedReplies, setShowNestedReplies] = useState(true);

  const authorName = reply.isAnonymous
    ? "Anonymous"
    : reply.user?.fullName || reply.user?.username || "Unknown";
  const authorImg = reply.isAnonymous ? null : reply.user?.profileImg;
  const isOwn = currentUserId?.toString() === reply.user?._id?.toString();

  return (
    <View
      className={`${isNested ? "pl-4 ml-4 border-l-2 border-gray-200" : ""} ${
        isAcceptedAnswer ? "bg-green-50" : "bg-white"
      }`}
    >
      <View className="p-4 border-b border-gray-100">
        {/* Best answer badge */}
        {isAcceptedAnswer && (
          <View className="flex-row items-center mb-2 bg-green-100 self-start px-2 py-1 rounded-full">
            <Ionicons name="checkmark-circle" size={14} color="#16A34A" />
            <Text className="text-green-700 text-xs font-medium ml-1">Best Answer</Text>
          </View>
        )}

        {/* Author row */}
        <View className="flex-row items-start">
          {authorImg && authorImg.length > 0 ? (
            <Image
              source={{ uri: authorImg }}
              className={`${isNested ? "w-7 h-7" : "w-9 h-9"} rounded-full mr-2`}
            />
          ) : (
            <View
              className={`${isNested ? "w-7 h-7" : "w-9 h-9"} rounded-full bg-gray-200 items-center justify-center mr-2`}
            >
              <Ionicons name="person" size={isNested ? 14 : 16} color="#9CA3AF" />
            </View>
          )}

          <View className="flex-1">
            {/* Author info */}
            <View className="flex-row items-center flex-wrap">
              <Text className={`font-medium text-gray-900 ${isNested ? "text-sm" : ""}`}>
                {authorName}
              </Text>
              {reply.user?.isVerifiedStudent && (
                <Ionicons name="checkmark-circle" size={12} color="#6366F1" className="ml-1" />
              )}
              {isOwn && (
                <View className="bg-indigo-100 px-1.5 py-0.5 rounded ml-2">
                  <Text className="text-indigo-600 text-xs">You</Text>
                </View>
              )}
              <Text className="text-gray-500 text-xs ml-2">
                {formatDate(reply.createdAt)}
              </Text>
              {reply.isEdited && (
                <Text className="text-gray-400 text-xs ml-1">(edited)</Text>
              )}
            </View>

            {/* Reply content */}
            <Text className={`text-gray-800 mt-1 ${isNested ? "text-sm" : ""}`}>
              {reply.content}
            </Text>

            {/* Reply image */}
            {reply.images && reply.images.length > 0 && reply.images[0] && (
              <Image
                source={{ uri: reply.images[0] }}
                className="w-full h-32 rounded-lg mt-2"
                resizeMode="cover"
              />
            )}

            {/* Actions row */}
            <View className="flex-row items-center mt-3 gap-4">
              {/* Like */}
              <TouchableOpacity
                className="flex-row items-center"
                onPress={() => onLike(reply._id)}
              >
                <Ionicons
                  name={reply.isLiked ? "heart" : "heart-outline"}
                  size={16}
                  color={reply.isLiked ? "#EF4444" : "#6B7280"}
                />
                <Text
                  className={`text-sm ml-1 ${reply.isLiked ? "text-red-500" : "text-gray-500"}`}
                >
                  {reply.likesCount || 0}
                </Text>
              </TouchableOpacity>

              {/* Reply to this */}
              {onReply && !isNested && (
                <TouchableOpacity
                  className="flex-row items-center"
                  onPress={() => onReply(reply._id, reply.user?.username || "user")}
                >
                  <Ionicons name="arrow-undo-outline" size={16} color="#6B7280" />
                  <Text className="text-gray-500 text-sm ml-1">Reply</Text>
                </TouchableOpacity>
              )}

              {/* Accept as answer */}
              {canAccept && !isAcceptedAnswer && onAccept && (
                <TouchableOpacity
                  className="flex-row items-center"
                  onPress={() => onAccept(reply._id)}
                >
                  <Ionicons name="checkmark-circle-outline" size={16} color="#16A34A" />
                  <Text className="text-green-600 text-sm ml-1">Accept</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>

        {/* Nested replies */}
        {reply.nestedReplies && reply.nestedReplies.length > 0 && (
          <View className="mt-2">
            <TouchableOpacity
              className="flex-row items-center py-2"
              onPress={() => setShowNestedReplies(!showNestedReplies)}
            >
              <Ionicons
                name={showNestedReplies ? "chevron-down" : "chevron-forward"}
                size={14}
                color="#6B7280"
              />
              <Text className="text-gray-500 text-xs ml-1">
                {showNestedReplies ? "Hide" : "Show"} {reply.nestedReplies.length} replies
              </Text>
            </TouchableOpacity>

            {showNestedReplies && (
              <View className="mt-1">
                {reply.nestedReplies.map((nested) => (
                  <ReplyCard
                    key={nested._id}
                    reply={nested}
                    onLike={onLike}
                    currentUserId={currentUserId}
                    isNested
                  />
                ))}

                {reply.hasMoreNested && (
                  <TouchableOpacity className="py-2 pl-4">
                    <Text className="text-indigo-600 text-sm">
                      View {(reply.nestedCount || 0) - reply.nestedReplies.length} more replies
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
          </View>
        )}
      </View>
    </View>
  );
};

export default ReplyCard;
