const express = require('express');
const router = express.Router();
const { getMyDMs, getOrCreateDM, getDMMessages } = require('../controllers/DmController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/', getMyDMs);
router.get('/user/:userId', getOrCreateDM);
router.get('/:conversationId/messages', getDMMessages);

module.exports = router;
