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

// Карта мира
let worldMap;
let mapLoaded = false;

// Данные
const COUNTRIES = {
    'RU': { 
        name: 'Россия', 
        flag: '🇷🇺', 
        lat: 55.7558, 
        lon: 37.6173, 
        color: '#ff0000', 
        capital: 'Москва', 
        population: 146, 
        strength: 95 
    },
    'US': { 
        name: 'США', 
        flag: '🇺🇸', 
        lat: 38.9072, 
        lon: -77.0369, 
        color: '#0000ff',
        capital: 'Вашингтон', 
        population: 331, 
        strength: 100 
    },
    'CN': { 
        name: 'Китай', 
        flag: '🇨🇳', 
        lat: 39.9042, 
        lon: 116.4074, 
        color: '#ff9900',
        capital: 'Пекин', 
        population: 1400, 
        strength: 90 
    },
    'KZ': { 
        name: 'Казахстан', 
        flag: '🇰🇿', 
        lat: 51.1694, 
        lon: 71.4491, 
        color: '#00ff00',
        capital: 'Нур-Султан', 
        population: 19, 
        strength: 60 
    },
    'DE': { 
        name: 'Германия', 
        flag: '🇩🇪', 
        lat: 52.5200, 
        lon: 13.4050, 
        color: '#000000',
        capital: 'Берлин', 
        population: 83, 
        strength: 80 
    },
    'JP': { 
        name: 'Япония', 
        flag: '🇯🇵', 
        lat: 35.6762, 
        lon: 139.6503, 
        color: '#ff6666',
        capital: 'Токио', 
        population: 126, 
        strength: 85 
    },
    'IN': { 
        name: 'Индия', 
        flag: '🇮🇳', 
        lat: 28.6139, 
        lon: 77.2090, 
        color: '#ff9933',
        capital: 'Нью-Дели', 
        population: 1380, 
        strength: 75 
    },
    'BR': { 
        name: 'Бразилия', 
        flag: '🇧🇷', 
        lat: -15.7939, 
        lon: -47.8828, 
        color: '#009c3b',
        capital: 'Бразилиа', 
        population: 213, 
        strength: 70 
    }
};

const WEAPONS = {
    'tank': { 
        name: 'ТАНКИ', 
        damage: 20, 
        speed: 0.003,
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
let radarActive = true;

// ========== ЗАГРУЗКА КАРТЫ ==========

function loadWorldMap() {
    worldMap = new Image();
    worldMap.onload = function() {
        mapLoaded = true;
        console.log('🗺️ Карта мира загружена');
        addLog('🗺️ Карта мира загружена');
    };
    worldMap.onerror = function() {
        console.error('❌ Ошибка загрузки карты мира');
        addLog('❌ Карта мира не загружена. Используется стандартный фон.');
    };
    worldMap.src = 'world_map.jpg';
}

// ========== ИНИЦИАЛИЗАЦИЯ ==========

function init() {
    console.log('🚀 Инициализация игры...');
    
    // Загружаем карту мира
    loadWorldMap();
    
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
        active: radarActive,
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
    
    // Размещаем системы защиты
    placeDefenseSystems();
    
    // Запускаем игровой цикл
    isGameRunning = true;
    gameLoop();
    
    // Логируем
    addLog(`🎮 Игра началась! Вы играете за ${COUNTRIES[selectedCountry].name}`);
    addLog('🎯 Кликни на карту чтобы выбрать цель');
    addLog('⚡ Радар и ПВО системы установлены');
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

// ========== СИСТЕМЫ ЗАЩИТЫ ==========

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

// ========== ПАНЕЛЬ КОЛИЧЕСТВА ==========

function openQuantityPanel() {
    document.getElementById('quantityPanel').classList.add('active');
    isQuantityPanelOpen = true;
    document.getElementById('quantityInput').value = quantityInput;
    document.getElementById('quantityInput').focus();
    document.getElementById('quantityInput').select();
}

function closeQuantityPanel() {
    document.getElementById('quantityPanel').classList.remove('active');
    isQuantityPanelOpen = false;
}

function setQuantity(value) {
    quantityInput = value;
    document.getElementById('quantityInput').value = value;
}

// ========== ВЫБОР ЦЕЛИ ==========

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
        document.getElementById('targetCountry').textContent = nearestCountry.name;
        addLog(`🎯 Цель выбрана: ${nearestCountry.name}`);
    } else {
        document.getElementById('targetName').textContent = 'Точка на карте';
        document.getElementById('targetCountry').textContent = 'Океан';
        addLog('🎯 Цель выбрана: точка в океане');
    }
    
    document.getElementById('targetCoords').textContent = 
        `${coords.lat.toFixed(1)}°, ${coords.lon.toFixed(1)}°`;
    
    // Показываем метку на карте
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
        
        if (distance < minDistance && distance < 15) {
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
    const totalCost = weapon.cost;
    
    if (stats.money < totalCost) {
        addLog('⚠️ Недостаточно денег!');
        return;
    }
    
    createAttack(weapon, selectedTarget.x, selectedTarget.y);
    
    // Списание денег
    stats.money -= totalCost;
    stats.spent += totalCost;
    stats.launches++;
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
        speed: weapon.speed * (0.8 + Math.random() * 0.4),
        color: weapon.color,
        trailColor: weapon.trailColor,
        trailWidth: weapon.trailWidth,
        radius: weapon.radius,
        damage: weapon.damage,
        completed: false,
        intercepted: false,
        weaponType: selectedWeapon,
        trailPoints: []
    };
    
    attacks.push(attack);
    
    // Логируем
    if (selectedWeapon === 'tsar') {
        createTsarBombaEffect(targetX, targetY);
    }
}

// ========== ГРАФИКА И АНИМАЦИЯ ==========

