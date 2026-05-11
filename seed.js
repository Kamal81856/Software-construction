const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const connectDB = require('./db');
const User = require('./models/User');
const Quiz = require('./models/Quiz');

dotenv.config();

const seedData = async () => {
  try {
    await connectDB();

    // Clear DB
    await User.deleteMany();
    await Quiz.deleteMany();

    console.log('Cleared DB');

    // Create Admin
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('admin123', salt);

    const admin = await User.create({
      name: 'Admin User',
      email: 'admin@quiz.com',
      password: hashedPassword,
      role: 'admin'
    });

    console.log('Admin created: admin@quiz.com / admin123');

    // Create Users
    const userPw = await bcrypt.hash('password123', salt);
    await User.create([
      { name: 'John Doe', email: 'john@quiz.com', password: userPw, role: 'user', totalPoints: 500, quizzesCompleted: 2 },
      { name: 'Jane Smith', email: 'jane@quiz.com', password: userPw, role: 'user', totalPoints: 800, quizzesCompleted: 3 }
    ]);

    console.log('Sample users created');

    // Create Quizzes
    await Quiz.create({
      title: 'General Knowledge Trivia',
      category: 'General',
      timer: 120,
      createdBy: admin._id,
      questions: [
        {
          questionText: 'What is the capital of France?',
          options: ['London', 'Berlin', 'Paris', 'Madrid'],
          correctAnswer: 2
        },
        {
          questionText: 'Which planet is known as the Red Planet?',
          options: ['Venus', 'Mars', 'Jupiter', 'Saturn'],
          correctAnswer: 1
        },
        {
          questionText: 'What is 8 x 7?',
          options: ['54', '56', '62', '48'],
          correctAnswer: 1
        }
      ]
    });

    console.log('Sample quiz created');
    
    console.log('Seeding complete!');
    process.exit();

  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

seedData();
