// ===== ГЛОБАЛЬНЫЕ ПЕРЕМЕННЫЕ =====
let appState = {
  userName: '',
  theme: 'dark',
  habit: 'vape',
  puffCount: 0,
  todayPuffs: 0,
  startDate: new Date(),
  plan: 'gradual',
  quizAnswers: {},
  puffPrice: 5,
  puffTime: 3,
  notifications: true,
  lastUpdated: new Date()
};

let currentQuizQuestion = 0;
const quizQuestions = [
  {
    question: 'Как долго ты куришь?',
    options: ['Менее года', '1-3 года', '3-5 лет', 'Более 5 лет'],
    key: 'duration'
  },
  {
    question: 'Сколько затяжек в день в среднем?',
    options: ['10-20', '20-50', '50-100', '100+'],
    key: 'perDay'
  },
  {
    question: 'Почему ты хочешь бросить?',
    options: ['Здоровье', 'Деньги', 'Отношения', 'Все из выше'],
    key: 'reason'
  },
  {
    question: 'Как ты предпочитаешь бросать?',
    options: ['Резко (сразу)', 'Постепенно (снижение)', 'С помощью', 'Неуверен'],
    key: 'method'
  }
];

const advices = [
  'Когда появляется тяга, выпей стакан воды и помедитируй 5 минут.',
  'Занимайся спортом - физические нагрузки помогают избавиться от стресса.',
  'Расскажи друзьям о своём решении - поддержка очень важна.',
  'Избегай ситуаций, которые провоцируют курение.',
  'Жуй жевательную резинку или сосёшь леденец при тяге.',
  'Глубокое дыхание: вдохни на 4, задержи на 7, выдохни на 8.',
  'Запиши мотивацию и читай, когда появляется искушение.',
  'Будь добр к себе - срыв не конец, это часть пути.',
  'Играй в мини-игры когда появляется сильная тяга.',
  'Помни: каждый день без курения - это победа!'
];

let currentAdviceIndex = 0;

// ===== ИНИЦИАЛИЗАЦИЯ =====
window.addEventListener('DOMContentLoaded', () => {
  loadState();
  setupEventListeners();
  updateUI();
});

// ===== СОХРАНЕНИЕ И ЗАГРУЗКА =====
function saveState() {
  localStorage.setItem('nikoTinState', JSON.stringify(appState));
}

function loadState() {
  const saved = localStorage.getItem('nikoTinState');
  if (saved) {
    appState = { ...appState, ...JSON.parse(saved) };
  }
  applyTheme(appState.theme);
}

// ===== СОБЫТИЯ =====
function setupEventListeners() {
  document.getElementById('puffPrice').addEventListener('change', (e) => {
    appState.puffPrice = parseInt(e.target.value);
    saveState();
  });

  document.getElementById('puffTime').addEventListener('change', (e) => {
    appState.puffTime = parseInt(e.target.value);
    saveState();
  });

  document.getElementById('notifications').addEventListener('change', (e) => {
    appState.notifications = e.checked;
    saveState();
  });
}

// ===== СМЕНА ЭКРАНОВ =====
function showScreen(screenId) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(screenId).classList.add('active');
}

// ===== ТЕМА =====
function setTheme(theme) {
  appState.theme = theme;
  applyTheme(theme);
  saveState();
  showScreen('welcomeScreen');
}

function applyTheme(theme) {
  if (theme === 'light') {
    document.body.classList.add('light-mode');
    document.getElementById('themeSelect').value = 'light';
  } else {
    document.body.classList.remove('light-mode');
    document.getElementById('themeSelect').value = 'dark';
  }
}

function changeTheme(theme) {
  appState.theme = theme;
  applyTheme(theme);
  saveState();
}

// ===== ПРИВЕТСТВИЕ =====
function startJourney() {
  const nameInput = document.getElementById('nameInput');
  if (nameInput.value.trim() === '') {
    alert('Пожалуйста, введи своё имя!');
    return;
  }

  appState.userName = nameInput.value.trim();
  saveState();
  showScreen('habitScreen');
}

// ===== ВЫБОР ПРИВЫЧКИ =====
function selectHabit(habit) {
  appState.habit = habit;
  saveState();
  currentQuizQuestion = 0;
  showQuizQuestion();
  showScreen('quizScreen');
}

// ===== ОПРОСНИК =====
function showQuizQuestion() {
  const question = quizQuestions[currentQuizQuestion];
  const quizContent = document.getElementById('quizContent');

  let html = `<h3>${question.question}</h3>
    <div class="quiz-options">`;

  question.options.forEach((option, index) => {
    html += `<button class="quiz-option" onclick="selectQuizOption('${question.key}', ${index}, '${option}')">
      ${option}
    </button>`;
  });

  html += '</div>';
  quizContent.innerHTML = html;

  // Обновить прогресс
  const progress = ((currentQuizQuestion + 1) / quizQuestions.length) * 100;
  document.getElementById('progressFill').style.width = progress + '%';
  document.getElementById('progressText').textContent = `${currentQuizQuestion + 1}/${quizQuestions.length}`;

  // Кнопки навигации
  document.getElementById('prevBtn').style.display = currentQuizQuestion > 0 ? 'block' : 'none';
  document.getElementById('nextBtn').textContent = currentQuizQuestion === quizQuestions.length - 1 ? 'Завершить' : 'Далее';
}

function selectQuizOption(key, index, label) {
  appState.quizAnswers[key] = { index, label };
  saveState();

  // Если это последний вопрос (про метод), показать предупреждение если выбран резкий
  if (key === 'method' && index === 0) {
    showWarning();
  } else {
    nextQuestion();
  }
}

function nextQuestion() {
  if (currentQuizQuestion < quizQuestions.length - 1) {
    currentQuizQuestion++;
    showQuizQuestion();
  } else {
    completeQuiz();
  }
}

function previousQuestion() {
  if (currentQuizQuestion > 0) {
    currentQuizQuestion--;
    showQuizQuestion();
  }
}

function showWarning() {
  document.getElementById('warningModal').classList.remove('hidden');
}

function closeWarning() {
  document.getElementById('warningModal').classList.add('hidden');
}

function confirmWarning() {
  closeWarning();
  if (currentQuizQuestion < quizQuestions.length - 1) {
    currentQuizQuestion++;
    showQuizQuestion();
  } else {
    completeQuiz();
  }
}

function completeQuiz() {
  appState.startDate = new Date();
  appState.puffCount = 0;
  appState.todayPuffs = 0;
  saveState();
  updateMainScreen();
  showScreen('mainScreen');
}

// ===== ГЛАВНЫЙ ЭКРАН =====
function updateMainScreen() {
  document.getElementById('userName').textContent = `${appState.userName}!`;
  document.getElementById('puffPrice').value = appState.puffPrice;
  document.getElementById('puffTime').value = appState.puffTime;
  document.getElementById('notifications').checked = appState.notifications;
  updateUI();
  startTimer();
}

function updateUI() {
  // Счётчик
  document.getElementById('puffCount').textContent = appState.puffCount;
  document.getElementById('todayPuffs').textContent = appState.todayPuffs;

  // Дни
  const days = Math.floor((Date.now() - appState.startDate) / (1000 * 60 * 60 * 24)) + 1;
  document.getElementById('dayCounter').textContent = `День ${days}`;

  // Статистика
  const savedMoney = appState.puffCount * appState.puffPrice;
  document.getElementById('savedMoney').textContent = `${savedMoney} ₽`;

  const savedTime = Math.floor((appState.puffCount * appState.puffTime) / 60);
  document.getElementById('timeSaved').textContent = `${savedTime}м`;

  document.getElementById('streak').textContent = `${days} дней`;

  // Советы
  document.getElementById('adviceText').textContent = advices[currentAdviceIndex];
}

function startTimer() {
  setInterval(() => {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    document.getElementById('timerValue').textContent = `${hours}:${minutes}`;
  }, 1000);
}

// ===== СЧЁТЧИК ЗАТЯЖЕК =====
function addPuff() {
  appState.puffCount++;
  appState.todayPuffs++;
  saveState();
  updateUI();

  // Анимация
  const circle = document.getElementById('dragCounter');
  circle.style.animation = 'none';
  setTimeout(() => {
    circle.style.animation = '';
  }, 10);

  // Звук (опционально)
  playSound();
}

function undoPuff() {
  if (appState.puffCount > 0) {
    appState.puffCount--;
    if (appState.todayPuffs > 0) {
      appState.todayPuffs--;
    }
    saveState();
    updateUI();
  }
}

function resetDay() {
  appState.todayPuffs = 0;
  saveState();
  updateUI();
}

function playSound() {
  // Простой звук (если нужно, можно добавить настоящий звук)
  const context = new (window.AudioContext || window.webkitAudioContext)();
  const oscillator = context.createOscillator();
  const gain = context.createGain();

  oscillator.connect(gain);
  gain.connect(context.destination);

  oscillator.frequency.value = 800;
  oscillator.type = 'sine';

  gain.gain.setValueAtTime(0.3, context.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.01, context.currentTime + 0.1);

  oscillator.start(context.currentTime);
  oscillator.stop(context.currentTime + 0.1);
}

// ===== ТАБЫ =====
function switchTab(tabName) {
  // Скрыть все табы
  document.querySelectorAll('.tab-content').forEach(tab => {
    tab.classList.remove('active');
  });
  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.classList.remove('active');
  });

  // Показать выбранный таб
  document.getElementById('tab' + tabName.charAt(0).toUpperCase() + tabName.slice(1)).classList.add('active');
  document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
}

// ===== СОВЕТЫ =====
function nextAdvice() {
  currentAdviceIndex = (currentAdviceIndex + 1) % advices.length;
  document.getElementById('adviceText').textContent = advices[currentAdviceIndex];
}

// ===== ИГРА МОНЕТКА =====
function startCoinGame() {
  showScreen('coinGameScreen');
  resetCoinGame();
}

function resetCoinGame() {
  document.getElementById('coin').classList.remove('flipping');
  document.getElementById('coinResult').classList.add('hidden');
  document.getElementById('headsBtn').style.display = 'block';
  document.getElementById('tailsBtn').style.display = 'block';
  document.getElementById('flipBtn').style.display = 'none';
  document.getElementById('coin').style.transform = 'rotateY(0deg)';
}

function chooseCoin(choice) {
  window.coinChoice = choice;
  document.getElementById('headsBtn').style.display = 'none';
  document.getElementById('tailsBtn').style.display = 'none';
  document.getElementById('flipBtn').style.display = 'block';
}

function flipCoin() {
  const result = Math.random() < 0.5 ? 'heads' : 'tails';
  const coin = document.getElementById('coin');

  coin.classList.add('flipping');

  setTimeout(() => {
    coin.classList.remove('flipping');
    if (result === 'heads') {
      coin.style.transform = 'rotateY(0deg)';
    } else {
      coin.style.transform = 'rotateY(180deg)';
    }

    showCoinResult(result);
  }, 600);
}

function showCoinResult(result) {
  const resultText = document.getElementById('coinResultText');
  const resultDiv = document.getElementById('coinResult');

  const isWin = result === window.coinChoice;

  if (isWin) {
    resultText.textContent = '✅ Ты выиграл! Не курить!';
    resultText.style.color = '#10b981';
  } else {
    resultText.textContent = '❌ Курить? Давай сыграем ещё!';
    resultText.style.color = '#ef4444';
  }

  resultDiv.classList.remove('hidden');
}

function closeCoinGame() {
  showScreen('mainScreen');
}

// ===== ИГРА ТАП-МАСТЕР =====
function startTapGame() {
  showScreen('tapGameScreen');
}

let tapGameActive = false;
let tapScore = 0;
let tapTimeLeft = 30;

function startTap() {
  tapScore = 0;
  tapTimeLeft = 30;
  tapGameActive = true;
  document.getElementById('startTapBtn').style.display = 'none';
  document.getElementById('restartTapBtn').style.display = 'none';
  document.getElementById('tapCircle').onclick = tapClick;

  updateTapDisplay();

  const timer = setInterval(() => {
    tapTimeLeft--;
    document.getElementById('tapTime').textContent = tapTimeLeft;

    if (tapTimeLeft <= 0) {
      clearInterval(timer);
      endTapGame();
    }
  }, 1000);
}

function tapClick() {
  if (tapGameActive) {
    tapScore++;
    document.getElementById('tapScore').textContent = tapScore;
  }
}

function updateTapDisplay() {
  document.getElementById('tapScore').textContent = tapScore;
  document.getElementById('tapTime').textContent = tapTimeLeft;
}

function endTapGame() {
  tapGameActive = false;
  document.getElementById('tapCircle').onclick = null;
  document.getElementById('restartTapBtn').style.display = 'block';
}

function closeTapGame() {
  tapGameActive = false;
  showScreen('mainScreen');
}

// ===== ИГРА ПАМЯТЬ =====
function startMemoryGame() {
  showScreen('memoryGameScreen');
  initMemoryGame();
}

let memoryCards = [];
let flippedCards = [];
let matchedCards = [];
let memoryAttempts = 0;

function initMemoryGame() {
  const emojis = ['🎮', '🎮', '🎯', '🎯', '🎲', '🎲', '🎪', '🎪', '🎨', '🎨', '🎭', '🎭', '🎬', '🎬', '🎤', '🎤'];
  memoryCards = emojis.sort(() => Math.random() - 0.5);
  flippedCards = [];
  matchedCards = [];
  memoryAttempts = 0;

  renderMemoryGrid();
  updateMemoryStats();
}

function renderMemoryGrid() {
  const grid = document.getElementById('memoryGrid');
  grid.innerHTML = '';

  memoryCards.forEach((emoji, index) => {
    const card = document.createElement('div');
    card.className = 'memory-card';
    if (matchedCards.includes(index)) {
      card.classList.add('matched');
    }
    if (flippedCards.includes(index)) {
      card.classList.add('flipped');
      card.textContent = emoji;
    }
    card.onclick = () => flipMemoryCard(index);
    grid.appendChild(card);
  });
}

function flipMemoryCard(index) {
  if (flippedCards.includes(index) || matchedCards.includes(index) || flippedCards.length >= 2) {
    return;
  }

  flippedCards.push(index);
  renderMemoryGrid();

  if (flippedCards.length === 2) {
    memoryAttempts++;
    checkMemoryMatch();
  }
}

function checkMemoryMatch() {
  const [first, second] = flippedCards;

  if (memoryCards[first] === memoryCards[second]) {
    matchedCards.push(first, second);
    flippedCards = [];
    updateMemoryStats();

    if (matchedCards.length === memoryCards.length) {
      setTimeout(() => {
        alert(`Поздравляем! Ты прошёл игру за ${memoryAttempts} попыток!`);
        closeMemoryGame();
      }, 500);
    }
  } else {
    setTimeout(() => {
      flippedCards = [];
      renderMemoryGrid();
    }, 1000);
  }

  renderMemoryGrid();
}

function updateMemoryStats() {
  document.getElementById('memoryAttempts').textContent = memoryAttempts;
  document.getElementById('memoryMatches').textContent = matchedCards.length / 2;
}

function closeMemoryGame() {
  showScreen('mainScreen');
}

// ===== НАСТРОЙКИ =====
function resetApp() {
  if (confirm('Вы уверены? Это сбросит все данные!')) {
    localStorage.clear();
    appState = {
      userName: '',
      theme: 'dark',
      habit: 'vape',
      puffCount: 0,
      todayPuffs: 0,
      startDate: new Date(),
      plan: 'gradual',
      quizAnswers: {},
      puffPrice: 5,
      puffTime: 3,
      notifications: true,
      lastUpdated: new Date()
    };
    showScreen('themeScreen');
  }
}

function backToTheme() {
  if (confirm('Вернуться на начало?')) {
    resetApp();
  }
}
