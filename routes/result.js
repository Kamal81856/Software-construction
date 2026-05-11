const express = require('express');
const router = express.Router();
const Result = require('../models/Result');
const Quiz = require('../models/Quiz');
const User = require('../models/User');
const auth = require('../middleware/auth');
const admin = require('../middleware/admin');

// @route   POST /api/results/submit
// @desc    Submit a quiz result
// @access  Private
router.post('/submit', auth, async (req, res) => {
  try {
    const { quizId, answers, timeTaken } = req.body;
    const quiz = await Quiz.findById(quizId);
    
    if (!quiz) return res.status(404).json({ message: 'Quiz not found' });

    let score = 0;
    const processedAnswers = [];

    answers.forEach(ans => {
      const q = quiz.questions[ans.question];
      const isCorrect = q.correctAnswer === ans.selected;
      if (isCorrect) score++;
      
      processedAnswers.push({
        question: ans.question,
        selected: ans.selected,
        correct: isCorrect
      });
    });

    const totalQuestions = quiz.questions.length;
    const percentage = (score / totalQuestions) * 100;
    const passed = percentage >= 50;
    
    // Calculate points (e.g., 100 points per correct answer, bonus for time if desired)
    const pointsEarned = score * 100;

    const result = new Result({
      user: req.user.id,
      quiz: quizId,
      score,
      totalQuestions,
      percentage,
      passed,
      pointsEarned,
      timeTaken,
      answers: processedAnswers
    });

    await result.save();

    // Update user stats
    await User.findByIdAndUpdate(req.user.id, {
      $inc: { totalPoints: pointsEarned, quizzesCompleted: 1 }
    });

    res.json(result);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET /api/results/my
// @desc    Get user's results
// @access  Private
router.get('/my', auth, async (req, res) => {
  try {
    const results = await Result.find({ user: req.user.id })
      .populate('quiz', ['title', 'category'])
      .sort({ createdAt: -1 });
    res.json(results);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET /api/results/quiz/:quizId
// @desc    Get all results for a specific quiz
// @access  Private Admin
router.get('/quiz/:quizId', [auth, admin], async (req, res) => {
  try {
    const results = await Result.find({ quiz: req.params.quizId })
      .populate('user', ['name', 'email'])
      .sort({ score: -1 });
    res.json(results);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET /api/results/analytics/:quizId
// @desc    Get analytics for a specific quiz
// @access  Private Admin
router.get('/analytics/:quizId', [auth, admin], async (req, res) => {
  try {
    const results = await Result.find({ quiz: req.params.quizId });
    if (!results || results.length === 0) {
      return res.json({ attempts: 0, averageScore: 0, highestScore: 0 });
    }

    const attempts = results.length;
    const totalScore = results.reduce((acc, curr) => acc + curr.score, 0);
    const averageScore = totalScore / attempts;
    const highestScore = Math.max(...results.map(r => r.score));

    res.json({ attempts, averageScore, highestScore });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
