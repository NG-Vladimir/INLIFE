from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

# Имитация базы данных в памяти (можно заменить на файл/БД)
users = []
events = []

# Получить всех пользователей или добавить нового
@app.route('/users', methods=['GET', 'POST'])
def handle_users():
    if request.method == 'GET':
        return jsonify(users)
    elif request.method == 'POST':
        data = request.json
        existing = next((u for u in users if u['id'] == data['id']), None)
        if existing:
            existing.update(data)
        else:
            users.append(data)
        return jsonify({'status': 'ok'})

# Обновить профиль пользователя
@app.route('/users/<int:user_id>', methods=['PATCH'])
def update_user(user_id):
    data = request.json
    for user in users:
        if user['id'] == user_id:
            user.update(data)
            return jsonify({"status": "ok"})
    return jsonify({"error": "not found"}), 404

# Получить все события или добавить новое
@app.route('/events', methods=['GET', 'POST'])
def handle_events():
    if request.method == 'GET':
        return jsonify(events)
    elif request.method == 'POST':
        data = request.json
        existing = next((e for e in events if e['id'] == data['id']), None)
        if not existing:
            events.append(data)
        return jsonify({'status': 'ok'})

# Записаться на событие
@app.route('/events/<int:event_id>/join', methods=['POST'])
def join_event(event_id):
    user_id = request.json.get("user_id")
    for event in events:
        if event['id'] == event_id:
            if user_id not in event['participants']:
                event['participants'].append(user_id)
            return jsonify({'status': 'ok'})
    return jsonify({"error": "event not found"}), 404

if __name__ == '__main__':
    app.run(port=5000, debug=True)