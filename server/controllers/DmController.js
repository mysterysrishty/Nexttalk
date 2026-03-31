const DirectConversation = require('../models/DirectConversation');
const Message = require('../models/Message');

// GET /api/dms – all DM conversations for current user
const getMyDMs = async (req, res) => {
  try {
    const convos = await DirectConversation.find({
      participants: req.user._id,
    })
      .populate('participants', 'username avatar status')
      .populate({
        path: 'lastMessage',
        populate: { path: 'sender', select: 'username' },
      })
      .sort({ updatedAt: -1 });

    res.json(convos);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/dms/:userId – get or create DM conversation with a user
const getOrCreateDM = async (req, res) => {
  try {
    const otherUserId = req.params.userId;

    let convo = await DirectConversation.findOne({
      participants: { $all: [req.user._id, otherUserId] },
    }).populate('participants', 'username avatar status');

    if (!convo) {
      convo = await DirectConversation.create({
        participants: [req.user._id, otherUserId],
      });
      convo = await DirectConversation.findById(convo._id).populate(
        'participants',
        'username avatar status'
      );
    }

    res.json(convo);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/dms/:conversationId/messages
const getDMMessages = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 30;
    const skip = (page - 1) * limit;

    const messages = await Message.find({
      directConversation: req.params.conversationId,
    })
      .populate('sender', 'username avatar')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Message.countDocuments({
      directConversation: req.params.conversationId,
    });

    res.json({
      messages: messages.reverse(),
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      hasMore: skip + messages.length < total,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getMyDMs, getOrCreateDM, getDMMessages };
