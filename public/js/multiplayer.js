const socket = io();
let isAdmin = false;
let roomCode = '';
let currentQuestionIndex = -1;

document.addEventListener('DOMContentLoaded', async () => {
  if (!isAuthenticated()) {
    window.location.href = '/login.html';
    return;
  }

  const user = getUserData();
  const urlParams = new URLSearchParams(window.location.search);
  isAdmin = urlParams.get('admin') === 'true' && user.role === 'admin';

  if (isAdmin) {
    document.getElementById('adminView').style.display = 'block';
    loadAdminQuizzes();
  } else {
    document.getElementById('playerView').style.display = 'block';
  }

  // Admin Events
  document.getElementById('createRoomBtn').addEventListener('click', () => {
    const quizId = document.getElementById('quizSelect').value;
    if (!quizId) return alert('Select a quiz first');
    socket.emit('createRoom', { quizId, adminId: user.id });
  });

  document.getElementById('startQuizBtn').addEventListener('click', () => {
    socket.emit('startQuiz', roomCode);
  });

  // Player Events
  document.getElementById('joinRoomBtn').addEventListener('click', () => {
    roomCode = document.getElementById('roomCodeInput').value.toUpperCase();
    if (!roomCode) return alert('Enter room code');
    socket.emit('joinRoom', { roomCode, user: { id: user.id, name: user.name } });
  });
});

async function loadAdminQuizzes() {
  try {
    const quizzes = await fetchApi('/quiz');
    const select = document.getElementById('quizSelect');
    quizzes.forEach(q => {
      const opt = document.createElement('option');
      opt.value = q._id;
      opt.textContent = q.title;
      select.appendChild(opt);
    });
  } catch(err) { console.error(err); }
}

// Socket Listeners
socket.on('roomCreated', (code) => {
  roomCode = code;
  document.getElementById('createRoomBtn').style.display = 'none';
  document.getElementById('quizSelect').style.display = 'none';
  document.getElementById('adminLobby').style.display = 'block';
  document.getElementById('adminRoomCode').textContent = code;
});

socket.on('playerJoined', (players) => {
  const html = players.map(p => `<span class="player-badge">${p.name}</span>`).join('');
  if (isAdmin) {
    document.getElementById('adminPlayersList').innerHTML = html;
  } else {
    document.getElementById('playerLobbyList').innerHTML = html;
  }
});

socket.on('roomJoined', () => {
  document.getElementById('roomCodeInput').style.display = 'none';
  document.getElementById('joinRoomBtn').style.display = 'none';
  document.getElementById('playerLobby').style.display = 'block';
});

socket.on('error', (msg) => {
  alert(msg);
});

socket.on('nextQuestion', (data) => {
  // Hide lobbies
  document.getElementById('lobbyContainer').style.display = 'none';
  document.getElementById('mpQuizContent').style.display = 'block';
  document.getElementById('mpOptions').style.display = 'grid';
  document.getElementById('mpWaiting').style.display = 'none';

  document.getElementById('mpQuestionText').textContent = data.questionText;
  
  const optionsDiv = document.getElementById('mpOptions');
  optionsDiv.innerHTML = data.options.map((opt, i) => `
    <button class="mp-btn opt-${i}" onclick="submitMpAnswer(${i})" ${isAdmin ? 'disabled' : ''}>${opt}</button>
  `).join('');
  
  startMpTimer(15); // Fixed 15s per question for multiplayer
});

let mpTimerInterval;
function startMpTimer(seconds) {
  let timeLeft = seconds;
  document.getElementById('mpTimer').textContent = timeLeft;
  clearInterval(mpTimerInterval);
  
  mpTimerInterval = setInterval(() => {
    timeLeft--;
    document.getElementById('mpTimer').textContent = timeLeft;
    if (timeLeft <= 0) {
      clearInterval(mpTimerInterval);
      if (!isAdmin) submitMpAnswer(-1); // Auto submit blank
    }
  }, 1000);
}

function submitMpAnswer(optionIndex) {
  if (isAdmin) return;
  clearInterval(mpTimerInterval);
  document.getElementById('mpOptions').style.display = 'none';
  document.getElementById('mpWaiting').style.display = 'block';
  
  socket.emit('submitAnswer', { roomCode, optionIndex });
}

socket.on('gameOver', (leaderboard) => {
  clearInterval(mpTimerInterval);
  document.getElementById('mpQuizContent').style.display = 'none';
  document.getElementById('mpLeaderboard').style.display = 'block';

  const tbody = document.getElementById('mpLeaderboardBody');
  tbody.innerHTML = leaderboard.map((p, i) => `
    <tr>
      <td>#${i + 1}</td>
      <td>${p.name}</td>
      <td>${p.score}</td>
    </tr>
  `).join('');
});
