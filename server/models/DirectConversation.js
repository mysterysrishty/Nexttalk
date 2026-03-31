const mongoose = require('mongoose');

const directConversationSchema = new mongoose.Schema(
  {
    participants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
      },
    ],
    lastMessage: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Message',
    },
  },
  { timestamps: true }
);

directConversationSchema.index({ participants: 1 });

module.exports = mongoose.model('DirectConversation', directConversationSchema);
