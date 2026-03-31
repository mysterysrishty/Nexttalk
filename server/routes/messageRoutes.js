const express = require('express');
const router = express.Router();
const { reactToMessage } = require('../controllers/messageController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.post('/:id/react', reactToMessage);

module.exports = router;