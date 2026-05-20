// СПИСОК СЛОВ ДЛЯ ПОСЛЕДОВАТЕЛЬНОЙ ИГРЫ (ИДУТ ПО ПОРЯДКУ)
const WORDS_PROGRESSIVE_LIST = [
    "ВЕЙП", "ПАР", "ДЫМ", "ВДОХ", "ВОЛЯ", "ПЛАН", "ЦЕЛЬ", "ОПЫТ", "ТРУД", "СИЛА",
    "ЖИЗНЬ", "РАЗУМ", "ЖИЖА", "ТОНУС", "ОТКАЗ", "ВЫБОР", "ВРЕМЯ", "РОБОТ", "УСПЕХ", "СТАРТ"
];

// СОСТОЯНИЕ ПРИЛОЖЕНИЯ
let appState = {
    userName: localStorage.getItem('cm_name') || "",
    robotName: localStorage.getItem('cm_robot_name') || "Нео",
    robotOutfit: localStorage.getItem('cm_robot_outfit') || "classic",
    habitType: localStorage.getItem('cm_habit_type') || "vape", 
    avgPuffs: parseInt(localStorage.getItem('cm_avg_puffs')) || 0,
    yearsCategory: localStorage.getItem('cm_years_cat') || "",
    morning: localStorage.getItem('cm_morning') || "",
    method: localStorage.getItem('cm_method') || "gradual",
    dailyLimit: parseInt(localStorage.getItem('cm_limit')) || 0,
    livePuffs: parseInt(localStorage.getItem('cm_live_puffs')) || 0,
    bestRecord: parseInt(localStorage.getItem('cm_best_record')) || 0,
    statLimitOverflows: parseInt(localStorage.getItem('cm_stat_overflows')) || 0,
    statGamesWon: parseInt(localStorage.getItem('cm_stat_games_won')) || 0,
    statTotalPuffs: parseInt(localStorage.getItem('cm_stat_total_puffs')) || 0,
    lastSavedDate: localStorage.getItem('cm_last_date') || "",
    currentWordIndex: parseInt(localStorage.getItem('cm_word_idx')) || 0
};

let timerInterval = null;
let puffHoldTimer = null;
let isTimerRunning = false;
let holdDuration = 0;
let botReactionTimeout = null;

const RAGE_PHRASES = [
    "Зафиксирован срыв системы!",
    "Твои легкие просят пощады!",
    "Остановись, пока не поздно!",
    "Ты сильнее, чем эта привычка!",
    "Обнуляем таймер чистоты?",
    "Каждая затяжка — шаг назад!",
    "Собери волю в кулак!"
];

const robotContainer = document.getElementById('app-robot');
const robotHead = document.getElementById('robot-head-element');
const robotBubble = document.getElementById('robot-bubble');
const wizard = document.getElementById('setup-wizard');
const appModules = document.getElementById('app-content-modules');
const vapeCircle = document.getElementById('main-puff-circle');

// Переключение глобальной темы
document.getElementById('theme-toggle').addEventListener('click', () => {
    document.body.classList.toggle('light-theme');
    document.body.classList.toggle('dark-theme');
});

// ПРОВЕРКА ПРИ СТАРТЕ
window.addEventListener('DOMContentLoaded', () => {
    applyRobotOutfitUI(appState.robotOutfit);
    if (appState.userName) {
        wizard.classList.add('hidden');
        appModules.classList.remove('hidden');
        document.getElementById('display-user-name').innerText = `Привет, ${appState.userName}`;
        updatePlanUIRender();
        checkDailyDateStatus();
        syncBackgroundTimerOnLoad();
    } else {
        initWizardLogic();
    }
    initNavigationTabs();
    initGamesLogic();
    initRobotCustomization();
});

// МНОГОСТУПЕНЧАТЫЙ ОПРОСНИК
function initWizardLogic() {
    let currentStep = 0;
    const steps = [
        document.getElementById('step-robot-name'),
        document.getElementById('step-name'),
        document.getElementById('step-habit'),
        document.getElementById('step-puffs'),
        document.getElementById('step-years'),
        document.getElementById('step-morning'),
        document.getElementById('step-method')
    ];

    function goNext() {
        steps[currentStep].classList.remove('active');
        currentStep++;
        steps[currentStep].classList.add('active');
    }

    // Шаг 0: Имя робота
    document.getElementById('btn-step-0').addEventListener('click', () => {
        const val = document.getElementById('robot-name-input').value.trim();
        if(val) appState.robotName = val;
        localStorage.setItem('cm_robot_name', appState.robotName);
        robotBubble.innerText = `Принято. Меня зовут ${appState.robotName}. Как мне называть вас?`;
        goNext();
    });

    // Шаг 1: Имя пользователя
    document.getElementById('btn-step-1').addEventListener('click', () => {
        const val = document.getElementById('user-name-input').value.trim();
        if(!val) return;
        appState.userName = val;
        localStorage.setItem('cm_name', val);
        robotBubble.innerText = `${val}, выберите тип вашей зависимости:`;
        goNext();
    });

    // Шаг 2: Выбор зависимости (Вейп / Сигареты)
    const habitBtns = document.querySelectorAll('#step-habit .menu-opt-btn');
    habitBtns.forEach(b => b.addEventListener('click', () => {
        habitBtns.forEach(x => x.classList.remove('selected'));
        b.classList.add('selected');
        appState.habitType = b.dataset.habit;
        localStorage.setItem('cm_habit_type', b.dataset.habit);

        const label = document.getElementById('label-puffs-count');
        const input = document.getElementById('user-puffs-input');
        if(b.dataset.habit === 'cigarettes') {
            label.innerText = "Сколько сигарет в день вы выкуриваете в среднем?";
            input.placeholder = "Например: 20";
        } else {
            label.innerText = "Сколько затяжек в день вы делаете в среднем?";
            input.placeholder = "Например: 250";
        }
    }));

    document.getElementById('btn-step-2').addEventListener('click', () => {
        if(!appState.habitType) return;
        goNext();
    });

    // Шаг 3: Среднее количество
    document.getElementById('btn-step-3').addEventListener('click', () => {
        const val = parseInt(document.getElementById('user-puffs-input').value);
        if(!val || val < 1) return;
        appState.avgPuffs = val;
        localStorage.setItem('cm_avg_puffs', val);
        robotBubble.innerText = "Укажите ваш примерный стаж курения:";
        goNext();
    });

    // Шаг 4: Анализ стажа
    const yearsBtns = document.querySelectorAll('#step-years .menu-opt-btn');
    yearsBtns.forEach(b => b.addEventListener('click', () => {
        yearsBtns.forEach(x => x.classList.remove('selected'));
        b.classList.add('selected');
        appState.yearsCategory = b.dataset.years;
        localStorage.setItem('cm_years_cat', b.dataset.years);
    }));

    document.getElementById('btn-step-4').addEventListener('click', () => {
        if(!appState.yearsCategory) return;
        robotBubble.innerText = "Когда вы делаете первую дозу после пробуждения?";
        goNext();
    });

    // Шаг 5: Утреннее время
    const morningBtns = document.querySelectorAll('#step-morning .menu-opt-btn');
    morningBtns.forEach(b => b.addEventListener('click', () => {
        morningBtns.forEach(x => x.classList.remove('selected'));
        b.classList.add('selected');
        appState.morning = b.dataset.morning;
        localStorage.setItem('cm_morning', b.dataset.morning);
    }));

    document.getElementById('btn-step-5').addEventListener('click', () => {
        if(!appState.morning) return;
        goNext();
    });

    // Шаг 6: Стратегия и Индивидуальный расчет лимита
    const methodBtns = document.querySelectorAll('#step-method .menu-opt-btn');
    const dangerCard = document.getElementById('abrupt-danger-card');
    const finalizeBtn = document.getElementById('btn-finalize-setup');

    methodBtns.forEach(b => b.addEventListener('click', () => {
        methodBtns.forEach(x => x.classList.remove('selected'));
        b.classList.add('selected');
        appState.method = b.dataset.method;
        localStorage.setItem('cm_method', b.dataset.method);

        if(appState.method === 'abrupt') {
            dangerCard.classList.remove('hidden');
            finalizeBtn.classList.add('hidden');
        } else {
            dangerCard.classList.add('hidden');
            finalizeBtn.classList.remove('hidden');
        }
    }));

    document.getElementById('btn-approve-abrupt').addEventListener('click', () => {
        dangerCard.classList.add('hidden');
        finalizeBtn.classList.remove('hidden');
    });

    finalizeBtn.addEventListener('click', () => {
        // ИНДИВИДУАЛЬНЫЙ РАСЧЕТ НА ОСНОВЕ СТАЖА И ТЯГИ
        let modifier = 0.85; // Базовое снижение на 15%
        
        if (appState.yearsCategory === 'about-5y' || appState.yearsCategory === 'more-5y') {
            modifier += 0.08; // Большой стаж: снижаем мягче (+8% к лимиту)
        }
        if (appState.morning === 'immediately') {
            modifier += 0.05; // Сильная утренняя тяга: снижаем мягче (+5% к лимиту)
        }
        if (modifier > 0.95) modifier = 0.95; // Ограничение сверху

        appState.dailyLimit = appState.method === 'abrupt' ? 0 : Math.max(1, Math.floor(appState.avgPuffs * modifier));
        appState.lastSavedDate = getTodayDateString();
        
        localStorage.setItem('cm_limit', appState.dailyLimit);
        localStorage.setItem('cm_last_date', appState.lastSavedDate);

        wizard.classList.add('hidden');
        appModules.classList.remove('hidden');
        document.getElementById('display-user-name').innerText = `Привет, ${appState.userName}`;
        
        updatePlanUIRender();
        startInteractiveTutorial();
    });
}

// ИНТЕРАКТИВНЫЙ ТУТОРИАЛ
function startInteractiveTutorial() {
    const overlay = document.getElementById('tutorial-overlay');
    const undoBtn = document.getElementById('btn-undo-action');
    overlay.classList.add('active');
    vapeCircle.classList.add('highlight-tutorial');
    robotBubble.innerText = `Калибровка: Нажмите на центральную область 1 раз.`;

    let step = 1;
    vapeCircle.addEventListener('click', function tutClick() {
        if(step === 1) {
            triggerVibration(60);
            appState.livePuffs = 1;
            document.getElementById('live-puffs-counter').innerText = 1;
            vapeCircle.classList.remove('highlight-tutorial');
            undoBtn.classList.add('highlight-tutorial');
            robotBubble.innerText = `Регистрация успешна. Теперь нажмите кнопку отмены, чтобы стереть случайный клик.`;
            step = 2;
            vapeCircle.removeEventListener('click', tutClick);
            
            undoBtn.addEventListener('click', function tutUndo() {
                if(step === 2) {
                    triggerVibration(40);
                    appState.livePuffs = 0;
                    document.getElementById('live-puffs-counter').innerText = 0;
                    undoBtn.classList.remove('highlight-tutorial');
                    overlay.classList.remove('active');
                    robotBubble.innerText = `Калибровка завершена. Система полностью под вашим контролем.`;
                    undoBtn.removeEventListener('click', tutUndo);
                    initMainCoreAppLogic();
                }
            });
        }
    });
}

// ОСНОВНАЯ НАСТРОЙКА ИНТЕРФЕЙСА ХАБА
function initMainCoreAppLogic() {
    const timerBtn = document.getElementById('timer-action-trigger');
    const undoBtn = document.getElementById('btn-undo-action');

    // Обычное быстрое нажатие (Реакция на 1.5 секунды без дикой тряски)
    vapeCircle.addEventListener('click', () => {
        if(puffHoldTimer) return; // Игнорируем обычный клик, если идет зажатие
        triggerVibration(60);
        registerPuffEvent(false);
    });

    // Зажатие (Постоянная микровибрация, робота жестко трясет)
    vapeCircle.addEventListener('mousedown', startPuffHoldTrack);
    vapeCircle.addEventListener('touchstart', (e) => { e.preventDefault(); startPuffHoldTrack(); });
    
    window.addEventListener('mouseup', endPuffHoldTrack);
    window.addEventListener('touchend', endPuffHoldTrack);

    // Честное удаление ошибочной затяжки
    undoBtn.addEventListener('click', () => {
        if(appState.livePuffs > 0) {
            triggerVibration(40);
            appState.livePuffs--;
            appState.statTotalPuffs--;
            localStorage.setItem('cm_live_puffs', appState.livePuffs);
            localStorage.setItem('cm_stat_total_puffs', appState.statTotalPuffs);
            updatePlanUIRender();
            robotBubble.innerText = "Затяжка аннулирована. Логи очищены.";
        }
    });

    timerBtn.addEventListener('click', () => {
        if(!isTimerRunning) {
            startSystemTimer();
        } else {
            stopSystemTimer(true);
        }
    });
}

// Механика зажатия кнопки затяжки
function startPuffHoldTrack() {
    holdDuration = 0;
    robotContainer.classList.add('rage-mode'); // Тряска включается
    robotBubble.innerText = "*Регистрация длительного вдоха... Прекратите!*";
    
    puffHoldTimer = setInterval(() => {
        holdDuration++;
        triggerVibration(40); // Легкая непрерывная вибрация экрана/девайса
    }, 200);
}

function endPuffHoldTrack() {
    if(puffHoldTimer) {
        clearInterval(puffHoldTimer);
        puffHoldTimer = null;
        robotContainer.classList.remove('rage-mode');
        if(holdDuration > 2) { // Зажатие длилось дольше ~400мс
            registerPuffEvent(true);
        }
    }
}

// Регистрация факта курения
function registerPuffEvent(isHolded) {
    appState.livePuffs++;
    appState.statTotalPuffs++;
    localStorage.setItem('cm_live_puffs', appState.livePuffs);
    localStorage.setItem('cm_stat_total_puffs', appState.statTotalPuffs);

    if(isTimerRunning) {
        stopSystemTimer(false);
    }

    // Если быстро кликнул — включаем гнев на 1.5 секунды
    if(!isHolded) {
        if(botReactionTimeout) clearTimeout(botReactionTimeout);
        robotContainer.classList.add('rage-mode');
        robotBubble.innerText = RAGE_PHRASES[Math.floor(Math.random() * RAGE_PHRASES.length)];
        
        botReactionTimeout = setTimeout(() => {
            robotContainer.classList.remove('rage-mode');
            robotBubble.innerText = `Ассистент ${appState.robotName} на связи. Чистота в приоритете.`;
        }, 1500);
    }

    if(appState.livePuffs > appState.dailyLimit) {
        appState.statLimitOverflows++;
        localStorage.setItem('cm_stat_overflows', appState.statLimitOverflows);
    }
    updatePlanUIRender();
}

// ТАЙМЕРЫ И ФОНОВЫЙ РЕЖИМ
function startSystemTimer() {
    isTimerRunning = true;
    const startTimeStamp = Date.now();
    localStorage.setItem('cm_timer_start', startTimeStamp);

    const timerBtn = document.getElementById('timer-action-trigger');
    timerBtn.innerText = "Прервать сессию";
    timerBtn.classList.add('running');
    robotBubble.innerText = "Таймер запущен. Концентрируйтесь на делах.";

    timerInterval = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTimeStamp) / 1000);
        document.getElementById('timer-time-output').innerText = formatSecondsToString(elapsed);
    }, 1000);
}

function stopSystemTimer(isManualReset) {
    isTimerRunning = false;
    clearInterval(timerInterval);
    
    const startTS = parseInt(localStorage.getItem('cm_timer_start'));
    localStorage.removeItem('cm_timer_start');

    const timerBtn = document.getElementById('timer-action-trigger');
    timerBtn.innerText = "Начать сессию";
    timerBtn.classList.remove('running');
    document.getElementById('timer-time-output').innerText = "00ч : 00м : 00с";

    if(startTS) {
        const totalSessionSeconds = Math.floor((Date.now() - startTS) / 1000);
        if(totalSessionSeconds > appState.bestRecord) {
            appState.bestRecord = totalSessionSeconds;
            localStorage.setItem('cm_best_record', totalSessionSeconds);
        }
    }
    if(isManualReset) robotBubble.innerText = "Сессия сброшена. Чистота прервана.";
    updatePlanUIRender();
}

function syncBackgroundTimerOnLoad() {
    const startTS = localStorage.getItem('cm_timer_start');
    if(startTS) {
        isTimerRunning = true;
        const timerBtn = document.getElementById('timer-action-trigger');
        timerBtn.innerText = "Прервать сессию";
        timerBtn.classList.add('running');
        
        timerInterval = setInterval(() => {
            const elapsed = Math.floor((Date.now() - parseInt(startTS)) / 1000);
            document.getElementById('timer-time-output').innerText = formatSecondsToString(elapsed);
        }, 1000);
    }
    initMainCoreAppLogic();
}

// ЧЕСТНЫЙ ДИНАМИЧЕСКИЙ РЕНДЕР ГРАФИКА И ДАННЫХ
function updatePlanUIRender() {
    document.getElementById('live-puffs-counter').innerText = appState.livePuffs;
    document.getElementById('display-best-record').innerText = formatSecondsToString(appState.bestRecord);
    
    document.getElementById('stat-total-puffs').innerText = appState.statTotalPuffs;
    document.getElementById('stat-limit-overflows').innerText = appState.statLimitOverflows;
    document.getElementById('stat-games-won').innerText = appState.statGamesWon;

    // Смена текстовок под тип зависимости
    const labelLive = document.getElementById('label-live-counter');
    const labelStatTotal = document.getElementById('label-stat-total');
    if(appState.habitType === 'cigarettes') {
        labelLive.innerText = "сигарет сегодня";
        labelStatTotal.innerText = "Всего сигарет";
    } else {
        labelLive.innerText = "затяжек сегодня";
        labelStatTotal.innerText = "Всего затяжек";
    }

    // ЧЕСТНАЯ ОТРИСОВКА ГРАФИКА БЕЗ ПУСТЫХ ПОНЕДЕЛЬНИКОВ
    const chartContainer = document.getElementById('analytics-bar-chart');
    chartContainer.innerHTML = ""; // Полная очистка структуры

    // Логика дней: если мы только зашли, рисуем только один честный столбец - Сегодня
    let isOverflow = appState.livePuffs > appState.dailyLimit;
    let percentHeight = appState.dailyLimit > 0 ? Math.min(100, Math.floor((appState.livePuffs / appState.dailyLimit) * 100)) : 0;
    if (percentHeight < 5) percentHeight = 5; // Минимальный визуал плашки

    const barItem = document.createElement('div');
    barItem.className = `bar-item has-data ${isOverflow ? 'overflow-data' : ''}`;
    barItem.style.height = `${percentHeight}%`;
    barItem.setAttribute('data-label', 'Сегодня');

    const hint = document.createElement('span');
    hint.className = 'bar-value-hint';
    hint.innerText = appState.livePuffs;
    barItem.appendChild(hint);
    chartContainer.appendChild(barItem);

    // Управление карточкой лимитов
    const planTxt = document.getElementById('display-plan-details');
    const unitWord = appState.habitType === 'cigarettes' ? 'сигарет' : 'затяжек';
    if(appState.method === 'abrupt') {
        planTxt.innerText = `Режим: Полный отказ (Лимит: 0 ${unitWord})`;
        if(appState.livePuffs > 0) vapeCircle.classList.add('limit-exceeded');
        else vapeCircle.classList.remove('limit-exceeded');
    } else {
        planTxt.innerText = `Режим: Снижение (Лимит: ${appState.dailyLimit} ${unitWord})`;
        if(appState.livePuffs > appState.dailyLimit) vapeCircle.classList.add('limit-exceeded');
        else vapeCircle.classList.remove('limit-exceeded');
    }
}

// ЕЖЕДНЕВНЫЙ ДНЕВНИК ПРИ СМЕНЕ ДАТЫ
function checkDailyDateStatus() {
    const todayStr = getTodayDateString();
    if(appState.lastSavedDate && appState.lastSavedDate !== todayStr) {
        const modal = document.getElementById('daily-check-modal');
        modal.classList.remove('hidden');

        const modalBtns = document.querySelectorAll('[data-day-choice]');
        modalBtns.forEach(b => b.addEventListener('click', () => {
            const choice = b.dataset.dayChoice;
            if(choice === 'continue') {
                appState.dailyLimit = Math.max(0, Math.floor(appState.dailyLimit * 0.9));
            } else if(choice === 'reset') {
                appState.dailyLimit = Math.max(1, Math.floor(appState.avgPuffs * 0.85));
            }
            appState.livePuffs = 0;
            appState.lastSavedDate = todayStr;
            
            localStorage.setItem('cm_limit', appState.dailyLimit);
            localStorage.setItem('cm_live_puffs', 0);
            localStorage.setItem('cm_last_date', todayStr);
            
            modal.classList.add('hidden');
            updatePlanUIRender();
        }));
    }
}

// ТАБ-БАР НАВИГАЦИЯ
function initNavigationTabs() {
    const tabBtns = document.querySelectorAll('.nav-tab-item');
    const panels = document.querySelectorAll('.app-view-panel');

    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            triggerVibration(30);
            tabBtns.forEach(b => b.classList.remove('active-tab'));
            panels.forEach(p => p.classList.remove('active'));

            btn.classList.add('active-tab');
            const target = btn.dataset.targetView;
            document.getElementById(target).classList.add('active');

            if(target === 'view-games') {
                setupProgressiveWordGame(); 
            }
        });
    });
}

// КАСТОМИЗАЦИЯ РОБОТА И КЛИК ПО НЕМУ
function initRobotCustomization() {
    const modal = document.getElementById('robot-custom-modal');
    const nameInput = document.getElementById('custom-robot-name-input');
    
    robotContainer.addEventListener('click', (e) => {
        // Защита: открываем окно, только если клик пришелся на тело/голову, а не на бабл
        if(e.target.closest('.robot-bubble')) return;
        triggerVibration(40);
        nameInput.value = appState.robotName;
        modal.classList.remove('hidden');
    });

    const outfitBtns = document.querySelectorAll('.outfit-btn');
    outfitBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            triggerVibration(20);
            outfitBtns.forEach(b => b.classList.remove('active-outfit'));
            btn.classList.add('active-outfit');
            appState.robotOutfit = btn.dataset.outfit;
        });
    });

    document.getElementById('btn-close-robot-modal').addEventListener('click', () => {
        triggerVibration(50);
        const newName = nameInput.value.trim();
        if(newName) appState.robotName = newName;
        
        localStorage.setItem('cm_robot_name', appState.robotName);
        localStorage.setItem('cm_robot_outfit', appState.robotOutfit);
        
        applyRobotOutfitUI(appState.robotOutfit);
        modal.classList.add('hidden');
        robotBubble.innerText = `Конфигурация изменена. С вами работает ${appState.robotName}.`;
    });
}

function applyRobotOutfitUI(styleKey) {
    robotHead.classList.remove('outfit-classic', 'outfit-neon', 'outfit-carbon');
    const targetBtn = document.querySelector(`[data-outfit="${styleKey}"]`);
    
    if(styleKey === 'neon') robotHead.classList.add('outfit-neon');
    else if(styleKey === 'carbon') robotHead.classList.add('outfit-carbon');
    else robotHead.classList.add('outfit-classic');

    if(targetBtn) {
        document.querySelectorAll('.outfit-btn').forEach(b => b.classList.remove('active-outfit'));
        targetBtn.classList.add('active-outfit');
    }
}

// МИНИ-ИГРА 1: ЧЕСТНАЯ 3D МОНЕТКА
let selectedCoinSide = "heads";
function initGamesLogic() {
    const coinSideBtns = document.querySelectorAll('[data-choice-side]');
    coinSideBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            triggerVibration(20);
            coinSideBtns.forEach(b => b.classList.remove('active-side'));
            btn.classList.add('active-side');
            selectedCoinSide = btn.dataset.choiceSide;
        });
    });

    const coinEl = document.getElementById('coin-3d-element');
    const flipBtn = document.getElementById('btn-start-coin-flip');
    const coinFeedback = document.getElementById('coin-game-feedback');

    flipBtn.addEventListener('click', () => {
        triggerVibration(50);
        coinEl.classList.add('spinning');
        coinFeedback.innerText = "Вращение...";
        flipBtn.disabled = true;

        setTimeout(() => {
            coinEl.classList.remove('spinning');
            flipBtn.disabled = false;

            const isHeads = Math.random() < 0.5;
            const landedSide = isHeads ? "heads" : "tails";
            
            // Физический разворот стороны к экрану лицевой частью
            if(landedSide === 'heads') {
                coinEl.style.transform = "rotateY(0deg)";
            } else {
                coinEl.style.transform = "rotateY(180deg)";
            }

            if(selectedCoinSide === landedSide) {
                coinFeedback.innerText = `Выпал ${isHeads ? 'Орёл' : 'Решка'}. Победа!`;
                coinFeedback.style.color = "#22c55e";
                appState.statGamesWon++;
                localStorage.setItem('cm_stat_games_won', appState.statGamesWon);
            } else {
                coinFeedback.innerText = `Выпал ${isHeads ? 'Орёл' : 'Решка'}. Проигрыш.`;
                coinFeedback.style.color = "var(--danger)";
            }
            updatePlanUIRender();
        }, 800);
    });

    // Управление Игрой слов
    document.getElementById('btn-clear-word-selection').addEventListener('click', () => {
        triggerVibration(30);
        resetWordSelectionOnly();
    });

    document.getElementById('btn-skip-word').addEventListener('click', () => {
        triggerVibration(40);
        shiftNextWordProgressive();
    });

    document.getElementById('btn-submit-word-check').addEventListener('click', verifyWordAssemblyResult);
}

// МИНИ-ИГРА 2: ПОСЛЕДОВАТЕЛЬНЫЙ ВОРД КОННЕКТ (СТРОГИЙ ПОРЯДОК КЛИКОВ)
let targetActiveWord = "";
let userBuildLettersArray = [];

function setupProgressiveWordGame() {
    const idx = appState.currentWordIndex % WORDS_PROGRESSIVE_LIST.length;
    targetActiveWord = WORDS_PROGRESSIVE_LIST[idx];
    
    userBuildLettersArray = [];
    document.getElementById('current-word-building').innerText = "---";
    document.getElementById('word-game-feedback').innerText = "";

    // Создаем массив букв (Строго только буквы этого слова)
    let lettersObj = targetActiveWord.split('').map((l, index) => {
        return { char: l, uniqueId: index };
    });

    // Перемешивание плашек Фишером-Йетсом
    for (let i = lettersObj.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [lettersObj[i], lettersObj[j]] = [lettersObj[j], lettersObj[i]];
    }

    const matrix = document.getElementById('word-matrix');
    matrix.innerHTML = "";

    lettersObj.forEach(item => {
        const cell = document.createElement('div');
        cell.className = "letter-node";
        cell.innerText = item.char;
        
        cell.addEventListener('click', () => {
            if(!cell.classList.contains('node-selected')) {
                triggerVibration(40);
                cell.classList.add('node-selected');
                userBuildLettersArray.push({ cellElement: cell, char: item.char });
                
                // Рендерим сборку на лету
                const currentStr = userBuildLettersArray.map(x => x.char).join('');
                document.getElementById('current-word-building').innerText = currentStr;
            }
        });
        matrix.appendChild(cell);
    });
}

function verifyWordAssemblyResult() {
    const assembledStr = userBuildLettersArray.map(x => x.char).join('');
    const feedback = document.getElementById('word-game-feedback');

    if(assembledStr === targetActiveWord) {
        feedback.innerText = "Слово собрано верно! Победа!";
        feedback.style.color = "#22c55e";
        triggerVibration(150);
        
        appState.statGamesWon++;
        localStorage.setItem('cm_stat_games_won', appState.statGamesWon);
        updatePlanUIRender();

        setTimeout(shiftNextWordProgressive, 1300);
    } else {
        feedback.innerText = "Неверный порядок букв! Попробуйте снова.";
        feedback.style.color = "var(--danger)";
        triggerVibration(200);
        resetWordSelectionOnly();
    }
}

function shiftNextWordProgressive() {
    appState.currentWordIndex++;
    localStorage.setItem('cm_word_idx', appState.currentWordIndex);
    setupProgressiveWordGame();
}

function resetWordSelectionOnly() {
    userBuildLettersArray = [];
    document.getElementById('current-word-building').innerText = "---";
    document.querySelectorAll('.letter-node').forEach(n => n.classList.remove('node-selected'));
}

// СИСТЕМНЫЕ ФУНКЦИИ
function triggerVibration(duration) {
    if (navigator.vibrate) navigator.vibrate(duration);
}

function getTodayDateString() {
    const d = new Date();
    return `${d.getFullYear()}-${d.getMonth()+1}-${d.getDate()}`;
}

function formatSecondsToString(totalSeconds) {
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    const pad = (num) => String(num).padStart(2, '0');
    return `${pad(hrs)}ч : ${pad(mins)}м : ${pad(secs)}с`;
}
