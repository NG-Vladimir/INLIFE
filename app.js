// === НАСТРОЙКА АДМИНОВ ===
const ADMIN_USERNAMES = ['wewew111', 'NG_VLADIMIR', 'Joyliana'];
const API_URL = "http://localhost:5000"; // или твой сервер

(function checkTelegramWebApp() {
    if (typeof window.Telegram === 'undefined' || !window.Telegram.WebApp || !window.Telegram.WebApp.initDataUnsafe) {
        document.body.innerHTML = '';
        document.getElementById('tg-warning').style.display = 'block';
    }
})();

let tg = window.Telegram.WebApp;
tg.expand();
tg.ready();

let events = [];
let users = [];
let currentUser = null;

// --- API FUNCTIONS ---

async function fetchUsers() {
    const res = await fetch(`${API_URL}/users`);
    users = await res.json();
}

async function fetchEvents() {
    const res = await fetch(`${API_URL}/events`);
    events = await res.json();
}

async function syncUser(user) {
    await fetch(`${API_URL}/users`, {
        method: "POST",
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(user)
    });
}

async function updateUserProfile(user_id, data) {
    await fetch(`${API_URL}/users/${user_id}`, {
        method: "PATCH",
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(data)
    });
}

async function addEvent(eventData) {
    eventData.participants = [];
    eventData.username = currentUser.username;
    const res = await fetch(`${API_URL}/events`, {
        method: "POST",
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(eventData)
    });
    if (res.status === 403) {
        tg.showAlert("Только админ может добавлять события!");
        return;
    }
    await fetchEvents();
    renderEvents();
    renderAdminEvents();
    tg.showAlert('Событие успешно добавлено!');
}

async function deleteEvent(eventId) {
    const res = await fetch(`${API_URL}/events/${eventId}?username=${currentUser.username}`, {
        method: "DELETE"
    });
    if (res.status === 403) {
        tg.showAlert("Только админ может удалять события!");
        return;
    }
    await fetchEvents();
    renderEvents();
    renderAdminEvents();
    tg.showAlert('Событие удалено!');
}

async function joinEvent(eventId, button) {
    if (!currentUser) return;
    button.innerHTML = '<i class="ri-loader-4-line"></i> Записываем...';
    button.disabled = true;
    await fetch(`${API_URL}/events/${eventId}/join`, {
        method: "POST",
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({user_id: currentUser.id})
    });
    await fetchEvents();
    renderEvents();
    updateProfileStats();
    tg.showPopup({
        title: 'Успешно!',
        message: 'Ты записан на событие! Ждём тебя!',
        buttons: [{ type: 'ok' }]
    });
}

// --- ADMIN PANEL LOGIC ---

function isAdmin() {
    const user = tg.initDataUnsafe.user;
    return user && ADMIN_USERNAMES.includes(user.username);
}

function updateAdminUI() {
    if (isAdmin()) {
        document.body.classList.add('show-admin');
        document.querySelectorAll('.admin-access').forEach(el => el.style.display = '');
    } else {
        document.body.classList.remove('show-admin');
        document.querySelectorAll('.admin-access').forEach(el => el.style.display = 'none');
    }
}

// --- USER LOGIC ---

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
        syncUser(currentUser).then(() => {
            fetchUsers().then(() => {
                updateProfileDisplay();
                updateAdminUI();
            });
        });
    }
}

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
        updateProfileStats();
    }
}

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

// --- UI NAVIGATION ---

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
        updateAdminUI();
    } else if (screenId === 'profile-screen') {
        updateProfileDisplay();
    }
}

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

function showAdminTab(tabId, event) {
    document.querySelectorAll('.admin-tab').forEach(tab => tab.classList.remove('active'));
    document.querySelectorAll('.admin-nav-btn').forEach(btn => btn.classList.remove('active'));
    document.getElementById(tabId).classList.add('active');
    if (event) event.currentTarget.classList.add('active');
    if (tabId === 'users-tab') {
        renderUsersList();
    } else if (tabId === 'birthdays-tab') {
        renderBirthdaysList();
    } else if (tabId === 'events-tab') {
        renderAdminEvents();
    }
}

// --- RENDER FUNCTIONS ---

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
                <span class="event-badge">${event.date}</span>
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
        </div>
    `).join('');
}

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
        </div>
    `).join('');
}

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

// --- INIT ---

document.addEventListener('DOMContentLoaded', async function () {
    await fetchEvents();
    await fetchUsers();
    initCurrentUser();
    renderEvents();
    renderUsersList();

    document.getElementById('profile-form').addEventListener('submit', async function (e) {
        e.preventDefault();
        const fullName = document.getElementById('profile-fullname').value;
        const birthday = document.getElementById('profile-birthday').value;
        currentUser.fullName = fullName;
        currentUser.birthday = birthday;
        await updateUserProfile(currentUser.id, { fullName, birthday });
        await fetchUsers();
        updateProfileDisplay();
        tg.showAlert('Профиль сохранён!');
    });

    document.getElementById('add-event-form').addEventListener('submit', async function (e) {
        e.preventDefault();
        const title = document.getElementById('event-title').value;
        const date = document.getElementById('event-date').value;
        const location = document.getElementById('event-location').value;
        await addEvent({ id: Date.now(), title, date, location });
        this.reset();
    });

    document.getElementById('broadcast-form').addEventListener('submit', function(e) {
        e.preventDefault();
        tg.showAlert('Рассылка доступна в будущем!');
        this.reset();
    });
});