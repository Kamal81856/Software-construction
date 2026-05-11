document.addEventListener('DOMContentLoaded', async () => {
  if (!isAuthenticated()) {
    window.location.href = '/login.html';
    return;
  }

  const urlParams = new URLSearchParams(window.location.search);
  const resultId = urlParams.get('id');

  if (!resultId) {
    // If no ID, try to get latest from 'my' results
    try {
      const results = await fetchApi('/results/my');
      if (results.length > 0) {
        displayResult(results[0]);
      } else {
        window.location.href = '/dashboard.html';
      }
    } catch (err) {
      window.location.href = '/dashboard.html';
    }
  } else {
    // Ideally we would fetch a specific result, but /my returns all user's results
    // so we can just find it there for simplicity
    try {
      const results = await fetchApi('/results/my');
      const result = results.find(r => r._id === resultId);
      if (result) {
        displayResult(result);
      } else {
        window.location.href = '/dashboard.html';
      }
    } catch (err) {
      alert('Error loading result');
      window.location.href = '/dashboard.html';
    }
  }
});

function displayResult(result) {
  const scoreCircle = document.getElementById('scoreCircle');
  const statusBadge = document.getElementById('statusBadge');
  const scoreDetails = document.getElementById('scoreDetails');
  const pointsEarned = document.getElementById('pointsEarned');

  scoreCircle.textContent = `${Math.round(result.percentage)}%`;
  
  if (result.passed) {
    statusBadge.textContent = 'PASSED';
    statusBadge.className = 'status-badge status-pass';
    scoreCircle.style.background = 'var(--color-green)';
    scoreCircle.style.boxShadow = '0 0 0 10px rgba(38, 137, 12, 0.2)';
  } else {
    statusBadge.textContent = 'FAILED';
    statusBadge.className = 'status-badge status-fail';
    scoreCircle.style.background = 'var(--color-red)';
    scoreCircle.style.boxShadow = '0 0 0 10px rgba(226, 27, 60, 0.2)';
  }

  scoreDetails.textContent = `You scored ${result.score} out of ${result.totalQuestions} correct. Time taken: ${result.timeTaken}s.`;
  pointsEarned.textContent = result.pointsEarned;
}
