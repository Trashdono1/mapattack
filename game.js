// ========== ПЕРЕМЕННЫЕ ==========

let canvas, ctx;
let selectedCountry = 'RU';
let selectedWeapon = 'tank';
let selectedTarget = null;

let attacks = [];
let explosions = [];
let trails = [];
let craters = [];
let radars = [];
let pvoSystems = [];
let isGameRunning = false;
let isMobileMenuOpen = false;
let isQuantityPanelOpen = false;
let quantityInput = 1;

// Данные
const COUNTRIES = {
    'RU': { name: 'Россия', flag: '🇷🇺', lat: 55.7558, lon: 37.6173, color: '#ff0000', 
            capital: 'Москва', population: 146, strength: 95 },
    'US': { name: 'США', flag: '🇺🇸', lat: 38.9072, lon: -77.0369, color: '#0000ff',
            capital: 'Вашингтон', population: 331, strength: 100 },
    'CN': { name: 'Китай', flag: '🇨🇳', lat: 39.9042, lon: 116.4074, color: '#ff9900',
            capital: 'Пекин', population: 1400, strength: 90 },
    'KZ': { name: 'Казахстан', flag: '🇰🇿', lat: 51.1694, lon: 71.4491, color: '#00ff00',
            capital: 'Нур-Султан', population: 19, strength: 60 },
    'DE': { name: 'Германия', flag: '🇩🇪', lat: 52.5200, lon: 13.4050, color: '#000000',
            capital: 'Берлин', population: 83, strength: 80 },
    'JP': { name: 'Япония', flag: '🇯🇵', lat: 35.6762, lon: 139.6503, color: '#ff6666',
            capital: 'Токио', population: 126, strength: 85 },
    'IN': { name: 'Индия', flag: '🇮🇳', lat: 28.6139, lon: 77.2090, color: '#ff9933',
            capital: 'Нью-Дели', population: 1380, strength: 75 },
    'BR': { name: 'Бразилия', flag: '🇧🇷', lat: -15.7939, lon: -47.8828, color: '#009c3b',
            capital: 'Бразилиа', population: 213, strength: 70 }
};

const WEAPONS = {
    'tank': { 
        name: 'ТАНКИ', 
        damage: 20, 
        speed: 0.003, // МЕДЛЕННО
        color: '#00ff00', 
        radius: 30,
        cost: 10000,
        trailColor: 'rgba(0, 255, 0, 0.1)',
        trailWidth: 2,
        explosionType: 'small'
    },
    'artillery': { 
        name: 'АРТИЛЛЕРИЯ', 
        damage: 40, 
        speed: 0.004, 
        color: '#ff9900', 
        radius: 40,
        cost: 50000,
        trailColor: 'rgba(255, 153, 0, 0.1)',
        trailWidth: 3,
        explosionType: 'medium'
    },
    'plane': { 
        name: 'САМОЛЕТЫ', 
        damage: 60, 
        speed: 0.006, 
        color: '#ff3333', 
        radius: 50,
        cost: 100000,
        trailColor: 'rgba(255, 51, 51, 0.1)',
        trailWidth: 4,
        explosionType: 'large'
    },
    'missile': { 
        name: 'РАКЕТЫ', 
        damage: 80, 
        speed: 0.008, 
        color: '#ff0066', 
        radius: 60,
        cost: 250000,
        trailColor: 'rgba(255, 0, 102, 0.1)',
        trailWidth: 5,
        explosionType: 'huge'
    },
    'nuke': { 
        name: 'ЯДЕРНАЯ', 
        damage: 95, 
        speed: 0.01, 
        color: '#ff0000', 
        radius: 100,
        cost: 500000,
        trailColor: 'rgba(255, 0, 0, 0.15)',
        trailWidth: 6,
        explosionType: 'nuclear'
    },
    'tsar': { 
        name: 'ЦАРЬ-БОМБА', 
        damage: 100, 
        speed: 0.015, 
        color: '#ffd700', 
        radius: 200,
        cost: 1000000,
        trailColor: 'rgba(255, 215, 0, 0.2)',
        trailWidth: 8,
        explosionType: 'tsar'
    }
};

let stats = {
    launches: 0,
    hits: 0,
    destroyed: 0,
    money: 1000000,
    spent: 0,
    intercepts: 0,
    citiesDestroyed: 0
};

let enemies = [];
let radarActive = false;

// ========== ИНИЦИАЛИЗАЦИЯ ==========

function init() {
    console.log('🚀 Инициализация игры...');
    
    // Настройка выбора страны
    setupCountrySelection();
    
    // Инициализация врагов
    initEnemies();
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
    const card = document.querySelector(`[data-country="${countryCode}"]`);
    if (card) card.classList.add('selected');
    
    // Обновляем отображение
    document.getElementById('playerFlag').textContent = COUNTRIES[countryCode].flag;
    document.getElementById('playerName').textContent = COUNTRIES[countryCode].name;
    
    // Автоматически размещаем радар и ПВО
    placeDefenseSystems();
    
    console.log(`✅ Выбрана страна: ${COUNTRIES[countryCode].name}`);
}

function initEnemies() {
    enemies = [];
    for (const [code, country] of Object.entries(COUNTRIES)) {
        if (code !== selectedCountry) {
            enemies.push({
                code: code,
                ...country,
                health: 100,
                destroyed: false
            });
        }
    }
    updateEnemiesDisplay();
}

function placeDefenseSystems() {
    const country = COUNTRIES[selectedCountry];
    const pos = latLonToScreen(country.lat, country.lon);
    
    // Очищаем старые системы
    radars = [];
    pvoSystems = [];
    
    // Размещаем радар
    radars.push({
        x: pos.x,
        y: pos.y,
        radius: 100,
        range: 300,
        active: true,
        rotation: 0
    });
    
    // Размещаем 3 системы ПВО вокруг столицы
    for (let i = 0; i < 3; i++) {
        const angle = (i * 120) * Math.PI / 180;
        pvoSystems.push({
            x: pos.x + Math.cos(angle) * 70,
            y: pos.y + Math.sin(angle) * 70,
            range: 150,
            cooldown: 0,
            active: true
        });
    }
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
    addLog('⚡ Радар и ПВО системы установлены автоматически');
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
            toggleMobileMenu();
        });
    });
    
    // Кнопки управления
    document.querySelectorAll('.control-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const action = this.getAttribute('data-action');
            handleControlAction(action);
        });
    });
    
    // Панель количества
    document.getElementById('quantityInput').addEventListener('input', function(e) {
        quantityInput = parseInt(e.target.value) || 1;
        if (quantityInput > 100) quantityInput = 100;
        if (quantityInput < 1) quantityInput = 1;
    });
    
    document.querySelector('.quantity-btn.launch').addEventListener('click', launchMultipleAttacks);
}

function selectWeapon(weaponType) {
    selectedWeapon = weaponType;
    const weapon = WEAPONS[weaponType];
    
    // Обновляем отображение
    document.getElementById('selectedWeaponName').textContent = weapon.name;
    document.getElementById('selectedWeaponDamage').textContent = weapon.damage + '%';
    document.getElementById('selectedWeaponCost').textContent = '$' + weapon.cost.toLocaleString();
    document.getElementById('mobileWeaponName').textContent = weapon.name;
    
    // Обновляем мобильную версию
    const mobileCost = document.querySelectorAll('.cost-mobile');
    mobileCost.forEach(el => {
        const btnWeapon = el.closest('button').getAttribute('onclick').match(/'([^']+)'/)[1];
        if (btnWeapon === weaponType) {
            document.getElementById('mobileWeaponCost').textContent = '$' + weapon.cost.toLocaleString();
        }
    });
    
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
    toggleMobileMenu();
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

function handleControlAction(action) {
    switch(action) {
        case 'radar':
            toggleRadar();
            break;
        case 'pvo':
            addPVOSystem();
            break;
        case 'quantity':
            openQuantityPanel();
            break;
        case 'clear':
            clearDefenses();
            break;
        case 'auto':
            autoPlaceDefenses();
            break;
    }
}

function toggleRadar() {
    radarActive = !radarActive;
    radars.forEach(radar => radar.active = radarActive);
    addLog(radarActive ? '📡 Радар активирован' : '📡 Радар деактивирован');
}

function addPVOSystem() {
    if (pvoSystems.length >= 10) {
        addLog('⚠️ Максимум 10 систем ПВО');
        return;
    }
    
    const country = COUNTRIES[selectedCountry];
    const pos = latLonToScreen(country.lat, country.lon);
    
    // Размещаем в случайном месте вокруг столицы
    const angle = Math.random() * Math.PI * 2;
    const distance = 50 + Math.random() * 100;
    
    pvoSystems.push({
        x: pos.x + Math.cos(angle) * distance,
        y: pos.y + Math.sin(angle) * distance,
        range: 150,
        cooldown: 0,
        active: true
    });
    
    addLog('🛡️ Добавлена новая система ПВО');
}

function clearDefenses() {
    if (confirm('Удалить все системы защиты?')) {
        pvoSystems = [];
        radars = [];
        placeDefenseSystems(); // Восстанавливаем базовый радар
        addLog('🗑️ Все системы защиты удалены');
    }
}

function autoPlaceDefenses() {
    pvoSystems = [];
    const country = COUNTRIES[selectedCountry];
    const pos = latLonToScreen(country.lat, country.lon);
    
    // Автоматически размещаем 5 систем ПВО по кругу
    for (let i = 0; i < 5; i++) {
        const angle = (i * 72) * Math.PI / 180;
        pvoSystems.push({
            x: pos.x + Math.cos(angle) * 100,
            y: pos.y + Math.sin(angle) * 100,
            range: 180,
            cooldown: 0,
            active: true
        });
    }
    
    addLog('🤖 Авторасстановка ПВО выполнена');
}

function openQuantityPanel() {
    document.querySelector('.quantity-panel').classList.add('active');
    isQuantityPanelOpen = true;
    document.getElementById('quantityInput').value = quantityInput;
    document.getElementById('quantityInput').focus();
}

function closeQuantityPanel() {
    document.querySelector('.quantity-panel').classList.remove('active');
    isQuantityPanelOpen = false;
}

function setQuantity(value) {
    quantityInput = value;
    document.getElementById('quantityInput').value = value;
}

// ========== ВЫБОР ЦЕЛИ И АТАКА ==========

function handleCanvasClick(event) {
    if (isQuantityPanelOpen) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    selectTarget(x, y);
}

function handleTouch(event) {
    event.preventDefault();
    
    if (isQuantityPanelOpen) return;
    
    if (event.touches.length === 1) {
        const touch = event.touches[0];
        const rect = canvas.getBoundingClientRect();
        const x = touch.clientX - rect.left;
        const y = touch.clientY - rect.top;
        
        selectTarget(x, y);
        
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
        addLog(`🎯 Цель выбрана: ${nearestCountry.name}`);
    } else {
        document.getElementById('targetName').textContent = 'Точка на карте';
        addLog('🎯 Цель выбрана: точка в океане');
    }
    
    document.getElementById('targetCoords').textContent = 
        `${coords.lat.toFixed(1)}°, ${coords.lon.toFixed(1)}°`;
    
    // Показываем метку на карте
    showTargetMarker(x, y);
}

// ========== МНОЖЕСТВЕННАЯ АТАКА ==========

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
    const totalCost = weapon.cost;
    
    if (stats.money < totalCost) {
        addLog('⚠️ Недостаточно денег!');
        return;
    }
    
    createAttack(weapon, selectedTarget.x, selectedTarget.y);
    
    // Списание денег
    stats.money -= totalCost;
    stats.spent += totalCost;
    updateStats();
}

function launchMultipleAttacks() {
    if (!selectedTarget) {
        addLog('⚠️ Сначала выбери цель на карте!');
        return;
    }
    
    const weapon = WEAPONS[selectedWeapon];
    const totalCost = weapon.cost * quantityInput;
    
    if (stats.money < totalCost) {
        addLog('⚠️ Недостаточно денег!');
        return;
    }
    
    if (quantityInput > 50) {
        addLog('⚡ МАССОВЫЙ ОБСТРЕЛ!');
    }
    
    // Запускаем из разных точек страны
    const country = COUNTRIES[selectedCountry];
    const basePos = latLonToScreen(country.lat, country.lon);
    
    for (let i = 0; i < quantityInput; i++) {
        // Случайное смещение от столицы
        const offsetX = (Math.random() - 0.5) * 100;
        const offsetY = (Math.random() - 0.5) * 100;
        
        // Немного разброс по цели для реалистичности
        const targetOffsetX = (Math.random() - 0.5) * 50;
        const targetOffsetY = (Math.random() - 0.5) * 50;
        
        setTimeout(() => {
            createAttack(
                weapon, 
                selectedTarget.x + targetOffsetX, 
                selectedTarget.y + targetOffsetY,
                basePos.x + offsetX,
                basePos.y + offsetY
            );
        }, i * 100); // Небольшая задержка между запусками
    }
    
    // Списание денег
    stats.money -= totalCost;
    stats.spent += totalCost;
    stats.launches += quantityInput;
    updateStats();
    
    addLog(`🚀 Массовый запуск: ${quantityInput} ${weapon.name}`);
    
    closeQuantityPanel();
}

function createAttack(weapon, targetX, targetY, startX = null, startY = null) {
    const country = COUNTRIES[selectedCountry];
    
    // Если не указаны стартовые координаты, берем столицу
    if (!startX || !startY) {
        const startPos = latLonToScreen(country.lat, country.lon);
        startX = startPos.x;
        startY = startPos.y;
    }
    
    // Создаем атаку
    const attack = {
        id: Date.now() + Math.random(),
        startX: startX,
        startY: startY,
        targetX: targetX,
        targetY: targetY,
        progress: 0,
        speed: weapon.speed * (0.8 + Math.random() * 0.4), // Случайная скорость
        color: weapon.color,
        trailColor: weapon.trailColor,
        trailWidth: weapon.trailWidth,
        radius: weapon.radius,
        damage: weapon.damage,
        completed: false,
        intercepted: false,
        weaponType: selectedWeapon,
        trailPoints: [] // Для хранения точек траектории
    };
    
    attacks.push(attack);
    
    // Логируем
    if (selectedWeapon === 'tsar') {
        createTsarBombaEffect(targetX, targetY);
    }
}

// ========== СИСТЕМЫ ЗАЩИТЫ ==========

function updatePVOSystems() {
    // Обновляем перезарядку ПВО
    pvoSystems.forEach(pvo => {
        if (pvo.cooldown > 0) {
            pvo.cooldown -= 0.016; // 60 FPS
        }
    });
    
    // Проверяем перехват атак
    for (let i = attacks.length - 1; i >= 0; i--) {
        const attack = attacks[i];
        
        // Текущая позиция ракеты
        const currentX = attack.startX + (attack.targetX - attack.startX) * attack.progress;
        const currentY = attack.startY + (attack.targetY - attack.startY) * attack.progress;
        
        // Проверяем ПВО
        for (const pvo of pvoSystems) {
            if (!pvo.active || pvo.cooldown > 0) continue;
            
            const distance = Math.sqrt(
                Math.pow(currentX - pvo.x, 2) + Math.pow(currentY - pvo.y, 2)
            );
            
            // Если ракета в зоне поражения ПВО
            if (distance < pvo.range) {
                // Шанс перехвата зависит от типа оружия
                let interceptChance = 0.3;
                if (attack.weaponType === 'missile') interceptChance = 0.2;
                if (attack.weaponType === 'nuke') interceptChance = 0.1;
                if (attack.weaponType === 'tsar') interceptChance = 0.05;
                
                if (Math.random() < interceptChance) {
                    // Перехват!
                    attack.intercepted = true;
                    createInterceptionExplosion(currentX, currentY, attack.color);
                    attacks.splice(i, 1);
                    stats.intercepts++;
                    pvo.cooldown = 2; // Перезарядка
                    addLog(`🛡️ ПВО перехватила ${WEAPONS[attack.weaponType].name}!`);
                    break;
                }
            }
        }
    }
}

function createInterceptionExplosion(x, y, color) {
    explosions.push({
        x, y,
        radius: 0,
        maxRadius: 40,
        color: color,
        opacity: 1,
        duration: 1,
        startTime: Date.now(),
        type: 'intercept'
    });
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
        
        if (distance < minDistance && distance < 15) {
            minDistance = distance;
            nearest = { code, ...country };
        }
    }
    
    return nearest;
}

// ========== ГРАФИКА И АНИМАЦИЯ ==========

function gameLoop() {
    if (!isGameRunning) return;
    
    // Очищаем canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Рисуем карту
    drawMap();
    
    // Обновляем системы защиты
    updatePVOSystems();
    
    // Обновляем и рисуем атаки
    updateAttacks();
    drawAttacks();
    
    // Рисуем траектории
    drawTrails();
    
    // Рисуем взрывы
    updateExplosions();
    drawExplosions();
    
    // Рисуем кратеры
    drawCraters();
    
    // Рисуем страны
    drawCountries();
    
    // Рисуем системы защиты
    drawDefenseSystems();
    
    // Следующий кадр
    requestAnimationFrame(gameLoop);
}

function drawMap() {
    // Текстура океана
    ctx.fillStyle = '#001133';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Сетка координат
    ctx.strokeStyle = 'rgba(0, 100, 255, 0.1)';
    ctx.lineWidth = 0.5;
    
    // Вертикальные линии (меридианы)
    for (let lon = -180; lon <= 180; lon += 30) {
        const x = ((lon + 180) / 360) * canvas.width;
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
    }
    
    // Горизонтальные линии (параллели)
    for (let lat = -90; lat <= 90; lat += 30) {
        const y = ((90 - lat) / 180) * canvas.height;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
    }
    
    // Экватор
    ctx.strokeStyle = 'rgba(0, 200, 255, 0.3)';
    ctx.lineWidth = 2;
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

function drawCountries() {
    for (const [code, country] of Object.entries(COUNTRIES)) {
        const pos = latLonToScreen(country.lat, country.lon);
        
        // Точка страны
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, 12, 0, Math.PI * 2);
        
        // Градиент для объема
        const gradient = ctx.createRadialGradient(
            pos.x, pos.y, 0,
            pos.x, pos.y, 20
        );
        gradient.addColorStop(0, country.color + 'ff');
        gradient.addColorStop(1, country.color + '00');
        
        ctx.fillStyle = gradient;
        ctx.fill();
        
        // Основная точка
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, 8, 0, Math.PI * 2);
        ctx.fillStyle = country.color;
        ctx.fill();
        
        // Обводка
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // Подпись (только на ПК)
        if (window.innerWidth > 768) {
            ctx.fillStyle = '#fff';
            ctx.font = 'bold 14px Arial';
            ctx.textAlign = 'center';
            ctx.shadowColor = '#000';
            ctx.shadowBlur = 3;
            ctx.fillText(country.name, pos.x, pos.y - 20);
        }
    }
}

function drawDefenseSystems() {
    // Рисуем радары
    radars.forEach(radar => {
        if (!radar.active) return;
        
        // Вращающаяся линия радара
        radar.rotation += 0.02;
        
        ctx.beginPath();
        ctx.arc(radar.x, radar.y, radar.radius, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(0, 200, 255, 0.5)';
        ctx.lineWidth = 1;
        ctx.stroke();
        
        // Вращающаяся линия
        const endX = radar.x + Math.cos(radar.rotation) * radar.range;
        const endY = radar.y + Math.sin(radar.rotation) * radar.range;
        
        ctx.beginPath();
        ctx.moveTo(radar.x, radar.y);
        ctx.lineTo(endX, endY);
        ctx.strokeStyle = 'rgba(0, 255, 255, 0.7)';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // Центр радара
        ctx.beginPath();
        ctx.arc(radar.x, radar.y, 10, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(0, 200, 255, 0.8)';
        ctx.fill();
    });
    
    // Рисуем системы ПВО
    pvoSystems.forEach(pvo => {
        ctx.beginPath();
        ctx.arc(pvo.x, pvo.y, 15, 0, Math.PI * 2);
        ctx.fillStyle = pvo.active ? 'rgba(255, 100, 100, 0.8)' : 'rgba(100, 100, 100, 0.5)';
        ctx.fill();
        
        ctx.strokeStyle = pvo.active ? '#ff6464' : '#666';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // Крест ПВО
        ctx.beginPath();
        ctx.moveTo(pvo.x - 10, pvo.y);
        ctx.lineTo(pvo.x + 10, pvo.y);
        ctx.moveTo(pvo.x, pvo.y - 10);
        ctx.lineTo(pvo.x, pvo.y + 10);
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.stroke();
    });
}

function updateAttacks() {
    for (let i = attacks.length - 1; i >= 0; i--) {
        const attack = attacks[i];
        
        if (attack.intercepted) {
            attacks.splice(i, 1);
            continue;
        }
        
        // Увеличиваем прогресс
        attack.progress += attack.speed;
        
        // Добавляем точку в траекторию
        const currentX = attack.startX + (attack.targetX - attack.startX) * attack.progress;
        const currentY = attack.startY + (attack.targetY - attack.startY) * attack.progress;
        
        attack.trailPoints.push({
            x: currentX,
            y: currentY,
            time: Date.now()
        });
        
        // Удаляем старые точки (старше 5 секунд)
        attack.trailPoints = attack.trailPoints.filter(point => 
            Date.now() - point.time < 5000
        );
        
        // Если достигли цели
        if (attack.progress >= 1) {
            attack.completed = true;
            
            // Создаем взрыв
            createExplosion(attack.targetX, attack.targetY, attack);
            
            // Создаем кратер
            createCrater(attack.targetX, attack.targetY, attack.radius);
            
            // Обновляем статистику
            stats.hits++;
            if (attack.damage >= 80) stats.destroyed++;
            updateStats();
            
            // Удаляем завершенную атаку
            attacks.splice(i, 1);
            
            // Логируем
            addLog(`💥 ${WEAPONS[attack.weaponType].name} попала в цель!`);
        }
    }
}

function drawAttacks() {
    for (const attack of attacks) {
        // Текущая позиция ракеты
        const currentX = attack.startX + (attack.targetX - attack.startX) * attack.progress;
        const currentY = attack.startY + (attack.targetY - attack.startY) * attack.progress;
        
        // Ракета
        ctx.beginPath();
        ctx.arc(currentX, currentY, 6, 0, Math.PI * 2);
        ctx.fillStyle = attack.color;
        ctx.fill();
        
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 1;
        ctx.stroke();
        
        // Хвост огня
        const tailLength = 20;
        const tailX = currentX - (attack.targetX - attack.startX) * 0.03;
        const tailY = currentY - (attack.targetY - attack.startY) * 0.03;
        
        const gradient = ctx.createRadialGradient(
            tailX, tailY, 0,
            tailX, tailY, 12
        );
        gradient.addColorStop(0, attack.color + 'ff');
        gradient.addColorStop(0.5, attack.color + '88');
        gradient.addColorStop(1, attack.color + '00');
        
        ctx.beginPath();
        ctx.arc(tailX, tailY, 12, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();
    }
}

function drawTrails() {
    for (const attack of attacks) {
        if (attack.trailPoints.length < 2) continue;
        
        ctx.beginPath();
        ctx.moveTo(attack.trailPoints[0].x, attack.trailPoints[0].y);
        
        // Рисуем траекторию с учетом времени
        for (let i = 1; i < attack.trailPoints.length; i++) {
            const point = attack.trailPoints[i];
            const age = Date.now() - point.time;
            const opacity = 1 - (age / 5000); // Исчезает за 5 секунд
            
            ctx.lineTo(point.x, point.y);
            ctx.strokeStyle = attack.trailColor.replace(')', `, ${opacity})`);
            ctx.lineWidth = attack.trailWidth;
            ctx.stroke();
            
            // Начинаем новую линию для следующего сегмента
            ctx.beginPath();
            ctx.moveTo(point.x, point.y);
        }
    }
}

function createExplosion(x, y, attack) {
    const weapon = WEAPONS[attack.weaponType];
    
    explosions.push({
        x, y,
        radius: 0,
        maxRadius: attack.radius,
        color: attack.color,
        opacity: 1,
        duration: weapon.explosionType === 'nuclear' ? 3 : 2,
        startTime: Date.now(),
        type: weapon.explosionType
    });
    
    // Дополнительные эффекты для разных типов взрывов
    if (weapon.explosionType === 'nuclear') {
        // Грибовидное облако
        setTimeout(() => {
            explosions.push({
                x, y,
                radius: 0,
                maxRadius: attack.radius * 1.5,
                color: '#ffffff',
                opacity: 0.6,
                duration: 4,
                startTime: Date.now(),
                type: 'mushroom'
            });
        }, 500);
    }
    
    if (weapon.explosionType === 'tsar') {
        createTsarBombaEffect(x, y);
    }
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
    for (let i = 0; i < 3; i++) {
        setTimeout(() => {
            explosions.push({
                x, y,
                radius: 0,
                maxRadius: 400 + i * 100,
                color: '#ffffff',
                opacity: 0.4 - i * 0.1,
                duration: 2,
                startTime: Date.now(),
                isShockwave: true
            });
        }, i * 300);
    }
    
    addLog('☢️ ЦАРЬ-БОМБА АКТИВИРОВАНА! МИР СДРОГНУЛСЯ!');
}

function createCrater(x, y, radius) {
    craters.push({
        x, y,
        radius: radius * 0.7,
        depth: radius * 0.3,
        color: '#8B4513',
        createdAt: Date.now()
    });
}

function drawCraters() {
    for (const crater of craters) {
        // Основной кратер
        ctx.beginPath();
        ctx.arc(crater.x, crater.y, crater.radius, 0, Math.PI * 2);
        
        const gradient = ctx.createRadialGradient(
            crater.x, crater.y, 0,
            crater.x, crater.y, crater.radius
        );
        gradient.addColorStop(0, 'rgba(139, 69, 19, 0.9)');
        gradient.addColorStop(0.7, 'rgba(101, 67, 33, 0.7)');
        gradient.addColorStop(1, 'rgba(61, 43, 31, 0.5)');
        
        ctx.fillStyle = gradient;
        ctx.fill();
        
        // Тень внутри кратера
        ctx.beginPath();
        ctx.arc(crater.x, crater.y, crater.radius * 0.8, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.fill();
    }
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
        explosion.opacity = 1 - progress * progress; // Квадратичное затухание
    }
}

function drawExplosions() {
    for (const explosion of explosions) {
        const gradient = ctx.createRadialGradient(
            explosion.x, explosion.y, 0,
            explosion.x, explosion.y, explosion.radius
        );
        
        if (explosion.isTsar) {
            gradient.addColorStop(0, 'rgba(255, 255, 0, ' + explosion.opacity * 0.9 + ')');
            gradient.addColorStop(0.3, 'rgba(255, 100, 0, ' + explosion.opacity * 0.7 + ')');
            gradient.addColorStop(0.7, 'rgba(255, 0, 0, ' + explosion.opacity * 0.4 + ')');
            gradient.addColorStop(1, 'rgba(255, 0, 0, ' + explosion.opacity * 0.1 + ')');
        } else if (explosion.isShockwave) {
            gradient.addColorStop(0, 'rgba(255, 255, 255, ' + explosion.opacity * 0.3 + ')');
            gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
        } else if (explosion.type === 'intercept') {
            gradient.addColorStop(0, 'rgba(255, 255, 255, ' + explosion.opacity * 0.8 + ')');
            gradient.addColorStop(0.5, 'rgba(100, 200, 255, ' + explosion.opacity * 0.6 + ')');
            gradient.addColorStop(1, explosion.color.replace(')', ', ' + explosion.opacity * 0.2 + ')'));
        } else if (explosion.type === 'nuclear') {
            gradient.addColorStop(0, 'rgba(255, 255, 200, ' + explosion.opacity * 0.9 + ')');
            gradient.addColorStop(0.3, 'rgba(255, 200, 0, ' + explosion.opacity * 0.7 + ')');
            gradient.addColorStop(0.7, 'rgba(255, 100, 0, ' + explosion.opacity * 0.4 + ')');
            gradient.addColorStop(1, 'rgba(100, 0, 0, ' + explosion.opacity * 0.2 + ')');
        } else {
            gradient.addColorStop(0, 'rgba(255, 255, 255, ' + explosion.opacity * 0.8 + ')');
            gradient.addColorStop(0.5, explosion.color.replace(')', ', ' + explosion.opacity * 0.6 + ')'));
            gradient.addColorStop(1, explosion.color.replace(')', ', ' + explosion.opacity * 0.2 + ')'));
        }
        
        ctx.beginPath();
        ctx.arc(explosion.x, explosion.y, explosion.radius, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();
        
        // Для ядерного взрыва рисуем гриб
        if (explosion.type === 'nuclear') {
            const mushroomHeight = explosion.radius * 1.5;
            const mushroomWidth = explosion.radius * 0.8;
            
            ctx.beginPath();
            ctx.ellipse(
                explosion.x, 
                explosion.y - mushroomHeight * 0.7, 
                mushroomWidth, 
                mushroomHeight * 0.6, 
                0, 0, Math.PI * 2
            );
            ctx.fillStyle = 'rgba(255, 255, 255, ' + explosion.opacity * 0.5 + ')';
            ctx.fill();
        }
    }
}

function showTargetMarker(x, y) {
    // Анимированная метка цели
    let radius = 5;
    let growing = true;
    
    function animateMarker() {
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.strokeStyle = '#ff0000';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        ctx.beginPath();
        ctx.arc(x, y, 3, 0, Math.PI * 2);
        ctx.fillStyle = '#ff0000';
        ctx.fill();
        
        if (growing) {
            radius += 0.2;
            if (radius > 15) growing = false;
        } else {
            radius -= 0.2;
            if (radius < 5) growing = true;
        }
        
        requestAnimationFrame(animateMarker);
    }
    
    // Анимация на 2 секунды
    animateMarker();
    setTimeout(() => {
        // Останавливаем анимацию через очистку
    }, 2000);
} 
