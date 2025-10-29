// Инициализация Telegram Web App
let tg = window.Telegram.WebApp;
tg.expand();
tg.ready();

console.log("INLIFE App запущен!");

// Хранилище данных
let events = [];
let users = [];
let currentUser = null;

// Функции для работы с localStorage
function saveEventsToStorage() {
    localStorage.setItem('inlife_events', JSON.stringify(events));
    console.log("💾 События сохранены в localStorage");
}

function loadEventsFromStorage() {
    const savedEvents = localStorage.getItem('inlife_events');
    if (savedEvents) {
        events = JSON.parse(savedEvents);
        console.log("📂 События загружены из localStorage:", events.length);
    }
}

function saveUsersToStorage() {
    localStorage.setItem('inlife_users', JSON.stringify(users));
    console.log("💾 Пользователи сохранены в localStorage");
}

function loadUsersFromStorage() {
    const savedUsers = localStorage.getItem('inlife_users');
    if (savedUsers) {
        users = JSON.parse(savedUsers);
        console.log("📂 Пользователи загружены из localStorage:", users.length);
    }
}

// Инициализация текущего пользователя
function initCurrentUser() {
    const user = tg.initDataUnsafe.user;
    if (user) {
        currentUser = {
            id: user.id,
            username: user.username || 'без username',
            firstName: user.first_name || '',
            lastName: user.last_name || '',
            fullName: '',
            birthday: '',
            joinedAt: new Date().toISOString()
        };

        // Проверяем есть ли пользователь уже в базе
        const existingUser = users.find(u => u.id === user.id);
        if (!existingUser) {
            users.push(currentUser);
            saveUsersToStorage();
        } else {
            currentUser = existingUser;
        }

        // Обновляем отображение профиля
        updateProfileDisplay();
    }
}

// Обновление отображения профиля
function updateProfileDisplay() {
    if (currentUser) {
        document.getElementById('profile-display-name').textContent = 
            currentUser.fullName || `${currentUser.firstName} ${currentUser.lastName}`.trim() || 'Не указано';
        document.getElementById('profile-username').textContent = `@${currentUser.username}`;
        
        if (currentUser.fullName) {
            document.getElementById('profile-fullname').value = currentUser.fullName;
        }
        
        if (currentUser.birthday) {
            document.getElementById('profile-birthday').value = currentUser.birthday;
        }

        // Если профиль уже сохранён - показываем сохранённую версию
        if (currentUser.fullName || currentUser.birthday) {
            showSavedProfile();
        }

        updateProfileStats();
    }
}

// Функция показа сохранённого профиля
function showSavedProfile() {
    const profileForm = document.getElementById('profile-form');
    const profileStats = document.querySelector('.profile-stats');
    
    // Скрываем форму
    profileForm.style.display = 'none';
    
    // Показываем блок с сохранённой информацией
    let savedProfileHTML = `
        <div class="saved-profile">
            <div class="saved-profile-header">
                <h3 style="margin-bottom: 8px; color: var(--ios-text);">Мой профиль</h3>
                <p style="color: var(--ios-text-secondary); margin-bottom: 16px; font-size: 16px;">
                    ${currentUser.fullName || `${currentUser.firstName} ${currentUser.lastName}`.trim()}
                </p>
    `;
    
    if (currentUser.birthday) {
        const birthDate = new Date(currentUser.birthday).toLocaleDateString('ru-RU');
        savedProfileHTML += `
            <div style="background: #f0f9ff; padding: 16px; border-radius: 12px; margin-bottom: 20px; border: 1px solid #b6e0fe;">
                <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
                    <i class="ri-cake-line" style="color: #007AFF; font-size: 18px;"></i>
                    <span style="font-weight: 600; color: var(--ios-text);">День рождения: ${birthDate}</span>
                </div>
                <p style="font-size: 14px; color: var(--ios-text-secondary); margin: 0; line-height: 1.4;">
                    🎉 Мы напомним команде поздравить вас!
                </p>
            </div>
        `;
    }
    
    savedProfileHTML += `</div></div>`;
    
    // Вставляем после заголовка профиля
    const profileCard = document.querySelector('.profile-card');
    const existingSavedProfile = profileCard.querySelector('.saved-profile');
    if (existingSavedProfile) {
        existingSavedProfile.remove();
    }
    
    profileCard.insertAdjacentHTML('beforeend', savedProfileHTML);
    
    // Обновляем статистику
    updateProfileStats();
}

// Обновление статистики профиля
function updateProfileStats() {
    document.getElementById('events-count').textContent = 
        events.filter(event => event.participants.includes(currentUser.id)).length;
    
    if (currentUser.birthday) {
        const daysLeft = getDaysUntilBirthday(currentUser.birthday);
        document.getElementById('days-till-birthday').textContent = 
            daysLeft > 0 ? daysLeft : '🎉';
    } else {
        document.getElementById('days-till-birthday').textContent = '-';
    }
}

// Проверка прав админа
function checkAdminRights() {
    const user = tg.initDataUnsafe.user;
    const isAdmin = user && (user.username === 'NG_VLADIMIR' || user.username === 'Joyliana');
    
    if (isAdmin) {
        document.body.classList.add('show-admin');
        console.log("👑 Админ доступ предоставлен");
    }
}

// Функция для подсчёта дней до события
function getDaysLeft(eventDate) {
    const today = new Date();
    
    if (eventDate.includes('завтра')) {
        return 'Завтра';
    } else if (eventDate.includes('сегодня')) {
        return 'Сегодня';
    } else if (eventDate.includes('31 октября')) {
        const oct31 = new Date(today.getFullYear(), 9, 31);
        const diffTime = oct31 - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays === 1 ? 'Завтра' : `Осталось ${diffDays} дней`;
    } else if (eventDate.includes('1 ноября') || eventDate.includes('2 ноября')) {
        return 'Завтра';
    } else {
        return 'Скоро';
    }
}

// Функция для подсчёта дней до дня рождения
function getDaysUntilBirthday(birthday) {
    const today = new Date();
    const birthDate = new Date(birthday);
    const nextBirthday = new Date(today.getFullYear(), birthDate.getMonth(), birthDate.getDate());
    
    if (nextBirthday < today) {
        nextBirthday.setFullYear(today.getFullYear() + 1);
    }
    
    const diffTime = nextBirthday - today;
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

// Переключение экранов
function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
    });
    
    document.getElementById(screenId).classList.add('active');
    updateActiveTab(screenId);
    
    if (screenId === 'events-screen') {
        renderEvents();
    } else if (screenId === 'admin-screen') {
        renderAdminEvents();
    } else if (screenId === 'profile-screen') {
        updateProfileDisplay();
    }
}

// Обновление активной вкладки
function updateActiveTab(screenId) {
    const tabMap = {
        'welcome-screen': 0,
        'events-screen': 1,
        'profile-screen': 2
    };
    
    document.querySelectorAll('.tab-item').forEach((tab, index) => {
        tab.classList.toggle('active', index === tabMap[screenId]);
    });
}

// Переключение вкладок админки
function showAdminTab(tabId) {
    document.querySelectorAll('.admin-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    document.querySelectorAll('.admin-nav-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    document.getElementById(tabId).classList.add('active');
    event.currentTarget.classList.add('active');
    
    // Обновляем данные при переключении вкладок
    if (tabId === 'users-tab') {
        renderUsersList();
    } else if (tabId === 'birthdays-tab') {
        renderBirthdaysList();
    }
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
                <span class="event-badge">${getDaysLeft(event.date)}</span>
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
            <button class="ios-button secondary ${event.participants.includes(currentUser?.id) ? 'success' : ''}" 
                    onclick="joinEvent(${event.id}, this)"
                    ${event.participants.includes(currentUser?.id) ? 'disabled' : ''}>
                <i class="ri-${event.participants.includes(currentUser?.id) ? 'checkbox-circle-line' : 'user-add-line'}"></i>
                ${event.participants.includes(currentUser?.id) ? 'Скоро увидимся!' : 'Принять участие'}
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
                <div class="admin-event-meta">${getDaysLeft(event.date)} • ${event.participants.length} участников</div>
            </div>
            <div class="admin-event-actions">
                <button class="delete-btn" onclick="deleteEvent(${event.id})">
                    <i class="ri-delete-bin-line"></i>
                </button>
            </div>
        </div>
    `).join('');
}

// Рендер списка пользователей
function renderUsersList() {
    const container = document.getElementById('users-list-container');
    
    if (users.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="ri-user-search-line empty-icon"></i>
                <p>Пользователи появятся здесь</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = users.map(user => `
        <div class="user-item">
            <div class="user-info">
                <div class="user-name">${user.fullName || `${user.firstName} ${user.lastName}`.trim() || 'Не указано'}</div>
                <div class="user-meta">@${user.username} • ${new Date(user.joinedAt).toLocaleDateString('ru-RU')}</div>
                ${user.birthday ? `<div class="user-meta">🎂 ${new Date(user.birthday).toLocaleDateString('ru-RU')}</div>` : ''}
            </div>
            <div class="user-actions">
                <button class="message-btn" onclick="openUserProfile(${user.id})" title="Открыть профиль">
                    <i class="ri-user-line"></i>
                </button>
            </div>
        </div>
    `).join('');
}

// Рендер списка дней рождений
function renderBirthdaysList() {
    const container = document.getElementById('birthdays-list-container');
    
    const upcomingBirthdays = users
        .filter(user => user.birthday)
        .map(user => ({
            ...user,
            daysUntil: getDaysUntilBirthday(user.birthday)
        }))
        .filter(user => user.daysUntil <= 30)
        .sort((a, b) => a.daysUntil - b.daysUntil);
    
    if (upcomingBirthdays.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="ri-cake-line empty-icon"></i>
                <p>Ближайшие дни рождения появятся здесь</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = upcomingBirthdays.map(user => `
        <div class="birthday-item">
            <div class="birthday-info">
                <div class="birthday-name">${user.fullName || `${user.firstName} ${user.lastName}`.trim()}</div>
                <div class="birthday-meta">@${user.username}</div>
                <div class="birthday-meta">
                    ${user.daysUntil === 0 ? '🎉 Сегодня!' : 
                      user.daysUntil === 1 ? '🎂 Завтра!' : 
                      `🎂 Через ${user.daysUntil} дней`}
                </div>
            </div>
            <div class="user-actions">
                <button class="message-btn" onclick="openUserProfile(${user.id})" title="Открыть профиль">
                    <i class="ri-user-line"></i>
                </button>
            </div>
        </div>
    `).join('');
}

// Запись на событие
function joinEvent(eventId, button) {
    const event = events.find(e => e.id === eventId);
    if (!event || !currentUser) return;
    
    const originalHTML = button.innerHTML;
    button.innerHTML = '<i class="ri-loader-4-line"></i> Записываем...';
    button.disabled = true;
    
    setTimeout(() => {
        if (!event.participants.includes(currentUser.id)) {
            event.participants.push(currentUser.id);
            saveEventsToStorage();
        }
        
        // ✅ ФИКС 1: Зелёная кнопка "Скоро увидимся!"
        button.innerHTML = '<i class="ri-checkbox-circle-line"></i> Скоро увидимся!';
        button.classList.remove('secondary');
        button.classList.add('success');
        button.disabled = true;
        
        tg.showPopup({
            title: 'Успешно!',
            message: 'Ты записан на событие! Ждём тебя!',
            buttons: [{ type: 'ok' }]
        });
        
        renderEvents();
        updateProfileStats();
        
    }, 800);
}

// Добавление события
function addEvent(eventData) {
    const newEvent = {
        id: Date.now(),
        title: eventData.title,
        date: eventData.date,
        location: eventData.location,
        participants: []
    };
    
    events.unshift(newEvent);
    saveEventsToStorage();
    renderEvents();
    renderAdminEvents();
    
    tg.showAlert('Событие успешно добавлено!');
}

// Удаление события
function deleteEvent(eventId) {
    if (confirm('Удалить это событие?')) {
        events = events.filter(event => event.id !== eventId);
        saveEventsToStorage();
        renderEvents();
        renderAdminEvents();
        tg.showAlert('Событие удалено');
    }
}

// Сохранение профиля
function saveProfile(profileData) {
    if (!currentUser) return;
    
    currentUser.fullName = profileData.fullName;
    currentUser.birthday = profileData.birthday;
    
    // Обновляем пользователя в общем списке
    const userIndex = users.findIndex(u => u.id === currentUser.id);
    if (userIndex !== -1) {
        users[userIndex] = currentUser;
        saveUsersToStorage();
    }
    
    updateProfileDisplay();
    showSavedProfile();
    tg.showAlert('Профиль сохранён!');
}

// Открытие профиля пользователя в Telegram
function openUserProfile(userId) {
    const user = users.find(u => u.id === userId);
    if (user) {
        // Открываем профиль пользователя в Telegram
        tg.openTelegramLink(`tg://user?id=${userId}`);
    }
}

// Отправка поздравления с ДР
function sendBirthdayMessage(userId) {
    const user = users.find(u => u.id === userId);
    if (user) {
        const message = `🎉 Дорогой ${user.fullName || user.username}! Поздравляем с днём рождения! Желаем благословений от Бога!`;
        tg.showAlert(`Поздравление отправлено: "${message}"`);
    }
}

// Рассылка сообщений
function sendBroadcast(message) {
    tg.showAlert(`Сообщение отправлено ${users.length} пользователям: "${message}"`);
}

// Уведомление о будущих функциях
function showComingSoon() {
    tg.showAlert('Эта функция появится в ближайших обновлениях!');
}

// Инициализация при загрузке
document.addEventListener('DOMContentLoaded', function() {
    loadEventsFromStorage();
    loadUsersFromStorage();
    initCurrentUser();
    checkAdminRights();
    renderEvents();
    
    // Обработка формы профиля
    document.getElementById('profile-form').addEventListener('submit', function(e) {
        e.preventDefault();
        
        const formData = {
            fullName: document.getElementById('profile-fullname').value,
            birthday: document.getElementById('profile-birthday').value
        };
        
        saveProfile(formData);
    });
    
    // Обработка формы добавления события
    document.getElementById('add-event-form').addEventListener('submit', function(e) {
        e.preventDefault();
        
        const formData = {
            title: document.getElementById('event-title').value,
            date: document.getElementById('event-date').value,
            location: document.getElementById('event-location').value
        };
        
        addEvent(formData);
        this.reset();
    });
    
    // Обработка формы рассылки
    document.getElementById('broadcast-form').addEventListener('submit', function(e) {
        e.preventDefault();
        
        const message = document.getElementById('broadcast-message').value;
        if (message && confirm(`Отправить это сообщение всем ${users.length} пользователям?`)) {
            sendBroadcast(message);
            this.reset();
        }
    });
    
    // Адаптация под тему Telegram
    if (tg.colorScheme === 'dark') {
        document.documentElement.style.setProperty('--ios-bg', '#000000');
        document.documentElement.style.setProperty('--ios-card', '#1c1c1e');
    }
});