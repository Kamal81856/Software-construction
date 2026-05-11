let quizData = null;
let currentQuestionIndex = 0;
let userAnswers = []; // Array of objects: { question: index, selected: optionIndex }
let timeLeft = 0;
let timerInterval = null;

document.addEventListener('DOMContentLoaded', async () => {
  if (!isAuthenticated()) {
    window.location.href = '/login.html';
    return;
  }

  const urlParams = new URLSearchParams(window.location.search);
  const quizId = urlParams.get('id');

  if (!quizId) {
    alert('No quiz ID provided');
    window.location.href = '/dashboard.html';
    return;
  }

  try {
    quizData = await fetchApi(`/quiz/${quizId}`);
    
    document.getElementById('loading').style.display = 'none';
    const content = document.getElementById('quizContent');
    content.style.display = 'flex'; // override inline display none

    document.getElementById('totalQNum').textContent = quizData.questions.length;
    timeLeft = quizData.timer;
    
    startTimer();
    renderQuestion();

  } catch (err) {
    alert('Error loading quiz: ' + err.message);
    window.location.href = '/dashboard.html';
  }

  // Navigation Event Listeners
  document.getElementById('prevBtn').addEventListener('click', () => {
    if (currentQuestionIndex > 0) {
      currentQuestionIndex--;
      renderQuestion();
    }
  });

  document.getElementById('nextBtn').addEventListener('click', () => {
    if (currentQuestionIndex < quizData.questions.length - 1) {
      currentQuestionIndex++;
      renderQuestion();
    }
  });

  document.getElementById('submitBtn').addEventListener('click', submitQuiz);
});

function startTimer() {
  updateTimerDisplay();
  timerInterval = setInterval(() => {
    timeLeft--;
    updateTimerDisplay();
    
    if (timeLeft <= 0) {
      clearInterval(timerInterval);
      alert('Time is up! Submitting quiz automatically.');
      submitQuiz();
    }
  }, 1000);
}

function updateTimerDisplay() {
  const mins = Math.floor(timeLeft / 60).toString().padStart(2, '0');
  const secs = (timeLeft % 60).toString().padStart(2, '0');
  document.getElementById('timerDisplay').textContent = `${mins}:${secs}`;
}

function renderQuestion() {
  const q = quizData.questions[currentQuestionIndex];
  
  document.getElementById('currentQNum').textContent = currentQuestionIndex + 1;
  
  const qText = document.getElementById('questionText');
  qText.textContent = q.questionText;
  
  // Re-trigger animation
  qText.classList.remove('slide-in');
  void qText.offsetWidth; // trigger reflow
  qText.classList.add('slide-in');

  const optionsContainer = document.getElementById('optionsContainer');
  optionsContainer.innerHTML = '';
  optionsContainer.classList.remove('slide-in');
  void optionsContainer.offsetWidth;
  optionsContainer.classList.add('slide-in');

  // Find previously selected answer
  const previousAnswer = userAnswers.find(a => a.question === currentQuestionIndex);

  q.options.forEach((opt, index) => {
    const btn = document.createElement('button');
    btn.className = `option-btn opt-${index % 4}`;
    if (previousAnswer && previousAnswer.selected === index) {
      btn.classList.add('selected');
    }
    btn.textContent = opt;
    btn.onclick = () => selectOption(index);
    optionsContainer.appendChild(btn);
  });

  // Update Nav Buttons
  document.getElementById('prevBtn').style.visibility = currentQuestionIndex === 0 ? 'hidden' : 'visible';
  
  if (currentQuestionIndex === quizData.questions.length - 1) {
    document.getElementById('nextBtn').style.display = 'none';
    document.getElementById('submitBtn').style.display = 'block';
  } else {
    document.getElementById('nextBtn').style.display = 'block';
    document.getElementById('submitBtn').style.display = 'none';
  }
}

function selectOption(optionIndex) {
  // Update UI
  const btns = document.querySelectorAll('.option-btn');
  btns.forEach(b => b.classList.remove('selected'));
  btns[optionIndex].classList.add('selected');

  // Save Answer
  const existing = userAnswers.find(a => a.question === currentQuestionIndex);
  if (existing) {
    existing.selected = optionIndex;
  } else {
    userAnswers.push({ question: currentQuestionIndex, selected: optionIndex });
  }
}

async function submitQuiz() {
  clearInterval(timerInterval);
  const timeTaken = quizData.timer - Math.max(0, timeLeft);

  try {
    document.getElementById('submitBtn').disabled = true;
    document.getElementById('submitBtn').textContent = 'Submitting...';

    const result = await fetchApi('/results/submit', {
      method: 'POST',
      body: JSON.stringify({
        quizId: quizData._id,
        answers: userAnswers,
        timeTaken
      })
    });

    window.location.href = `/results.html?id=${result._id}`;
  } catch (err) {
    alert('Error submitting quiz: ' + err.message);
    document.getElementById('submitBtn').disabled = false;
    document.getElementById('submitBtn').textContent = 'Submit Quiz';
  }
}
