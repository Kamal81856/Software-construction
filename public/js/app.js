const API_URL = '/api';

// Utility: Check if user is logged in
const isAuthenticated = () => {
  return localStorage.getItem('token') !== null;
};

// Utility: Get User Data
const getUserData = () => {
  const user = localStorage.getItem('user');
  return user ? JSON.parse(user) : null;
};

// Utility: API Fetch wrapper with Auth
const fetchApi = async (endpoint, options = {}) => {
  const token = localStorage.getItem('token');
  
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || data.errors?.[0]?.msg || 'API Error');
  }

  return data;
};

// Utility: Show Alert
const showAlert = (message, type = 'error') => {
  const alertDiv = document.createElement('div');
  alertDiv.className = `alert alert-${type}`;
  alertDiv.textContent = message;
  
  // Try to find a form to insert before, or fallback to top of container
  const form = document.querySelector('form');
  if (form) {
    form.parentNode.insertBefore(alertDiv, form);
  } else {
    const container = document.querySelector('.container');
    if (container) {
      container.insertBefore(alertDiv, container.firstChild);
    }
  }

  setTimeout(() => {
    alertDiv.remove();
  }, 3000);
};

// Logout
const logout = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  window.location.href = '/login.html';
};

// Inject Navbar
const injectNavbar = () => {
  const user = getUserData();
  const navbarHtml = `
    <nav class="navbar">
      <div class="container">
        <a href="${user ? '/dashboard.html' : '/index.html'}" class="navbar-brand">QuizApp</a>
        <div class="navbar-nav">
          ${user ? `
            <a href="/dashboard.html" class="nav-link">Dashboard</a>
            <a href="/leaderboard.html" class="nav-link">Leaderboard</a>
            ${user.role === 'admin' ? `<a href="/admin-dashboard.html" class="nav-link">Admin</a>` : ''}
            <span class="nav-link"><b>${user.name}</b></span>
            <a href="#" class="btn btn-danger" onclick="logout()" style="padding: 6px 12px;">Logout</a>
          ` : `
            <a href="/login.html" class="nav-link">Login</a>
            <a href="/register.html" class="btn btn-primary">Register</a>
          `}
        </div>
      </div>
    </nav>
  `;
  document.body.insertAdjacentHTML('afterbegin', navbarHtml);
};

// Run on page load
document.addEventListener('DOMContentLoaded', () => {
  // Don't inject navbar on quiz taking page to avoid distraction
  if (!window.location.pathname.includes('quiz.html') || window.location.pathname.includes('admin-quiz.html')) {
    injectNavbar();
  }
});
