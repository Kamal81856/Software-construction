document.addEventListener('DOMContentLoaded', async () => {
  const user = getUserData();
  if (!user || user.role !== 'admin') {
    window.location.href = '/dashboard.html';
    return;
  }

  try {
    // Load Stats
    const stats = await fetchApi('/admin/stats');
    document.getElementById('statsGrid').innerHTML = `
      <div class="card stat-card">
        <div class="stat-number">${stats.totalUsers}</div>
        <div>Total Users</div>
      </div>
      <div class="card stat-card">
        <div class="stat-number">${stats.totalQuizzes}</div>
        <div>Total Quizzes</div>
      </div>
      <div class="card stat-card">
        <div class="stat-number">${stats.totalAttempts}</div>
        <div>Total Attempts</div>
      </div>
    `;

    // Load Quizzes
    await loadQuizzes();

  } catch (err) {
    showAlert('Error loading admin data: ' + err.message);
  }
});

async function loadQuizzes() {
  try {
    // Note: this uses public route but admin needs all quizzes even inactive, 
    // for simplicity we just fetch the public list here, but ideally we'd have an admin specific get all route
    const quizzes = await fetchApi('/quiz'); 
    const tbody = document.getElementById('quizzesTable');
    
    if (quizzes.length === 0) {
      tbody.innerHTML = '<tr><td colspan="5" class="text-center">No quizzes found.</td></tr>';
      return;
    }

    tbody.innerHTML = quizzes.map(q => `
      <tr>
        <td><strong>${q.title}</strong></td>
        <td>${q.category}</td>
        <td>${q.questions.length}</td>
        <td><span class="status-badge status-pass">Active</span></td>
        <td>
          <a href="/admin-quiz.html?id=${q._id}" class="btn" style="padding: 6px 12px; background: var(--color-blue); color: white;">Edit</a>
          <a href="/admin-analytics.html?id=${q._id}" class="btn" style="padding: 6px 12px; background: #eee;">Stats</a>
          <button onclick="deleteQuiz('${q._id}')" class="btn btn-danger" style="padding: 6px 12px;">Delete</button>
        </td>
      </tr>
    `).join('');
  } catch (err) {
    showAlert('Error loading quizzes: ' + err.message);
  }
}

async function deleteQuiz(id) {
  if (!confirm('Are you sure you want to delete this quiz?')) return;
  
  try {
    await fetchApi(`/quiz/${id}`, { method: 'DELETE' });
    showAlert('Quiz deleted successfully', 'success');
    loadQuizzes();
  } catch (err) {
    showAlert('Error deleting quiz: ' + err.message);
  }
}
