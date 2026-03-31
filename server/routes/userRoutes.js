const express = require('express');
const router = express.Router();
const { searchUsers, getUserById, updateProfile } = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/search', searchUsers);
router.get('/:id', getUserById);
router.put('/profile', updateProfile);

module.exports = router;
