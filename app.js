// Инициализация Telegram Web App
let tg = window.Telegram.WebApp;
tg.expand();
tg.ready();

console.log("INLIFE App запущен!");

// Хранилище событий
let events = [
    {
        id: 1,
        title: "Ночная молитва",
        date: "31 октября (пятница), 21:00",
        location: "Основной зал",
        participants: []
    },
    {
        id: 2,
        title: "Молодёжная встреча", 
        date: "2 ноября (воскресенье), 18:00",
        location: "Молодёжный зал",
        participants: []
    }
];

// Проверка прав админа (в реальном приложении - через бекенд)
function checkAdminRights() {
    const user = tg.initDataUnsafe.user;
    // Временная проверка - в продакшене через бекенд
    const isAdmin = user && (user.username === 'NG_VLADIMIR' || user.username === 'Joyliana');
    
    if (isAdmin) {
        document.body.classList.add('show-admin');
        console.log("👑 Админ доступ предоставлен");
    }
}

// Переключение экранов
function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
    });
    
    document.getElementById(screenId).classList.add('active');
    updateActiveTab(screenId);
    
    // Обновляем данные при переходе на экраны
    if (screenId === 'events-screen') {
        renderEvents();
    } else if (screenId === 'admin-screen') {
        renderAdminEvents();
    }
}

// Обновление активной вкладки
function updateActiveTab(screenId) {
    const tabMap = {
        'welcome-screen': 0,
        'events-screen': 1,
        'admin-screen': 3
    };
    
    document.querySelectorAll('.tab-item').forEach((tab, index) => {
        tab.classList.toggle('active', index === tabMap[screenId]);
    });
}

// Рендер событий для пользователей
function renderEvents() {
    const container = document.getElementById('events-container');
    const emptyState = document.getElementById('empty-events');
    
    if (events.length === 0) {
        emptyState.style.display = 'block';
        container.innerHTML = '';
        return;
    }
    
    emptyState.style.display = 'none';
    
    container.innerHTML = events.map(event => `
        <div class="event-card">
            <div class="event-header">
                <h3 class="event-title">${event.title}</h3>
                <span class="event-badge">${event.participants.length} участников</span>
            </div>
            <div class="event-details">
                <div class="event-detail">
                    <i class="ri-calendar-line detail-icon"></i>
                    <span>${event.date}</span>
                </div>
                <div class="event-detail">
                    <i class="ri-map-pin-line detail-icon"></i>
                    <span>${event.location}</span>
                </div>
            </div>
            <button class="ios-button secondary" onclick="joinEvent(${event.id}, this)">
                <i class="ri-user-add-line"></i> Принять участие
            </button>
        </div>
    `).join('');
}

// Рендер событий для админов
function renderAdminEvents() {
    const container = document.getElementById('admin-events-container');
    
    if (events.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: var(--ios-text-secondary);">Нет активных событий</p>';
        return;
    }
    
    container.innerHTML = events.map(event => `
        <div class="admin-event-item">
            <div class="admin-event-info">
                <div class="admin-event-name">${event.title}</div>
                <div class="admin-event-meta">${event.date} • ${event.location}</div>
                <div class="admin-event-meta">${event.participants.length} участников</div>
            </div>
            <div class="admin-event-actions">
                <button class="delete-btn" onclick="deleteEvent(${event.id})">
                    <i class="ri-delete-bin-line"></i>
                </button>
            </div>
        </div>
    `).join('');
}

// Запись на событие
function joinEvent(eventId, button) {
    const event = events.find(e => e.id === eventId);
    if (!event) return;
    
    const originalHTML = button.innerHTML;
    
    // Визуальная обратная связь
    button.innerHTML = '<i class="ri-loader-4-line"></i> Записываем...';
    button.disabled = true;
    
    setTimeout(() => {
        if (!event.participants.includes('user')) {
            event.participants.push('user');
        }
        
        button.innerHTML = '<i class="ri-check-line"></i> Ты записан!';
        button.classList.remove('secondary');
        button.classList.add('success');
        button.disabled = true;
        
        tg.showPopup({
            title: 'Успешно!',
            message: 'Ты записан на событие! Ждём тебя!',
            buttons: [{ type: 'ok' }]
        });
        
        renderEvents();
        
    }, 800);
}

// Добавление события
function addEvent(eventData) {
    const newEvent = {
        id: Date.now(), // Простой ID на основе времени
        title: eventData.title,
        date: eventData.date,
        location: eventData.location,
        participants: []
    };
    
    events.unshift(newEvent); // Добавляем в начало
    renderEvents();
    renderAdminEvents();
    
    tg.showAlert('Событие успешно добавлено!');
}

// Удаление события
function deleteEvent(eventId) {
    if (confirm('Удалить это событие?')) {
        events = events.filter(event => event.id !== eventId);
        renderEvents();
        renderAdminEvents();
        tg.showAlert('Событие удалено');
    }
}

// Уведомление о будущих функциях
function showComingSoon() {
    tg.showAlert('Эта функция появится в ближайших обновлениях!');
}

// Инициализация при загрузке
document.addEventListener('DOMContentLoaded', function() {
    checkAdminRights();
    renderEvents();
    
    // Обработка формы добавления события
    document.getElementById('add-event-form').addEventListener('submit', function(e) {
        e.preventDefault();
        
        const formData = {
            title: document.getElementById('event-title').value,
            date: document.getElementById('event-date').value,
            location: document.getElementById('event-location').value
        };
        
        addEvent(formData);
        
        // Очистка формы
        this.reset();
    });
    
    // Адаптация под тему Telegram
    if (tg.colorScheme === 'dark') {
        document.documentElement.style.setProperty('--ios-bg', '#000000');
        document.documentElement.style.setProperty('--ios-card', '#1c1c1e');
    }
});