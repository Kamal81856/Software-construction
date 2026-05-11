const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');
const connectDB = require('./db');

dotenv.config();

// Connect to Database
connectDB();

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/quiz', require('./routes/quiz'));
app.use('/api/results', require('./routes/result'));
app.use('/api/users', require('./routes/user'));
app.use('/api/admin', require('./routes/admin'));

// Socket.io for Multiplayer
const rooms = {}; // Store room states
const Quiz = require('./models/Quiz'); // Need quiz model for questions

io.on('connection', (socket) => {
  console.log('New client connected', socket.id);

  socket.on('createRoom', async ({ quizId, adminId }) => {
    try {
      const roomCode = Math.random().toString(36).substring(2, 8).toUpperCase();
      const quiz = await Quiz.findById(quizId);
      
      rooms[roomCode] = {
        adminId: socket.id,
        quiz: quiz,
        players: [], // { id: socket.id, name: user.name, score: 0, currentAnswer: null }
        currentQuestionIndex: -1,
        isActive: true
      };
      
      socket.join(roomCode);
      socket.emit('roomCreated', roomCode);
    } catch(err) {
      socket.emit('error', 'Error creating room');
    }
  });

  socket.on('joinRoom', ({ roomCode, user }) => {
    const room = rooms[roomCode];
    if (!room || !room.isActive || room.currentQuestionIndex >= 0) {
      return socket.emit('error', 'Invalid room or game already started');
    }
    
    room.players.push({
      id: socket.id,
      name: user.name,
      score: 0,
      currentAnswer: null
    });
    
    socket.join(roomCode);
    socket.emit('roomJoined');
    io.to(roomCode).emit('playerJoined', room.players);
  });

  socket.on('startQuiz', (roomCode) => {
    const room = rooms[roomCode];
    if (room && room.adminId === socket.id) {
      room.currentQuestionIndex = 0;
      sendNextQuestion(roomCode);
    }
  });

  socket.on('submitAnswer', ({ roomCode, optionIndex }) => {
    const room = rooms[roomCode];
    if (room) {
      const player = room.players.find(p => p.id === socket.id);
      if (player) {
        player.currentAnswer = optionIndex;
      }

      // Check if all players answered
      const allAnswered = room.players.every(p => p.currentAnswer !== null);
      if (allAnswered) {
        processAnswersAndNextQuestion(roomCode);
      }
    }
  });

  function processAnswersAndNextQuestion(roomCode) {
    const room = rooms[roomCode];
    if (!room) return;

    const q = room.quiz.questions[room.currentQuestionIndex];
    
    // Update scores
    room.players.forEach(p => {
      if (p.currentAnswer === q.correctAnswer) {
        p.score += 100;
      }
      p.currentAnswer = null; // reset for next Q
    });

    // Move to next
    room.currentQuestionIndex++;
    if (room.currentQuestionIndex < room.quiz.questions.length) {
      sendNextQuestion(roomCode);
    } else {
      // Game Over
      room.players.sort((a, b) => b.score - a.score);
      io.to(roomCode).emit('gameOver', room.players);
      delete rooms[roomCode]; // cleanup
    }
  }

  function sendNextQuestion(roomCode) {
    const room = rooms[roomCode];
    const q = room.quiz.questions[room.currentQuestionIndex];
    
    io.to(roomCode).emit('nextQuestion', {
      questionText: q.questionText,
      options: q.options
    });

    // Auto move to next question if time runs out (15s + buffer)
    // Clear previous timeout if exists
    if(room.timeout) clearTimeout(room.timeout);
    room.timeout = setTimeout(() => {
      // If not all answered in time, force process
      if(rooms[roomCode]) {
         processAnswersAndNextQuestion(roomCode);
      }
    }, 16000);
  }

  socket.on('disconnect', () => {
    console.log('Client disconnected', socket.id);
    // Basic cleanup: remove from players if they were in a room
    for (const code in rooms) {
      const room = rooms[code];
      room.players = room.players.filter(p => p.id !== socket.id);
      io.to(code).emit('playerJoined', room.players); // update lobby
    }
  });
});

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
