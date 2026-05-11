document.addEventListener('DOMContentLoaded', () => {
  // Redirect to dashboard if already logged in
  if (isAuthenticated()) {
    const user = getUserData();
    if (user.role === 'admin') {
      window.location.href = '/admin-dashboard.html';
    } else {
      window.location.href = '/dashboard.html';
    }
  }

  const loginForm = document.getElementById('loginForm');
  const registerForm = document.getElementById('registerForm');

  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('email').value;
      const password = document.getElementById('password').value;

      try {
        const data = await fetchApi('/auth/login', {
          method: 'POST',
          body: JSON.stringify({ email, password })
        });

        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        
        if (data.user.role === 'admin') {
          window.location.href = '/admin-dashboard.html';
        } else {
          window.location.href = '/dashboard.html';
        }
      } catch (err) {
        showAlert(err.message);
      }
    });
  }

  if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const name = document.getElementById('name').value;
      const email = document.getElementById('email').value;
      const password = document.getElementById('password').value;

      try {
        const data = await fetchApi('/auth/register', {
          method: 'POST',
          body: JSON.stringify({ name, email, password })
        });

        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        
        window.location.href = '/dashboard.html';
      } catch (err) {
        showAlert(err.message);
      }
    });
  }
});
