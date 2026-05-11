const express = require('express');
const router = express.Router();
const Quiz = require('../models/Quiz');
const auth = require('../middleware/auth');
const admin = require('../middleware/admin');

// @route   GET /api/quiz
// @desc    Get all active quizzes
// @access  Public
router.get('/', async (req, res) => {
  try {
    // Return quizzes without correct answers if public
    const quizzes = await Quiz.find({ isActive: true }).select('-questions.correctAnswer');
    res.json(quizzes);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET /api/quiz/:id
// @desc    Get quiz by ID (without correct answers)
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id).select('-questions.correctAnswer');
    if (!quiz) return res.status(404).json({ message: 'Quiz not found' });
    res.json(quiz);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   POST /api/quiz
// @desc    Create a quiz
// @access  Private Admin
router.post('/', [auth, admin], async (req, res) => {
  try {
    const newQuiz = new Quiz({
      ...req.body,
      createdBy: req.user.id
    });
    const quiz = await newQuiz.save();
    res.json(quiz);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   PUT /api/quiz/:id
// @desc    Update a quiz
// @access  Private Admin
router.put('/:id', [auth, admin], async (req, res) => {
  try {
    const quiz = await Quiz.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!quiz) return res.status(404).json({ message: 'Quiz not found' });
    res.json(quiz);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   DELETE /api/quiz/:id
// @desc    Delete a quiz
// @access  Private Admin
router.delete('/:id', [auth, admin], async (req, res) => {
  try {
    const quiz = await Quiz.findByIdAndDelete(req.params.id);
    if (!quiz) return res.status(404).json({ message: 'Quiz not found' });
    res.json({ message: 'Quiz removed' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
