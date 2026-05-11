const mongoose = require('mongoose');

const resultSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  quiz: { type: mongoose.Schema.Types.ObjectId, ref: 'Quiz', required: true },
  score: { type: Number, required: true },
  totalQuestions: { type: Number, required: true },
  percentage: { type: Number, required: true },
  passed: { type: Boolean, required: true },
  pointsEarned: { type: Number, default: 0 },
  timeTaken: { type: Number, default: 0 },
  answers: [{
    question: Number, // index
    selected: Number, // option index
    correct: Boolean
  }]
}, { timestamps: true });

module.exports = mongoose.model('Result', resultSchema);
