const Room = require('../models/room');
const User = require('../models/User');

// GET /api/rooms  – list public rooms
const getRooms = async (req, res) => {
  try {
    const keyword = req.query.search
      ? { name: { $regex: req.query.search, $options: 'i' }, type: 'public' }
      : { type: 'public' };

    const rooms = await Room.find(keyword)
      .populate('creator', 'username avatar')
      .populate('members', 'username avatar status')
      .sort({ createdAt: -1 });

    res.json(rooms);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// POST /api/rooms – create room
const createRoom = async (req, res) => {
  try {
    const { name, description, type } = req.body;
    if (!name) return res.status(400).json({ message: 'Room name is required' });

    const room = await Room.create({
      name,
      description,
      type: type || 'public',
      creator: req.user._id,
      members: [req.user._id],
    });

    await User.findByIdAndUpdate(req.user._id, { $addToSet: { rooms: room._id } });

    const populated = await Room.findById(room._id)
      .populate('creator', 'username avatar')
      .populate('members', 'username avatar status');

    res.status(201).json(populated);
  } catch (error) {
    if (error.code === 11000) return res.status(400).json({ message: 'Room name already taken' });
    res.status(500).json({ message: error.message });
  }
};

// GET /api/rooms/:id
const getRoomById = async (req, res) => {
  try {
    const room = await Room.findById(req.params.id)
      .populate('creator', 'username avatar')
      .populate('members', 'username avatar status');

    if (!room) return res.status(404).json({ message: 'Room not found' });
    res.json(room);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// POST /api/rooms/:id/join
const joinRoom = async (req, res) => {
  try {
    const room = await Room.findById(req.params.id);
    if (!room) return res.status(404).json({ message: 'Room not found' });

    if (room.type === 'private') {
      return res.status(403).json({ message: 'This room is private' });
    }

    await Room.findByIdAndUpdate(req.params.id, {
      $addToSet: { members: req.user._id },
    });
    await User.findByIdAndUpdate(req.user._id, {
      $addToSet: { rooms: req.params.id },
    });

    const updated = await Room.findById(req.params.id)
      .populate('creator', 'username avatar')
      .populate('members', 'username avatar status');

    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// POST /api/rooms/:id/leave
const leaveRoom = async (req, res) => {
  try {
    await Room.findByIdAndUpdate(req.params.id, {
      $pull: { members: req.user._id },
    });
    await User.findByIdAndUpdate(req.user._id, {
      $pull: { rooms: req.params.id },
    });
    res.json({ message: 'Left room successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// PUT /api/rooms/:id – update room (creator only)
const updateRoom = async (req, res) => {
  try {
    const room = await Room.findById(req.params.id);
    if (!room) return res.status(404).json({ message: 'Room not found' });
    if (room.creator.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only the creator can edit this room' });
    }

    const { name, description } = req.body;
    if (name) room.name = name;
    if (description !== undefined) room.description = description;

    await room.save();
    const updated = await Room.findById(room._id)
      .populate('creator', 'username avatar')
      .populate('members', 'username avatar status');

    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/rooms/my – rooms the current user belongs to
const getMyRooms = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate({
      path: 'rooms',
      populate: [
        { path: 'creator', select: 'username avatar' },
        { path: 'members', select: 'username avatar status' },
        { path: 'lastMessage', populate: { path: 'sender', select: 'username' } },
      ],
    });
    res.json(user.rooms);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getRooms, createRoom, getRoomById, joinRoom, leaveRoom, updateRoom, getMyRooms };
