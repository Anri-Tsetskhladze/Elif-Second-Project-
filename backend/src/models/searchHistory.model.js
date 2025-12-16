import mongoose from "mongoose";

const searchHistorySchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    query: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      maxlength: 200,
    },
    count: {
      type: Number,
      default: 1,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for efficient lookups
searchHistorySchema.index({ user: 1, query: 1 }, { unique: true });
searchHistorySchema.index({ user: 1, updatedAt: -1 });
searchHistorySchema.index({ query: 1, count: -1 });

const SearchHistory = mongoose.model("SearchHistory", searchHistorySchema);

export default SearchHistory;
