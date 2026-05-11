document.addEventListener('DOMContentLoaded', async () => {
  try {
    const users = await fetchApi('/users/leaderboard');
    const currentUser = getUserData();

    if (users.length === 0) {
      document.getElementById('podiumContainer').innerHTML = '<p>No data available yet.</p>';
      return;
    }

    // Render Podium (Top 3)
    const podiumContainer = document.getElementById('podiumContainer');
    const top3 = users.slice(0, 3);
    
    // Reorder for visual podium: 2, 1, 3
    const visualOrder = [];
    if (top3[1]) visualOrder.push({ ...top3[1], rank: 2 });
    if (top3[0]) visualOrder.push({ ...top3[0], rank: 1 });
    if (top3[2]) visualOrder.push({ ...top3[2], rank: 3 });

    podiumContainer.innerHTML = visualOrder.map(u => `
      <div class="podium-item rank-${u.rank}">
        <div class="podium-name">${u.name}</div>
        <div class="podium-pts">${u.totalPoints} pts</div>
        <div class="podium-block">${u.rank}</div>
      </div>
    `).join('');

    // Render Table (Rank 4+)
    const tbody = document.getElementById('leaderboardTable');
    
    if (users.length > 3) {
      tbody.innerHTML = users.slice(3).map((u, i) => {
        const isCurrentUser = currentUser && currentUser.id === u._id;
        return `
          <tr class="${isCurrentUser ? 'current-user-row' : ''}">
            <td>#${i + 4}</td>
            <td>${u.name} ${isCurrentUser ? '(You)' : ''}</td>
            <td>${u.quizzesCompleted}</td>
            <td><strong>${u.totalPoints}</strong></td>
          </tr>
        `;
      }).join('');
    } else {
      tbody.innerHTML = '<tr><td colspan="4" class="text-center">No more players.</td></tr>';
    }

  } catch (err) {
    showAlert('Error loading leaderboard: ' + err.message);
  }
});
