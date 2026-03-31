const express = require('express');
const router = express.Router();
const {
  getRooms,
  createRoom,
  getRoomById,
  joinRoom,
  leaveRoom,
  updateRoom,
  getMyRooms,
} = require('../controllers/roomController');
const { getRoomMessages } = require('../controllers/messageController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/my', getMyRooms);
router.route('/').get(getRooms).post(createRoom);
router.route('/:id').get(getRoomById).put(updateRoom);
router.post('/:id/join', joinRoom);
router.post('/:id/leave', leaveRoom);
router.get('/:id/messages', getRoomMessages);

module.exports = router;
