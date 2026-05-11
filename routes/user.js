const express = require('express');
const router = express.Router();
const User = require('../models/User');
const auth = require('../middleware/auth');

// @route   GET /api/users/leaderboard
// @desc    Get top users by points
// @access  Public
router.get('/leaderboard', async (req, res) => {
  try {
    const users = await User.find({ role: 'user' })
      .select('name totalPoints quizzesCompleted')
      .sort({ totalPoints: -1 })
      .limit(20);
    res.json(users);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET /api/users/profile
// @desc    Get user profile (stats)
// @access  Private
router.get('/profile', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    
    // Find rank by counting users with more points
    const rank = await User.countDocuments({ role: 'user', totalPoints: { $gt: user.totalPoints } }) + 1;
    
    res.json({ user, rank });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
