document.addEventListener('DOMContentLoaded', async () => {
  if (!isAuthenticated()) {
    window.location.href = '/login.html';
    return;
  }

  const user = getUserData();
  document.getElementById('welcomeName').textContent = `Welcome back, ${user.name}!`;

  try {
    // Load User Stats
    const profileData = await fetchApi('/users/profile');
    document.getElementById('userPoints').textContent = profileData.user.totalPoints;
    document.getElementById('userQuizzes').textContent = profileData.user.quizzesCompleted;

    // Load Quizzes
    const quizzes = await fetchApi('/quiz');
    const quizList = document.getElementById('quizList');
    
    if (quizzes.length === 0) {
      quizList.innerHTML = '<p>No quizzes available right now. Check back later!</p>';
      return;
    }

    quizList.innerHTML = quizzes.map(quiz => `
      <div class="quiz-card">
        <h3 class="quiz-title">${quiz.title}</h3>
        <p class="quiz-meta">Category: ${quiz.category}<br>Time: ${quiz.timer / 60} mins<br>Questions: ${quiz.questions.length}</p>
        <a href="/quiz.html?id=${quiz._id}" class="btn btn-primary">Join Quiz</a>
      </div>
    `).join('');

  } catch (err) {
    showAlert('Error loading dashboard data: ' + err.message);
  }
});
