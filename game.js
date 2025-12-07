// ========== КОНСТАНТЫ И КОНФИГУРАЦИЯ ==========

// Координаты основных стран
const COUNTRIES = {
    'RU': { name: 'Россия', capital: 'Москва', lat: 55.7558, lon: 37.6173, color: '#ff0000' },
    'US': { name: 'США', capital: 'Вашингтон', lat: 38.9072, lon: -77.0369, color: '#0000ff' },
    'CN': { name: 'Китай', capital: 'Пекин', lat: 39.9042, lon: 116.4074, color: '#ff9900' },
    'KZ': { name: 'Казахстан', capital: 'Астана', lat: 51.1694, lon: 71.4491, color: '#00ff00' },
    'DE': { name: 'Германия', capital: 'Берлин', lat: 52.5200, lon: 13.4050, color: '#000000' },
    'JP': { name: 'Япония', capital: 'Токио', lat: 35.6762, lon: 139.6503, color: '#ff6666' },
    'IN': { name: 'Индия', capital: 'Дели', lat: 28.6139, lon: 77.2090, color: '#ff66ff' },
    'FR': { name: 'Франция', capital: 'Париж', lat: 48.8566, lon: 2.3522, color: '#0000ff' },
    'GB': { name: 'Великобритания', capital: 'Лондон', lat: 51.5074, lon: -0.1278, color: '#ff0000' },
    'BR': { name: 'Бразилия', capital: 'Бразилиа', lat: -15.8267, lon: -47.9218, color: '#009900' }
};

// Оружие и его характеристики
const WEAPONS = {
    'tank': {
        name: 'Танки',
        price: 50000,
        damage: 20,
        range: 300,
        speed: 2,
        color: '#00ff00',
        explosionRadius: 20,
        trailColor: '#00ff00'
    },
    'artillery': {
        name: 'Артиллерия',
        price: 100000,
        damage: 40,
        range: 500,
        speed: 4,
        color: '#ff9900',
        explosionRadius: 30,
        trailColor: '#ff9900'
    },
    'plane': {
        name: 'Самолеты',
        price: 200000,
        damage: 60,
        range: 800,
        speed: 6,
        color: '#ff3333',
        explosionRadius: 40,
        trailColor: '#ff3333'
    },
    'missile': {
        name: 'Ракеты',
        price: 500000,
        damage: 80,
        range: 1200,
        speed: 8,
        color: '#ff0066',
        explosionRadius: 50,
        trailColor: '#ff0066'
    },
    'nuke': {
        name: 'Ядерная бомба',
        price: 1000000,
        damage: 95,
        range: 2000,
        speed: 10,
        color: '#ff0000',
        explosionRadius: 100,
        trailColor: '#ff0000'
    },
    'tsar': {
        name: 'ЦАРЬ-БОМБА',
        price: 5000000,
        damage: 100,
        range: 3000,
        speed: 15,
        color: '#ffd700',
        explosionRadius: 200,
        trailColor: '#ffd700'
    }
};

// ========== ПЕРЕМЕННЫЕ ИГРЫ ==========

let canvas, ctx;
let player = {
    country: 'RU',
    score: 1000000,
    budget: 1000000,
    selectedWeapon: null,
    selectedTarget: null
};

let attacks = [];
let explosions = [];
let stats = {
    launches: 0,
    hits: 0,
    accuracy: 0
};

let isTsarActivated = false;
let animationId = null;

// ========== ИНИЦИАЛИЗАЦИЯ ==========

function init() {
    console.log('🚀 Инициализация Military Map...');
    
    // Получаем canvas и контекст
    canvas = document.getElementById('gameCanvas');
    ctx = canvas.getContext('2d');
    
    // Устанавливаем размеры canvas
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    
    // Настройка обработчиков событий
    setupEventListeners();
    
    // Выбираем страну по умолчанию
    selectCountry('RU');
    
    // Выбираем оружие по умолчанию
    selectWeapon('missile');
    
    // Запускаем игровой цикл
    gameLoop();
    
    console.log('✅ Игра инициализирована!');
}

// Изменение размера canvas
function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}

// Настройка обработчиков событий
function setupEventListeners() {
    // Клик по canvas для выбора цели
    canvas.addEventListener('click', handleCanvasClick);
    
    // Движение мыши по canvas
    canvas.addEventListener('mousemove', handleMouseMove);
    
    // Кнопка запуска
    document.getElementById('launchBtn').addEventListener('click', launchAttack);
    
    // Выбор страны
    document.querySelectorAll('.country-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const country = btn.getAttribute('data-country');
            selectCountry(country);
        });
    });
    
    // Выбор оружия
    document.querySelectorAll('.weapon-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const weapon = btn.getAttribute('data-weapon');
            selectWeapon(weapon);
        });
    });
    
    // Обработка клавиатуры
    document.addEventListener('keydown', handleKeyDown);
}

// ========== ВЫБОР СТРАНЫ И ОРУЖИЯ ==========

function selectCountry(countryCode) {
    player.country = countryCode;
    
    // Снимаем выделение со всех стран
    document.querySelectorAll('.country-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Выделяем выбранную страну
    document.querySelector(`[data-country="${countryCode}"]`).classList.add('active');
    
    addToLog(`Выбрана страна: ${COUNTRIES[countryCode].name}`);
}

function selectWeapon(weaponType) {
    player.selectedWeapon = weaponType;
    const weapon = WEAPONS[weaponType];
    
    // Снимаем выделение со всего оружия
    document.querySelectorAll('.weapon-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Выделяем выбранное оружие
    document.querySelector(`[data-weapon="${weaponType}"]`).classList.add('active');
    
    addToLog(`Выбрано оружие: ${weapon.name}`);
    
    // Обновляем бюджет если недостаточно средств
    updateBudgetDisplay();
}

// ========== ОБРАБОТКА ВВОДА ==========

function handleCanvasClick(event) {
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    // Преобразуем координаты в широту/долготу
    const coords = screenToLatLon(x, y);
    
    // Ищем ближайшую страну
    const nearestCountry = findNearestCountry(coords.lat, coords.lon);
    
    if (nearestCountry) {
        player.selectedTarget = {
            x: x,
            y: y,
            country: nearestCountry.code,
            name: nearestCountry.name,
            lat: coords.lat,
            lon: coords.lon
        };
        
        // Показываем информацию о цели
        showTargetInfo(nearestCountry.name, coords.lat, coords.lon);
        
        addToLog(`Выбрана цель: ${nearestCountry.name}`);
    } else {
        player.selectedTarget = {
            x: x,
            y: y,
            country: null,
            name: 'Океан',
            lat: coords.lat,
            lon: coords.lon
        };
        
        showTargetInfo('Океан', coords.lat, coords.lon);
        addToLog(`Выбрана цель: точка в океане`);
    }
}

function handleMouseMove(event) {
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    // Показываем координаты при наведении
    const coords = screenToLatLon(x, y);
    updateCoordsDisplay(coords.lat, coords.lon);
}

function handleKeyDown(event) {
    switch(event.key) {
        case ' ':
        case 'Spacebar':
            launchAttack();
            break;
        case '1':
            selectWeapon('tank');
            break;
        case '2':
            selectWeapon('artillery');
            break;
        case '3':
            selectWeapon('plane');
            break;
        case '4':
            selectWeapon('missile');
            break;
        case '5':
            selectWeapon('nuke');
            break;
        case '6':
            selectWeapon('tsar');
            break;
    }
}

// ========== ЗАПУСК АТАКИ ==========

function launchAttack() {
    if (!player.selectedWeapon || !player.selectedTarget) {
        addToLog('⚠️ Сначала выбери оружие и цель!');
        return;
    }
    
    const weapon = WEAPONS[player.selectedWeapon];
    
    // Проверка бюджета
    if (player.budget < weapon.price) {
        addToLog('❌ Недостаточно средств!');
        return;
    }
    
    // Получаем координаты своей страны
    const playerCountry = COUNTRIES[player.country];
    const startPos = latLonToScreen(playerCountry.lat, playerCountry.lon);
    
    // Создаем атаку
    const attack = {
        id: Date.now(),
        weapon: player.selectedWeapon,
        startX: startPos.x,
        startY: startPos.y,
        targetX: player.selectedTarget.x,
        targetY: player.selectedTarget.y,
        progress: 0,
        speed: weapon.speed / 100,
        color: weapon.color,
        trailColor: weapon.trailColor,
        explosionRadius: weapon.explosionRadius,
        damage: weapon.damage,
        targetCountry: player.selectedTarget.country,
        targetName: player.selectedTarget.name,
        completed: false
    };
    
    attacks.push(attack);
    
    // Списание средств
    player.budget -= weapon.price;
    player.score += weapon.damage * 100;
    
    // Обновление статистики
    stats.launches++;
    updateStats();
    
    // Обновление бюджета
    updateBudgetDisplay();
    
    // Добавление в лог
    addToLog(`🚀 Запущена ${weapon.name} → ${player.selectedTarget.name}`);
    
    // Особый случай для Царь-бомбы
    if (player.selectedWeapon === 'tsar') {
        activateTsarBomba();
    }
}

// ========== ГЕОКООРДИНАТЫ ==========

// Преобразование экранных координат в широту/долготу
function screenToLatLon(x, y) {
    const lon = (x / canvas.width) * 360 - 180;
    const lat = 90 - (y / canvas.height) * 180;
    return { lat, lon };
}

// Преобразование широты/долготы в экранные координаты
function latLonToScreen(lat, lon) {
    const x = (lon + 180) * (canvas.width / 360);
    const y = (90 - lat) * (canvas.height / 180);
    return { x, y };
}

// Поиск ближайшей страны к координатам
function findNearestCountry(lat, lon) {
    let nearest = null;
    let minDistance = Infinity;
    
    for (const [code, country] of Object.entries(COUNTRIES)) {
        const distance = Math.sqrt(
            Math.pow(country.lat - lat, 2) + 
            Math.pow(country.lon - lon, 2)
        );
        
        if (distance < minDistance) {
            minDistance = distance;
            nearest = { code, ...country };
        }
    }
    
    // Если слишком далеко от любой страны
    if (minDistance > 10) {
        return null;
    }
    
    return nearest;
}

// ========== ОТОБРАЖЕНИЕ ИНФОРМАЦИИ ==========

function showTargetInfo(name, lat, lon) {
    const targetInfo = document.getElementById('targetInfo');
    document.getElementById('currentTarget').textContent = name;
    document.getElementById('currentCoords').textContent = 
        `${lat.toFixed(2)}°, ${lon.toFixed(2)}°`;
    
    targetInfo.style.display = 'block';
    targetInfo.style.left = (event.clientX + 20) + 'px';
    targetInfo.style.top = (event.clientY - targetInfo.offsetHeight / 2) + 'px';
    
    // Прячем через 3 секунды
    setTimeout(() => {
        targetInfo.style.display = 'none';
    }, 3000);
}

function updateCoordsDisplay(lat, lon) {
    const coordsElement = document.getElementById('targetCoords');
    if (coordsElement) {
        coordsElement.textContent = `${lat.toFixed(2)}°, ${lon.toFixed(2)}°`;
    }
}

function updateBudgetDisplay() {
    const weapon = player.selectedWeapon ? WEAPONS[player.selectedWeapon] : null;
    const launchBtn = document.getElementById('launchBtn');
    
    if (weapon && player.budget >= weapon.price) {
        launchBtn.disabled = false;
        launchBtn.innerHTML = `🚀 ЗАПУСТИТЬ ${weapon.name.toUpperCase()} ($${weapon.price.toLocaleString()})`;
    } else if (weapon) {
        launchBtn.disabled = true;
        launchBtn.innerHTML = `❌ НЕДОСТАТОЧНО СРЕДСТВ ($${weapon.price.toLocaleString()})`;
    }
    
    // Обновление счета
    document.getElementById('score').textContent = player.score.toLocaleString();
}

function updateStats() {
    document.getElementById('launches').textContent = stats.launches;
    document.getElementById('hits').textContent = stats.hits;
    
    if (stats.launches > 0) {
        stats.accuracy = Math.round((stats.hits / stats.launches) * 100);
        document.getElementById('accuracy').textContent = `${stats.accuracy}%`;
    }
}

function addToLog(message) {
    const log = document.getElementById('eventLog');
    const entry = document.createElement('div');
    entry.className = 'log-entry';
    
    const time = new Date();
    const timeStr = `${time.getHours().toString().padStart(2, '0')}:` +
                   `${time.getMinutes().toString().padStart(2, '0')}:` +
                   `${time.getSeconds().toString().padStart(2, '0')}`;
    
    entry.innerHTML = `<span class="log-time">[${timeStr}]</span> ${message}`;
    
    log.prepend(entry);
    
    // Ограничиваем количество записей
    if (log.children.length > 20) {
        log.removeChild(log.lastChild);
    }
    
    // Автопрокрутка
    log.scrollTop = 0;
}

// ========== ЦАРЬ-БОМБА ==========

function activateTsarBomba() {
    isTsarActivated = true;
    
    // Показываем предупреждение
    const alert = document.getElementById('nukeAlert');
    alert.style.display = 'flex';
    
    // Запускаем обратный отсчет
    let countdown = 10;
    const countdownElement = document.getElementById('nukeCountdown');
    
    const countdownInterval = setInterval(() => {
        countdown--;
        countdownElement.textContent = countdown;
        
        if (countdown <= 0) {
            clearInterval(countdownInterval);
            triggerTsarBomba();
            
            // Скрываем предупреждение через 5 секунд
            setTimeout(() => {
                alert.style.display = 'none';
                isTsarActivated = false;
            }, 5000);
        }
    }, 1000);
}

function triggerTsarBomba() {
    // Создаем огромный взрыв
    const explosion = {
        x: player.selectedTarget.x,
        y: player.selectedTarget.y,
        radius: 0,
        maxRadius: 200,
        color: '#ffd700',
        opacity: 1,
        duration: 5,
        startTime: Date.now(),
        shockwave: true
    };
    
    explosions.push(explosion);
    
    // Добавляем урон всем странам
    for (const [code, country] of Object.entries(COUNTRIES)) {
        const pos = latLonToScreen(country.lat, country.lon);
        const distance = Math.sqrt(
            Math.pow(pos.x - explosion.x, 2) + 
            Math.pow(pos.y - explosion.y, 2)
        );
        
        if (distance < 500) { // Большой радиус поражения
            addToLog(`💥 ${country.name} пострадала от ядерного взрыва!`);
        }
    }
    
    // Большой бонус очков
    player.score += 1000000;
    updateBudgetDisplay();
    
    addToLog('☢️ ЦАРЬ-БОМБА УНИЧТОЖИЛА ВСЁ В РАДИУСЕ 500КМ!');
}

// ========== ИГРОВОЙ ЦИКЛ ==========

function gameLoop() {
    // Очищаем canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Рисуем фон
    drawBackground();
    
    // Рисуем карту
    drawMap();
    
    // Обновляем и рисуем атаки
    updateAttacks();
    drawAttacks();
    
    // Рисуем взрывы
    updateExplosions();
    drawExplosions();
    
    // Рисуем страны
    drawCountries();
    
    // Следующий кадр
    animationId = requestAnimationFrame(gameLoop);
}

// ========== ОТРИСОВКА ==========

function drawBackground() {
    // Градиентный фон
    const gradient = ctx.createRadialGradient(
        canvas.width / 2,
        canvas.height / 2,
        0,
        canvas.width / 2,
        canvas.height / 2,
        Math.max(canvas.width, canvas.height) / 2
    );
    
    gradient.addColorStop(0, '#000814');
    gradient.addColorStop(1, '#001d3d');
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Сетка
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 0.5;
    
    // Вертикальные линии
    for (let x = 0; x < canvas.width; x += 50) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
    }
    
    // Горизонтальные линии
    for (let y = 0; y < canvas.height; y += 50) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
    }
    
    // Экватор
    ctx.strokeStyle = 'rgba(0, 168, 255, 0.3)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, canvas.height / 2);
    ctx.lineTo(canvas.width, canvas.height / 2);
    ctx.stroke();
    
    // Нулевой меридиан
    ctx.beginPath();
    ctx.moveTo(canvas.width / 2, 0);
    ctx.lineTo(canvas.width / 2, canvas.height);
    ctx.stroke();
}

function drawMap() {
    // Здесь можно добавить контуры стран
    // Пока просто оставляем пустым
}

function drawCountries() {
    for (const [code, country] of Object.entries(COUNTRIES)) {
        const pos = latLonToScreen(country.lat, country.lon);
        
        // Точка страны
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, 8, 0, Math.PI * 2);
        ctx.fillStyle = country.color;
        ctx.fill();
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // Подпись (иногда, чтобы не загромождать)
        if (Math.random() > 0.5) {
            ctx.fillStyle = '#fff';
            ctx.font = '10px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(country.capital, pos.x, pos.y - 12);
        }
    }
}

// ========== АТАКИ И РАКЕТЫ ==========

     function updateAttacks() {
      for (let i = attacks.length - 1; i >= 0; i--) {
        const attack = attacks[i];
        
        // Увеличиваем прогресс
        attack.progress += attack.speed;
        
        // Если ракета достигла цели
        if (attack.progress >= 1) {
            attack.completed = true;
            
            // Создаем взрыв
            const explosion = {
                x: attack.targetX,
                y: attack.targetY,
                radius: 0,
                maxRadius: attack.explosionRadius,
                color: attack.color,
                opacity: 1,
                duration: attack.weapon === 'tsar' ? 5 : 2,
                startTime: Date.now(),
                shockwave: attack.weapon === 'tsar'
            };
            
            explosions.push(explosion);
            
            // Обновляем статистику
            stats.hits++;
            updateStats();
            
            // Удаляем завершенную атаку
            attacks.splice(i, 1);
            
            // Добавляем в лог
            addToLog(`💥 ${WEAPONS[attack.weapon].name} попала в ${attack.targetName}!`);
        }
    }
}

function drawAttacks() {
    for (const attack of attacks) {
        // Вычисляем текущую позицию ракеты
        const currentX = attack.startX + (attack.targetX - attack.startX) * attack.progress;
        const currentY = attack.startY + (attack.targetY - attack.startY) * attack.progress;
        
        // Рисуем линию траектории (след ракеты)
        ctx.beginPath();
        ctx.moveTo(attack.startX, attack.startY);
        ctx.lineTo(currentX, currentY);
        ctx.strokeStyle = attack.trailColor + '80'; // 50% прозрачность
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // Рисуем саму ракету
        ctx.beginPath();
        ctx.arc(currentX, currentY, 4, 0, Math.PI * 2);
        ctx.fillStyle = attack.color;
        ctx.fill();
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 1;
        ctx.stroke();
        
        // Эффект огня сзади ракеты
        if (attack.progress > 0.1) {
            const tailLength = 20;
            const tailX = currentX - (attack.targetX - attack.startX) * 0.05;
            const tailY = currentY - (attack.targetY - attack.startY) * 0.05;
            
            const gradient = ctx.createRadialGradient(
                tailX, tailY, 0,
                tailX, tailY, 10
            );
            gradient.addColorStop(0, attack.color + 'ff');
            gradient.addColorStop(1, attack.color + '00');
            
            ctx.beginPath();
            ctx.arc(tailX, tailY, 10, 0, Math.PI * 2);
            ctx.fillStyle = gradient;
            ctx.fill();
        }
    }
}
        
