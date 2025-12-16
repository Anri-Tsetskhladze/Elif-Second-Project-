import mongoose from "mongoose";

const conversationSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["direct", "group"],
      default: "direct",
    },

    participants: [{
      user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
      joinedAt: { type: Date, default: Date.now },
      lastReadAt: { type: Date, default: Date.now },
      isAdmin: { type: Boolean, default: false },
      isMuted: { type: Boolean, default: false },
      mutedUntil: { type: Date },
    }],

    groupInfo: {
      name: { type: String, trim: true, maxLength: 50 },
      description: { type: String, trim: true, maxLength: 200 },
      avatar: { type: String },
      createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    },

    lastMessage: {
      content: { type: String },
      sender: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      sentAt: { type: Date },
      type: { type: String, enum: ["text", "image", "file", "system"] },
    },

    university: { type: mongoose.Schema.Types.ObjectId, ref: "University" },

    messageCount: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

conversationSchema.index({ "participants.user": 1 });
conversationSchema.index({ "lastMessage.sentAt": -1 });
conversationSchema.index({ type: 1, university: 1 });

conversationSchema.virtual("participantCount").get(function () {
  return this.participants?.length || 0;
});

conversationSchema.methods.addParticipant = function (userId, isAdmin = false) {
  if (!this.participants.some((p) => p.user.toString() === userId.toString())) {
    this.participants.push({ user: userId, isAdmin });
    return true;
  }
  return false;
};

conversationSchema.methods.removeParticipant = function (userId) {
  const idx = this.participants.findIndex((p) => p.user.toString() === userId.toString());
  if (idx > -1) {
    this.participants.splice(idx, 1);
    return true;
  }
  return false;
};

conversationSchema.methods.isParticipant = function (userId) {
  return this.participants.some((p) => p.user.toString() === userId.toString());
};

conversationSchema.methods.isAdmin = function (userId) {
  const participant = this.participants.find((p) => p.user.toString() === userId.toString());
  return participant?.isAdmin || false;
};

conversationSchema.methods.getUnreadCount = function (userId) {
  const participant = this.participants.find((p) => p.user.toString() === userId.toString());
  if (!participant || !this.lastMessage?.sentAt) return 0;
  return participant.lastReadAt < this.lastMessage.sentAt ? 1 : 0;
};

conversationSchema.methods.markAsRead = function (userId) {
  const participant = this.participants.find((p) => p.user.toString() === userId.toString());
  if (participant) {
    participant.lastReadAt = new Date();
  }
};

conversationSchema.statics.findOrCreateDirect = async function (user1Id, user2Id) {
  let conversation = await this.findOne({
    type: "direct",
    "participants.user": { $all: [user1Id, user2Id] },
    $expr: { $eq: [{ $size: "$participants" }, 2] },
  });

  if (!conversation) {
    conversation = await this.create({
      type: "direct",
      participants: [{ user: user1Id }, { user: user2Id }],
    });
  }

  return conversation;
};

conversationSchema.statics.createGroup = async function (creatorId, name, participantIds, university) {
  const participants = [{ user: creatorId, isAdmin: true }];
  participantIds.forEach((id) => {
    if (id.toString() !== creatorId.toString()) {
      participants.push({ user: id });
    }
  });

  return this.create({
    type: "group",
    participants,
    groupInfo: { name, createdBy: creatorId },
    university,
  });
};

conversationSchema.statics.getUserConversations = function (userId, options = {}) {
  const { page = 1, limit = 20 } = options;

  return this.find({ "participants.user": userId, isActive: true })
    .sort({ "lastMessage.sentAt": -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .populate("participants.user", "username firstName lastName profilePicture isOnline")
    .populate("lastMessage.sender", "username firstName lastName");
};

const Conversation = mongoose.model("Conversation", conversationSchema);

const messageSchema = new mongoose.Schema(
  {
    conversation: { type: mongoose.Schema.Types.ObjectId, ref: "Conversation", required: true, index: true },
    sender: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },

    type: {
      type: String,
      enum: ["text", "image", "file", "system"],
      default: "text",
    },

    content: { type: String, trim: true, maxLength: 2000 },

    attachments: [{
      url: { type: String, required: true },
      filename: { type: String },
      mimeType: { type: String },
      size: { type: Number },
    }],

    replyTo: { type: mongoose.Schema.Types.ObjectId, ref: "Message" },

    readBy: [{
      user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      readAt: { type: Date, default: Date.now },
    }],

    reactions: [{
      user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      emoji: { type: String },
      createdAt: { type: Date, default: Date.now },
    }],

    isEdited: { type: Boolean, default: false },
    editedAt: { type: Date },
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

messageSchema.index({ conversation: 1, createdAt: -1 });
messageSchema.index({ sender: 1, createdAt: -1 });
messageSchema.index({ content: "text" });

messageSchema.methods.markAsRead = function (userId) {
  if (!this.readBy.some((r) => r.user.toString() === userId.toString())) {
    this.readBy.push({ user: userId });
  }
};

messageSchema.methods.addReaction = function (userId, emoji) {
  const existing = this.reactions.find((r) => r.user.toString() === userId.toString());
  if (existing) {
    existing.emoji = emoji;
    existing.createdAt = new Date();
  } else {
    this.reactions.push({ user: userId, emoji });
  }
};

messageSchema.methods.removeReaction = function (userId) {
  this.reactions = this.reactions.filter((r) => r.user.toString() !== userId.toString());
};

messageSchema.methods.softDelete = function () {
  this.isDeleted = true;
  this.deletedAt = new Date();
  this.content = "";
  this.attachments = [];
};

messageSchema.statics.getByConversation = function (conversationId, options = {}) {
  const { page = 1, limit = 50, before } = options;

  const query = { conversation: conversationId };
  if (before) query.createdAt = { $lt: before };

  return this.find(query)
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .populate("sender", "username firstName lastName profilePicture")
    .populate("replyTo", "content sender");
};

messageSchema.statics.search = function (conversationId, searchTerm, limit = 20) {
  return this.find({
    conversation: conversationId,
    isDeleted: false,
    $text: { $search: searchTerm },
  })
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate("sender", "username firstName lastName profilePicture");
};

messageSchema.post("save", async function () {
  if (this.isNew) {
    await Conversation.findByIdAndUpdate(this.conversation, {
      lastMessage: {
        content: this.content?.substring(0, 100),
        sender: this.sender,
        sentAt: this.createdAt,
        type: this.type,
      },
      $inc: { messageCount: 1 },
    });
  }
});

const Message = mongoose.model("Message", messageSchema);

export { Conversation, Message };
export default Message;
