// ========== ПЕРЕМЕННЫЕ ==========

let canvas, ctx;
let selectedCountry = 'RU';
let selectedWeapon = 'tank';
let selectedTarget = null;

let attacks = [];
let explosions = [];
let isGameRunning = false;
let isMobileMenuOpen = false;

// Данные
const COUNTRIES = {
    'RU': { name: 'Россия', flag: '🇷🇺', lat: 55.7558, lon: 37.6173, color: '#ff0000' },
    'US': { name: 'США', flag: '🇺🇸', lat: 38.9072, lon: -77.0369, color: '#0000ff' },
    'CN': { name: 'Китай', flag: '🇨🇳', lat: 39.9042, lon: 116.4074, color: '#ff9900' },
    'KZ': { name: 'Казахстан', flag: '🇰🇿', lat: 51.1694, lon: 71.4491, color: '#00ff00' },
    'DE': { name: 'Германия', flag: '🇩🇪', lat: 52.5200, lon: 13.4050, color: '#000000' },
    'JP': { name: 'Япония', flag: '🇯🇵', lat: 35.6762, lon: 139.6503, color: '#ff6666' }
};

const WEAPONS = {
    'tank': { name: 'ТАНКИ', damage: 20, speed: 0.02, color: '#00ff00', radius: 30 },
    'artillery': { name: 'АРТИЛЛЕРИЯ', damage: 40, speed: 0.03, color: '#ff9900', radius: 40 },
    'plane': { name: 'САМОЛЕТЫ', damage: 60, speed: 0.04, color: '#ff3333', radius: 50 },
    'missile': { name: 'РАКЕТЫ', damage: 80, speed: 0.05, color: '#ff0066', radius: 60 },
    'nuke': { name: 'ЯДЕРНАЯ', damage: 95, speed: 0.06, color: '#ff0000', radius: 100 },
    'tsar': { name: 'ЦАРЬ-БОМБА', damage: 100, speed: 0.08, color: '#ffd700', radius: 200 }
};

let stats = {
    launches: 0,
    hits: 0,
    destroyed: 0
};

// ========== ИНИЦИАЛИЗАЦИЯ ==========

function init() {
    console.log('🚀 Инициализация игры...');
    
    // Настройка выбора страны
    setupCountrySelection();
    
    // Ждем пока пользователь выберет страну
    // Игра начнется после нажатия "Начать"
}

function setupCountrySelection() {
    const countryCards = document.querySelectorAll('.country-card');
    countryCards.forEach(card => {
        card.addEventListener('click', function() {
            const country = this.getAttribute('data-country');
            selectCountry(country);
        });
    });
}

function selectCountry(countryCode) {
    selectedCountry = countryCode;
    
    // Снимаем выделение со всех
    document.querySelectorAll('.country-card').forEach(card => {
        card.classList.remove('selected');
    });
    
    // Выделяем выбранную
    document.querySelector(`[data-country="${countryCode}"]`).classList.add('selected');
    
    // Обновляем отображение
    document.getElementById('playerFlag').textContent = COUNTRIES[countryCode].flag;
    document.getElementById('playerName').textContent = COUNTRIES[countryCode].name;
    
    console.log(`✅ Выбрана страна: ${COUNTRIES[countryCode].name}`);
}

// ========== ЗАПУСК ИГРЫ ==========

function startGame() {
    if (!selectedCountry) {
        alert('Сначала выбери страну!');
        return;
    }
    
    // Переключаем экраны
    document.getElementById('countrySelectScreen').classList.remove('active');
    document.getElementById('gameScreen').classList.add('active');
    
    // Инициализируем Canvas
    initCanvas();
    
    // Настраиваем обработчики
    setupGameControls();
    
    // Запускаем игровой цикл
    isGameRunning = true;
    gameLoop();
    
    // Логируем
    addLog(`🎮 Игра началась! Вы играете за ${COUNTRIES[selectedCountry].name}`);
    addLog('🎯 Кликни на карту чтобы выбрать цель');
}

function initCanvas() {
    canvas = document.getElementById('gameCanvas');
    ctx = canvas.getContext('2d');
    
    // Устанавливаем размеры
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    
    // Обработка кликов по карте
    canvas.addEventListener('click', handleCanvasClick);
    canvas.addEventListener('touchstart', handleTouch, { passive: false });
}

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}

// ========== УПРАВЛЕНИЕ ==========

function setupGameControls() {
    // ПК: кнопки оружия
    document.querySelectorAll('.weapon-btn-pc').forEach(btn => {
        btn.addEventListener('click', function() {
            const weapon = this.getAttribute('data-weapon');
            selectWeapon(weapon);
        });
    });
    
    // Мобильные: кнопки оружия
    document.querySelectorAll('.weapon-btn-mobile').forEach(btn => {
        btn.addEventListener('click', function() {
            const weapon = this.getAttribute('data-weapon');
            selectWeapon(weapon);
            toggleMobileMenu(); // Закрываем меню после выбора
        });
    });
    
    // Кнопка атаки уже настроена в HTML через onclick
}

function selectWeapon(weaponType) {
    selectedWeapon = weaponType;
    const weapon = WEAPONS[weaponType];
    
    // Обновляем отображение
    document.getElementById('selectedWeaponName').textContent = weapon.name;
    document.getElementById('selectedWeaponDamage').textContent = weapon.damage + '%';
    document.getElementById('mobileWeaponName').textContent = weapon.name;
    
    // Снимаем выделение со всех кнопок
    document.querySelectorAll('.weapon-btn-pc, .weapon-btn-mobile').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Выделяем выбранную
    document.querySelectorAll(`[data-weapon="${weaponType}"]`).forEach(btn => {
        btn.classList.add('active');
    });
    
    addLog(`💣 Выбрано оружие: ${weapon.name}`);
}

function selectWeaponMobile(weaponType) {
    selectWeapon(weaponType);
}

function toggleMobileMenu() {
    const menu = document.getElementById('mobileWeapons');
    isMobileMenuOpen = !isMobileMenuOpen;
    
    if (isMobileMenuOpen) {
        menu.classList.add('active');
    } else {
        menu.classList.remove('active');
    }
}

function handleCanvasClick(event) {
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    selectTarget(x, y);
}

function handleTouch(event) {
    event.preventDefault();
    
    if (event.touches.length === 1) {
        const touch = event.touches[0];
        const rect = canvas.getBoundingClientRect();
        const x = touch.clientX - rect.left;
        const y = touch.clientY - rect.top;
        
        selectTarget(x, y);
        
        // Закрываем меню оружия если оно открыто
        if (isMobileMenuOpen) {
            toggleMobileMenu();
        }
    }
}

function selectTarget(x, y) {
    selectedTarget = { x, y };
    
    // Конвертируем в координаты
    const coords = screenToLatLon(x, y);
    
    // Находим ближайшую страну
    const nearestCountry = findNearestCountry(coords.lat, coords.lon);
    
    // Обновляем UI
    if (nearestCountry) {
        document.getElementById('targetName').textContent = nearestCountry.name;
        document.getElementById('targetCountry').textContent = nearestCountry.name;
        addLog(`🎯 Цель выбрана: ${nearestCountry.name}`);
    } else {
        document.getElementById('targetName').textContent = 'Точка на карте';
        document.getElementById('targetCountry').textContent = 'Океан';
        addLog('🎯 Цель выбрана: точка в океане');
    }
    
    document.getElementById('targetCoords').textContent = 
        `${coords.lat.toFixed(1)}°, ${coords.lon.toFixed(1)}°`;
    
    // Показываем метку на карте (визуально)
    showTargetMarker(x, y);
}

// ========== ГЕОКООРДИНАТЫ ==========

function screenToLatLon(x, y) {
    const lon = (x / canvas.width) * 360 - 180;
    const lat = 90 - (y / canvas.height) * 180;
    return { lat, lon };
}

function latLonToScreen(lat, lon) {
    const x = (lon + 180) * (canvas.width / 360);
    const y = (90 - lat) * (canvas.height / 180);
    return { x, y };
}

function findNearestCountry(lat, lon) {
    let nearest = null;
    let minDistance = Infinity;
    
    for (const [code, country] of Object.entries(COUNTRIES)) {
        const distance = Math.sqrt(
            Math.pow(country.lat - lat, 2) + 
            Math.pow(country.lon - lon, 2)
        );
        
        if (distance < minDistance && distance < 10) {
            minDistance = distance;
            nearest = { code, ...country };
        }
    }
    
    return nearest;
}

// ========== АТАКА ==========

function launchAttack() {
    if (!selectedTarget) {
        addLog('⚠️ Сначала выбери цель на карте!');
        return;
    }
    
    if (!selectedWeapon) {
        addLog('⚠️ Сначала выбери оружие!');
        return;
    }
    
    const weapon = WEAPONS[selectedWeapon];
    const country = COUNTRIES[selectedCountry];
    
    // Получаем стартовую позицию (столица страны)
    const startPos = latLonToScreen(country.lat, country.lon);
    
    // Создаем атаку
    const attack = {
        id: Date.now(),
        startX: startPos.x,
        startY: startPos.y,
        targetX: selectedTarget.x,
        targetY: selectedTarget.y,
        progress: 0,
        speed: weapon.speed,
        color: weapon.color,
        radius: weapon.radius,
        damage: weapon.damage,
        completed: false
    };
    
    attacks.push(attack);
    
    // Обновляем статистику
    stats.launches++;
    updateStats();
    
    // Логируем
    const targetName = document.getElementById('targetName').textContent;
    addLog(`🚀 Запущена ${weapon.name} → ${targetName}`);
    
    // Особый эффект для Царь-бомбы
    if (selectedWeapon === 'tsar') {
        createTsarBombaEffect(selectedTarget.x, selectedTarget.y);
    }
}

// ========== ГРАФИКА И АНИМАЦИЯ ==========

function gameLoop() {
    if (!isGameRunning) return;
    
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
    requestAnimationFrame(gameLoop);
}

function drawBackground() {
    // Градиентный фон
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, '#000814');
    gradient.addColorStop(1, '#001d3d');
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Сетка
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 1;
    
    // Вертикальные линии
    const gridSize = 50;
    for (let x = 0; x < canvas.width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
    }
    
    // Горизонтальные линии
    for (let y = 0; y < canvas.height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
    }
    
    // Экватор
    ctx.strokeStyle = 'rgba(0, 168, 255, 0.3)';
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
    // Здесь можно добавить контуры континентов
    // Пока оставляем пустым для простоты
}

function drawCountries() {
    for (const [code, country] of Object.entries(COUNTRIES)) {
        const pos = latLonToScreen(country.lat, country.lon);
        
        // Точка страны
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, 10, 0, Math.PI * 2);
        ctx.fillStyle = country.color;
        ctx.fill();
        
        // Обводка
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // Подпись (только на ПК)
        if (window.innerWidth > 768) {
            ctx.fillStyle = '#fff';
            ctx.font = '12px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(country.name, pos.x, pos.y - 15);
        }
    }
}

function updateAttacks() {
    for (let i = attacks.length - 1; i >= 0; i--) {
        const attack = attacks[i];
        
        // Увеличиваем прогресс
        attack.progress += attack.speed;
        
        // Если достигли цели
        if (attack.progress >= 1) {
            attack.completed = true;
            
            // Создаем взрыв
            createExplosion(attack.targetX, attack.targetY, attack.radius, attack.color);
            
            // Обновляем статистику
            stats.hits++;
            if (attack.damage >= 80) stats.destroyed++;
            updateStats();
            
            // Удаляем завершенную атаку
            attacks.splice(i, 1);
            
            // Логируем
            addLog(`💥 ${WEAPONS[selectedWeapon].name} попала в цель!`);
        }
    }
}

function drawAttacks() {
    for (const attack of attacks) {
        // Текущая позиция ракеты
        const currentX = attack.startX + (attack.targetX - attack.startX) * attack.progress;
        const currentY = attack.startY + (attack.targetY - attack.startY) * attack.progress;
        
        // Линия траектории
        ctx.beginPath();
        ctx.moveTo(attack.startX, attack.startY);
        ctx.lineTo(currentX, currentY);
        ctx.strokeStyle = attack.color + '80';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // Ракета
        ctx.beginPath();
        ctx.arc(currentX, currentY, 4, 0, Math.PI * 2);
        ctx.fillStyle = attack.color;
        ctx.fill();
        
        // Хвост огня
        const tailLength = 15;
        const tailX = currentX - (attack.targetX - attack.startX) * 0.05;
        const tailY = currentY - (attack.targetY - attack.startY) * 0.05;
        
        const gradient = ctx.createRadialGradient(
            tailX, tailY, 0,
            tailX, tailY, 8
        );
        gradient.addColorStop(0, attack.color + 'ff');
        gradient.addColorStop(1, attack.color + '00');
        
        ctx.beginPath();
        ctx.arc(tailX, tailY, 8, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();
    }
}

function createExplosion(x, y, radius, color) {
    explosions.push({
        x, y,
        radius: 0,
        maxRadius: radius,
        color: color,
        opacity: 1,
        duration: 2,
        startTime: Date.now()
    });
}

function createTsarBombaEffect(x, y) {
    // Большой взрыв
    explosions.push({
        x, y,
        radius: 0,
        maxRadius: 300,
        color: '#ffd700',
        opacity: 1,
        duration: 5,
        startTime: Date.now(),
        isTsar: true
    });
    
    // Ударная волна
    setTimeout(() => {
        explosions.push({
            x, y,
            radius: 0,
            maxRadius: 500,
            color: '#ffffff',
            opacity: 0.5,
            duration: 3,
            startTime: Date.now(),
            isShockwave: true
        });
    }, 1000);
    
    addLog('☢️ ЦАРЬ-БОМБА АКТИВИРОВАНА!');
}

function updateExplosions() {
    const now = Date.now();
    
    for (let i = explosions.length - 1; i >= 0; i--) {
        const explosion = explosions[i];
        const elapsed = (now - explosion.startTime) / 1000;
        const progress = elapsed / explosion.duration;
        
        if (progress >= 1) {
            explosions.splice(i, 1);
            continue;
        }
        
        explosion.radius = explosion.maxRadius * progress;
        explosion.opacity = 1 - progress;
    }
}

function drawExplosions() {
    for (const explosion of explosions) {
        const gradient = ctx.createRadialGradient(
            explosion.x, explosion.y, 0,
            explosion.x, explosion.y, explosion.radius
        );
        
        if (explosion.isTsar) {
            gradient.addColorStop(0, 'rgba(255, 255, 0, ' + explosion.opacity * 0.8 + ')');
            gradient.addColorStop(0.5, 'rgba(255, 100, 0, ' + explosion.opacity * 0.6 + ')');
            gradient.addColorStop(1, 'rgba(255, 0, 0, ' + explosion.opacity * 0.2 + ')');
        } else if (explosion.isShockwave) {
            gradient.addColorStop(0, 'rgba(255, 255, 255, ' + explosion.opacity * 0.3 + ')');
            gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
        } else {
            gradient.addColorStop(0, 'rgba(255, 255, 255, ' + explosion.opacity * 0.8 + ')');
            gradient.addColorStop(1, explosion.color.replace(')', ', ' + explosion.opacity * 0.2 + ')'));
        }
        
        ctx.beginPath();
        ctx.arc(explosion.x, explosion.y, explosion.radius, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();
    }
}

function showTargetMarker(x, y) {
    // Временная метка цели (исчезает через 2 секунды)
    const marker = {
        x, y,
        radius: 5,
        opacity: 1,
        startTime: Date.now()
    };
    
    // Рисуем метку
    ctx.beginPath();
    ctx.arc(x, y, 15, 0, Math.PI * 2);
    ctx.strokeStyle = '#ff0000';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    ctx.beginPath();
    ctx.arc(x, y, 5, 0, Math.PI * 2);
    ctx.fillStyle = '#ff0000';
    ctx.fill();
}

// ========== UI И ЛОГИРОВАНИЕ ==========

function updateStats() {
    document.getElementById('statLaunches').textContent = stats.launches;
    document.getElementById('statHits').textContent = stats.hits;
    document.getElementById('statDestroyed').textContent = stats.destroyed;
    
    // Точность
    const accuracy = stats.launches > 0 ? Math.round((stats.hits / stats.launches) * 100) : 0;
    document.getElementById('statAccuracy').textContent = accuracy + '%';
}

function addLog(message) {
    const log = document.getElementById('eventLog');
    const logMobile = document.getElementById('eventLogMobile');
    
    const time = new Date();
    const timeStr = `${time.getHours().toString().padStart(2, '0')}:` +
                   `${time.getMinutes().toString().padStart(2, '0')}:` +
                   `${time.getSeconds().toString().padStart(2, '0')}`;
    
    const entry = `<div class="log-entry">[${timeStr}] ${message}</div>`;
    
    if (log) {
        log.innerHTML = entry + log.innerHTML;
        if (log.children.length > 10) {
            log.removeChild(log.lastChild);
        }
        log.scrollTop = 0;
    }
    
    if (logMobile) {
        logMobile.innerHTML = `<div>${message}</div>` + logMobile.innerHTML;
        if (logMobile.children.length > 5) {
            logMobile.removeChild(logMobile.lastChild);
        }
    }
}

function goBackToCountrySelect() {
    if (confirm('Вернуться к выбору страны? Текущий прогресс не сохранится.')) {
        // Останавливаем игру
        isGameRunning = false;
        
        // Сбрасываем состояние
        attacks = [];
        explosions = [];
        selectedTarget = null;
        stats = { launches: 0, hits: 0, destroyed: 0 };
        updateStats();
        
        // Переключаем экраны
        document.getElementById('gameScreen').classList.remove('active');
        document.getElementById('countrySelectScreen').classList.add('active');
        
        addLog('🔄 Возврат к выбору страны');
    }
}

// ========== ЗАПУСК ==========

// Инициализируем при загрузке страницы
window.onload = init;

// Предотвращаем контекстное меню на мобильных
document.addEventListener('contextmenu', function(e) {
    e.preventDefault();
});
