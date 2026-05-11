const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Quiz = require('../models/Quiz');
const Result = require('../models/Result');
const auth = require('../middleware/auth');
const admin = require('../middleware/admin');

// @route   GET /api/admin/users
// @desc    Get all users
// @access  Private Admin
router.get('/users', [auth, admin], async (req, res) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    res.json(users);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET /api/admin/stats
// @desc    Get overall stats
// @access  Private Admin
router.get('/stats', [auth, admin], async (req, res) => {
  try {
    const totalUsers = await User.countDocuments({ role: 'user' });
    const totalQuizzes = await Quiz.countDocuments();
    const totalAttempts = await Result.countDocuments();
    
    // recent activity
    const recentResults = await Result.find()
      .populate('user', 'name')
      .populate('quiz', 'title')
      .sort({ createdAt: -1 })
      .limit(5);

    res.json({
      totalUsers,
      totalQuizzes,
      totalAttempts,
      recentResults
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
