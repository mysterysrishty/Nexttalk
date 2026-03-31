const Message = require('../models/Message');
const Room = require('../models/room');
const DirectConversation = require('../models/DirectConversation');
const User = require('../models/User');
const jwt = require('jsonwebtoken');

const onlineUsers = new Map(); // userId -> socketId

const socketHandler = (io) => {
  // Middleware: authenticate socket connection
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) return next(new Error('Authentication error'));
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select('-password');
      if (!user) return next(new Error('User not found'));
      socket.user = user;
      next();
    } catch (err) {
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', async (socket) => {
    const userId = socket.user._id.toString();
    onlineUsers.set(userId, socket.id);

    // Mark user online
    await User.findByIdAndUpdate(userId, { status: 'online' });
    io.emit('user_status', { userId, status: 'online' });

    console.log(`User connected: ${socket.user.username}`);

    // ─── Room events ──────────────────────────────────────────────────────────

    socket.on('join_room', (roomId) => {
      socket.join(roomId);
      socket.to(roomId).emit('room_notification', {
        message: `${socket.user.username} joined the room`,
        userId,
        username: socket.user.username,
      });
    });

    socket.on('leave_room', (roomId) => {
      socket.leave(roomId);
      socket.to(roomId).emit('room_notification', {
        message: `${socket.user.username} left the room`,
        userId,
        username: socket.user.username,
      });
    });

    socket.on('send_message', async (data) => {
      try {
        const { roomId, content, type, fileUrl, fileName } = data;

        const message = await Message.create({
          sender: userId,
          room: roomId,
          content,
          type: type || 'text',
          fileUrl: fileUrl || '',
          fileName: fileName || '',
          readBy: [userId],
        });

        // Update room's lastMessage
        await Room.findByIdAndUpdate(roomId, { lastMessage: message._id });

        const populated = await Message.findById(message._id).populate(
          'sender',
          'username avatar'
        );

        io.to(roomId).emit('receive_message', populated);
      } catch (err) {
        socket.emit('error', { message: err.message });
      }
    });

    // ─── DM events ────────────────────────────────────────────────────────────

    socket.on('join_dm', (conversationId) => {
      socket.join(`dm_${conversationId}`);
    });

    socket.on('send_dm', async (data) => {
      try {
        const { conversationId, content, type, fileUrl, fileName } = data;

        const convo = await DirectConversation.findById(conversationId);
        if (!convo) return socket.emit('error', { message: 'Conversation not found' });

        const message = await Message.create({
          sender: userId,
          directConversation: conversationId,
          content,
          type: type || 'text',
          fileUrl: fileUrl || '',
          fileName: fileName || '',
          readBy: [userId],
        });

        await DirectConversation.findByIdAndUpdate(conversationId, {
          lastMessage: message._id,
          updatedAt: Date.now(),
        });

        const populated = await Message.findById(message._id).populate(
          'sender',
          'username avatar'
        );

        io.to(`dm_${conversationId}`).emit('receive_dm', populated);

        // Notify recipient if not in conversation room
        const recipientId = convo.participants
          .find((p) => p.toString() !== userId)
          ?.toString();

        if (recipientId) {
          const recipientSocketId = onlineUsers.get(recipientId);
          if (recipientSocketId) {
            io.to(recipientSocketId).emit('dm_notification', {
              conversationId,
              message: populated,
              from: { userId, username: socket.user.username, avatar: socket.user.avatar },
            });
          }
        }
      } catch (err) {
        socket.emit('error', { message: err.message });
      }
    });

    // ─── Typing indicators ────────────────────────────────────────────────────

    socket.on('typing', ({ roomId, conversationId }) => {
      const payload = {
        userId,
        username: socket.user.username,
        avatar: socket.user.avatar,
      };
      if (roomId) socket.to(roomId).emit('user_typing', { ...payload, roomId });
      if (conversationId) socket.to(`dm_${conversationId}`).emit('user_typing', { ...payload, conversationId });
    });

    socket.on('stop_typing', ({ roomId, conversationId }) => {
      const payload = { userId };
      if (roomId) socket.to(roomId).emit('user_stop_typing', { ...payload, roomId });
      if (conversationId) socket.to(`dm_${conversationId}`).emit('user_stop_typing', { ...payload, conversationId });
    });

    // ─── Reactions (via socket, supplements REST endpoint) ────────────────────

    socket.on('message_reaction', (data) => {
      const { roomId, conversationId, message } = data;
      if (roomId) io.to(roomId).emit('reaction_update', message);
      if (conversationId) io.to(`dm_${conversationId}`).emit('reaction_update', message);
    });

    // ─── Disconnect ───────────────────────────────────────────────────────────

    socket.on('disconnect', async () => {
      onlineUsers.delete(userId);
      await User.findByIdAndUpdate(userId, { status: 'offline' });
      io.emit('user_status', { userId, status: 'offline' });
      console.log(`User disconnected: ${socket.user.username}`);
    });
  });
};

module.exports = socketHandler;

