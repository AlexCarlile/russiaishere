from flask import Flask, request, jsonify, g, make_response, send_from_directory
from flask_cors import CORS, cross_origin
import requests
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity
from flask_socketio import SocketIO, emit
from datetime import timedelta
import sqlite3
import bcrypt
from database import init_db
from werkzeug.utils import secure_filename
import os
import random
from admin import fetch_users, fetch_campaigns, fetch_projects, fetch_teams, fetch_team_members, fetch_news, get_db_news, close_connection
import json
import traceback
import boto3
import uuid
from werkzeug.utils import secure_filename
import logging
import sys
from urllib.parse import unquote

app = Flask(__name__)

app = Flask(__name__)
app.config['JWT_SECRET_KEY'] = 'your_jwt_secret_key'
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(minutes=1000)  # Устанавливаем время жизни токена
jwt = JWTManager(app)
# CORS(app, resources={r"/*": {"origins": "http://localhost:3000"}})
CORS(app, resources={r"/*": {"origins": "*"}})

# Папка с иконками (например: static/icons)
ICONS_FOLDER = os.path.join(app.root_path, 'uploads', 'icons')

# Получаем абсолютный путь к папке backend
BASE_DIR = os.path.abspath(os.path.dirname(__file__))

# Общая папка для загрузки
UPLOAD_FOLDER = os.path.join(BASE_DIR, 'uploads')
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

# Специальная папка для project-файлов
UPLOAD_FOLDER_PROJECTS = os.path.join(UPLOAD_FOLDER, 'project_files')
app.config['UPLOAD_FOLDER_PROJECTS'] = UPLOAD_FOLDER_PROJECTS

# Специальная папка для project-файлов дизайнов
UPLOAD_FOLDER_PROJECTS_DESIGN = os.path.join(UPLOAD_FOLDER, 'project_files_design')
app.config['UPLOAD_FOLDER_PROJECTS_DESIGN'] = UPLOAD_FOLDER_PROJECTS_DESIGN

# Специальная папка для news-файлов
UPLOAD_FOLDER_NEWS = os.path.join(UPLOAD_FOLDER, 'news')
app.config['UPLOAD_FOLDER_NEWS'] = UPLOAD_FOLDER_NEWS

# Убедитесь, что папка существует
if not os.path.exists(UPLOAD_FOLDER_PROJECTS):
    os.makedirs(UPLOAD_FOLDER_PROJECTS)

UPLOAD_FOLDER_MENTORS = os.path.join(BASE_DIR, 'uploads',  'mentorsRequest')
app.config['UPLOAD_FOLDER_MENTORS'] = UPLOAD_FOLDER_MENTORS

if not os.path.exists(UPLOAD_FOLDER_MENTORS):
    os.makedirs(UPLOAD_FOLDER_MENTORS)

@app.route('/uploads/project_files/<path:filename>')
def serve_uploaded_file(filename):
    return send_from_directory(app.config['UPLOAD_FOLDER_PROJECTS'], filename)

@app.route('/uploads/project_files_design/<path:filename>')
def serve_uploaded_file_design(filename):
    return send_from_directory(app.config['UPLOAD_FOLDER_PROJECTS_DESIGN'], filename)

@app.route('/uploads/news/<filename>')
def uploaded_news_file(filename):
    return send_from_directory(app.config['UPLOAD_FOLDER_NEWS'], filename)

@app.route('/api/mentors/<int:user_id>', methods=['PUT'])
def update_mentor_file(user_id):
    if request.content_type and request.content_type.startswith("multipart/form-data"):
        file = request.files.get('file')
        if file:
            ext = os.path.splitext(file.filename)[1]
            new_filename = f"{uuid.uuid4().hex}{ext}"
            filepath = os.path.join(app.config['UPLOAD_FOLDER_MENTORS'], new_filename)
            os.makedirs(app.config['UPLOAD_FOLDER_MENTORS'], exist_ok=True)
            file.save(filepath)

            db = get_db_users()
            cursor = db.cursor()
            cursor.execute("UPDATE Users SET file = ? WHERE email = ?", (new_filename, user_id))
            db.commit()
            db.close()

            return jsonify({"message": "Файл наставника обновлён", "file": new_filename}), 200
        return jsonify({"error": "Файл не передан"}), 400
    return jsonify({"error": "Неверный Content-Type"}), 400


DATABASE_USERS = 'data/users.db'
DATABASE_CAMPAIGNS = 'data/campaigns.db'
DATABASE_TEAMS = 'data/teams.db'
DATABASE_PROJECTS = 'data/projects.db'
DATABASE_TEAM_MEMBERS = 'data/team_members.db'
DATABASE_NEWS = 'data/news.db'

def get_db_users():
    db = getattr(g, '_database_users', None)
    if db is None:
        db = g._database_users = sqlite3.connect(DATABASE_USERS)
    return db

def get_db_campaigns():
    db = getattr(g, '_database_campaigns', None)
    if db is None:
        db = g._database_campaigns = sqlite3.connect(DATABASE_CAMPAIGNS)
    return db

def get_db_teams():
    db = getattr(g, '_database_teams', None)
    if db is None:
        db = g._database_teams = sqlite3.connect(DATABASE_TEAMS)
    return db

def get_db_projects():
    db = getattr(g, '_database_projects', None)
    if db is None:
        db = g._database_projects = sqlite3.connect(DATABASE_PROJECTS)
    return db

def get_db_team_members():
    db = getattr(g, '_database_team_members', None)
    if db is None:
        db = g._database_team_members = sqlite3.connect(DATABASE_TEAM_MEMBERS)
    return db

def get_db_all():
    if not hasattr(g, 'databases'):
        g.databases = {
            'team_members': sqlite3.connect(DATABASE_TEAM_MEMBERS),
            'projects': sqlite3.connect(DATABASE_PROJECTS),
            'teams': sqlite3.connect(DATABASE_TEAMS)
        }
    return g.databases

YANDEX_DISK_OAUTH_TOKEN = 'y0_AgAAAABGHbn0AAwX4gAAAAEKQ9lBAABVcXogU4xOFJPgUYhVG7XkB1Bl1Q'

def get_db(db_path):
    db = getattr(g, '_database', None)
    if db is None:
        db = g._database = sqlite3.connect(db_path)
    return db

# Эндпоинт для получения пользователей
@app.route('/api/users', methods=['GET'])
def get_users():
    users = fetch_users()
    return jsonify(users)

# Эндпоинт для получения акций
@app.route('/api/campaigns', methods=['GET'])
def get_admin_campaigns():
    campaigns = fetch_campaigns()
    return jsonify(campaigns)

# Эндпоинт для получения команд
@app.route('/api/teams', methods=['GET'])
def get_admin_teams():
    teams = fetch_teams()
    return jsonify(teams)

# Эндпоинт для получения участников команд
@app.route('/api/team_members', methods=['GET'])
def get_admin_team_members():
    team_members = fetch_team_members()
    return jsonify(team_members)

# Эндпоинт для получения проектов
@app.route('/api/projects', methods=['GET'])
def get_projects():
    projects = fetch_projects()
    return jsonify(projects)

@app.route('/api/news', methods=['GET'])
def get_news():
    news = fetch_news()
    return jsonify(news)

@app.teardown_appcontext
def close_connection(exception):
    db = getattr(g, '_database', None)
    if db is not None:
        db.close()

@app.route('/api/users/<int:user_id>', methods=['PUT'])
@cross_origin()
def update_user(user_id):
    data = request.get_json()
    role = data.get('role')
    password = data.get('password')  # Новый пароль

    db = get_db(DATABASE_USERS)
    cursor = db.cursor()

    if role:
        cursor.execute("UPDATE users SET role = ? WHERE id = ?", (role, user_id))
    
    if password:
        hashed_password = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())
        hashed_password_str = hashed_password.decode('utf-8')
        cursor.execute("UPDATE users SET password = ? WHERE id = ?", (hashed_password_str, user_id))

    db.commit()
    return jsonify({"message": "User updated successfully"}), 200

@app.route('/api/users/<int:user_id>', methods=['DELETE'])
@cross_origin()
def delete_user(user_id):
    db = get_db(DATABASE_USERS)
    cursor = db.cursor()

    cursor.execute("DELETE FROM Users WHERE id = ?", (user_id,))
    db.commit()

    return jsonify({"message": "Пользователь удалён"}), 200

@app.route('/api/campaigns/<int:campaign_id>', methods=['PUT'])
@cross_origin()
def update_campaign(campaign_id):
    data = request.get_json()
    approval_status = data.get('approval_status')

    db = get_db(DATABASE_CAMPAIGNS)
    cursor = db.cursor()

    if approval_status:
        cursor.execute("UPDATE campaigns SET approval_status = ? WHERE id = ?", (approval_status, campaign_id))

    db.commit()
    return jsonify({"message": "User updated successfully"}), 200

ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'webp', 'pdf'}
ALLOWED_EXTENSIONS_PROJECTS = {'pdf', 'doc', 'docx', 'xlsx', 'pptx', 'png', 'jpg', 'jpeg', 'gif', 'webp'}

# Функция для проверки разрешенного расширения файла
def allowed_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def allowed_file_projects(filename):
    print(f"Проверяем файл: {filename}")
    ext = filename.rsplit('.', 1)[1].lower() if '.' in filename else ''
    print(f"Расширение файла: {ext}")
    allowed = ext in ALLOWED_EXTENSIONS_PROJECTS
    print(f"Разрешён ли файл: {allowed}")
    return allowed

def close_connection(exception):
    db_teams = getattr(g, '_database_teams', None)
    if db_teams is not None:
        db_teams.close()
        
    db_projects = getattr(g, '_database_projects', None)
    if db_projects is not None:
        db_projects.close()
        
    db_team_members = getattr(g, '_database_team_members', None)
    if db_team_members is not None:
        db_team_members.close()


@app.route('/')
def hello_world():
    return 'Hello N Flask!'

@app.route('/login', methods=['POST','OPTIONS'])
def login():
    if request.method == 'OPTIONS':  # Обработка предварительного запроса
        response = jsonify({'success': True})
        response.headers.add('Access-Control-Allow-Origin', 'http://localhost:3000')
        response.headers.add('Access-Control-Allow-Methods', 'POST')
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type')
        response.headers['Permissions-Policy'] = 'accelerometer=(), gyroscope=(), magnetometer=()'
        return response
    
    email = request.json.get('email')
    password = request.json.get('password')

    db = get_db(DATABASE_USERS)
    cursor = db.cursor()

    try:
        # Проверяем, существует ли пользователь с заданным email в базе данных
        cursor.execute('SELECT id, password FROM Users WHERE email = ?', (email,))
        user = cursor.fetchone()

        if user and bcrypt.checkpw(password.encode('utf-8'), user[1].encode('utf-8')):
            # Если пользователь найден и пароль совпадает, создаем токен доступа
            access_token = create_access_token(identity=email)
            return jsonify(access_token=access_token), 200
        else:
            return jsonify({"msg": "Bad username or password"}), 401

    except Exception as e:
        print(e)
        return jsonify({"msg": "Error during login process"}), 500
    finally:
        cursor.close()
        db.close()
    
@app.route('/register', methods=['POST', 'OPTIONS'])
def register():
    if request.method == 'OPTIONS':  # Обработка предварительного запроса
        # response = jsonify({'success': True})
        response = make_response()
        response.headers.add('Access-Control-Allow-Origin', 'http://localhost:3000')
        response.headers.add('Access-Control-Allow-Methods', 'POST')
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type')
        response.headers['Permissions-Policy'] = 'accelerometer=(), gyroscope=(), magnetometer=()'
        return response
    
    data = request.json
    email = data.get('email')
    password = data.get('password')
    name = data.get('name')
    surname = data.get('surname')
    region = data.get('region')
    locality = data.get('locality')
    school = data.get('school')
    role = data.get('role', 'участник')
    agreement = data.get('agreement', 'Нет')
    currentDate = data.get('currentDate')
    file = data.get('file', None)  # Получаем имя файла, если оно есть

    if not email or not password or not name or not surname or not region or not locality or not school or not agreement:
        return jsonify({"msg": "Missing fields"}), 400

    hashed_password = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())
    hashed_password_str = hashed_password.decode('utf-8')

    db = get_db(DATABASE_USERS)
    cursor = db.cursor()

    try:
        # Проверяем, есть ли пользователь с таким email уже в базе данных
        cursor.execute('SELECT id FROM Users WHERE email = ?', (email,))
        existing_user = cursor.fetchone()

        if existing_user:
            return jsonify({"msg": "Пользователь уже существует"}), 409

        # Вставляем нового пользователя в базу данных
        cursor.execute('''
            INSERT INTO Users (email, password, name, surname, region, locality, school, role, agreement, currentDate, file)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (email, hashed_password_str, name, surname, region, locality, school, role, agreement, currentDate, file))
        db.commit()

    except Exception as e:
        print(e)
        return jsonify({"msg": "Ошибка при регистрации пользователя"}), 500
    finally:
        cursor.close()
        db.close()

    return jsonify({"msg": "Пользователь успешно зарегистрирован"}), 201

@app.route('/upload', methods=['POST'])
def upload_file():
    file = request.files.get('file')
    if not file:
        print("Файл не пришёл в request.files")
        return jsonify({'error': 'Нет файла'}), 400

    print("Имя файла с фронта:", file.filename)

    if file.filename == '':
        return jsonify({'error': 'Файл не выбран'}), 400

    # Проверка расширения
    ALLOWED_EXTENSIONS = {'pdf', 'doc', 'docx', 'xlsx', 'pptx', 'png', 'jpg', 'jpeg', 'gif', 'webp'}
    ext = file.filename.rsplit('.', 1)[-1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        return jsonify({'error': f'Недопустимый формат файла: {ext}'}), 400

    try:
        unique_name = f"{uuid.uuid4().hex}.{ext}"
        safe_filename = secure_filename(unique_name)
        save_folder = app.config['UPLOAD_FOLDER_MENTORS']

        # Создаем папку, если вдруг её нет
        if not os.path.exists(save_folder):
            os.makedirs(save_folder, exist_ok=True)
            print(f"Папка создана: {save_folder}")

        save_path = os.path.join(save_folder, safe_filename)
        print("Файл получен:", file.filename)
        print("Сохраняем по пути:", save_path)
        print("Существует папка для сохранения:", os.path.exists(save_folder))

        file.save(save_path)
        print("Файл успешно сохранен!")

        return jsonify({'filename': safe_filename}), 200

    except Exception as e:
        print("Ошибка при сохранении файла:", e)
        return jsonify({'error': 'Ошибка при сохранении файла'}), 500

    
@app.route('/random-icon', methods=['GET'])
def get_random_icon():
    try:
        # Получаем список файлов в папке icons
        icons = [f for f in os.listdir(ICONS_FOLDER) if os.path.isfile(os.path.join(ICONS_FOLDER, f))]

        if not icons:
            return jsonify({"error": "No icons found"}), 404

        # Случайный выбор
        random_icon = random.choice(icons)

        # Отдаём картинку
        return send_from_directory(ICONS_FOLDER, random_icon)
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    
@app.route('/download/<filename>', methods=['GET'])
def download_file(filename):
    try:
        # Запрос ссылки для скачивания файла
        get_download_link_response = requests.get(
            'https://cloud-api.yandex.net/v1/disk/resources/download',
            params={'path': f'disk:/{filename}'},
            headers={'Authorization': f'OAuth {YANDEX_DISK_OAUTH_TOKEN}'}
        )
        
        print('Запрос на получение ссылки для скачивания файла:', get_download_link_response.url)
        print('Статус код:', get_download_link_response.status_code)
        print('Тело ответа:', get_download_link_response.text)

        # Проверяем успешность запроса на получение ссылки
        if get_download_link_response.status_code != 200:
            return jsonify({'error': 'Failed to get download link'}), get_download_link_response.status_code

        download_url = get_download_link_response.json().get('href')
        print('Ссылка для скачивания файла:', download_url)

        # Возвращаем ссылку для скачивания файла
        return jsonify({'download_url': download_url})

    except requests.RequestException as e:
        print(e)  # Вывод ошибки в консоль для отладки
        return jsonify({'error': 'Internal Server Error'}), 500


@app.route('/protected', methods=['GET'])
@jwt_required()
def protected():
    current_user = get_jwt_identity()
    return jsonify(logged_in_as=current_user), 200

@app.route('/user', methods=['GET', 'PUT', 'OPTIONS'])
@jwt_required()
@cross_origin()
def manage_user():
    if request.method == 'OPTIONS':
        return '', 200  # Просто возвращаем пустой ответ на предварительный CORS-запрос

    current_user_email = get_jwt_identity()

    if request.method == 'GET':
        try:
            db = sqlite3.connect(DATABASE_USERS)
            cursor = db.cursor()
            cursor.execute('SELECT email, name, surname, region, locality, school, role, currentDate, file FROM Users WHERE email = ?', (current_user_email,))
            user = cursor.fetchone()

            if user:
                user_data = {
                    'email': user[0],
                    'name': user[1],
                    'surname': user[2],
                    'region': user[3],
                    'locality': user[4],
                    'school': user[5],
                    'role': user[6],
                    'currentDate': user[7],
                    'file': user[8]
                }
                return jsonify(user_data), 200
            else:
                return jsonify({"msg": "User not found"}), 404
        except Exception as e:
            print(e)
            return jsonify({"msg": "Error fetching user data"}), 500
        finally:
            cursor.close()
            db.close()

    if request.method == 'PUT':
        data = request.json
        name = data.get('name')
        surname = data.get('surname')
        region = data.get('region')
        locality = data.get('locality')
        school = data.get('school')
        role = data.get('role')
        file = data.get('file')
        if file and not isinstance(file, str):
            file = str(file)  # Преобразуем в строку на всякий случай

        try:
            db = sqlite3.connect(DATABASE_USERS)
            cursor = db.cursor()
            cursor.execute('''
                UPDATE Users
                SET name = ?, surname = ?, region = ?, locality = ?, school = ?, role = ?, file = ?
                WHERE email = ?
            ''', (name, surname, region, locality, school, role, file, current_user_email))
            db.commit()
            return jsonify({"msg": "User data updated successfully"}), 200
        except Exception as e:
            print(e)
            return jsonify({"msg": "Error updating user data"}), 500
        finally:
            cursor.close()
            db.close()

@app.route('/upload_project_file', methods=['POST'])
@jwt_required()
def add_project_file():
    team_id = request.form.get('team_id')

    if 'image' not in request.files:
        return jsonify({"msg": "No selected file"}), 400
    
    image = request.files['image']
    if image.filename == '':
        return jsonify({"msg": "No selected file"}), 400

    if not allowed_file_projects(image.filename):
        return jsonify({"msg": "Invalid file format"}), 400

    ext = os.path.splitext(image.filename)[1]
    new_filename = f"{uuid.uuid4().hex}{ext}"
    filepath = os.path.join(app.config['UPLOAD_FOLDER_PROJECTS'], new_filename)
    image_path = f'/uploads/project_files/{new_filename}'

    db = get_db(DATABASE_PROJECTS)
    cursor = db.cursor()

    try:
        # 1. Найти старый файл
        cursor.execute('SELECT file FROM Projects WHERE id = ?', (team_id,))
        row = cursor.fetchone()
        if row and row[0]:
            old_filename = row[0]
            old_filepath = os.path.join(app.config['UPLOAD_FOLDER_PROJECTS'], old_filename)
            # 2. Удалить старый файл, если он существует
            if os.path.exists(old_filepath):
                os.remove(old_filepath)

        # 3. Сохранить новый файл на диск
        image.save(filepath)

        # 4. Обновить БД новым именем файла
        cursor.execute('UPDATE Projects SET file = ? WHERE id = ?', (new_filename, team_id))
        db.commit()

        return jsonify({
            "msg": "Файл успешно загружен",
            "filename": new_filename,
            "file_url": image_path
        }), 201

    except Exception as e:
        print(e)
        db.rollback()
        return jsonify({"msg": "Ошибка при загрузке файла"}), 500

    finally:
        cursor.close()
        db.close()

@app.route('/delete_project_file', methods=['POST'])
@jwt_required()
def delete_project_file():
    data = request.get_json()
    team_id = data.get('team_id')
    if not team_id:
        return jsonify({"msg": "team_id не указан"}), 400

    db = get_db(DATABASE_PROJECTS)
    cursor = db.cursor()

    try:
        # Получаем имя файла
        cursor.execute('SELECT file FROM Projects WHERE id = ?', (team_id,))
        row = cursor.fetchone()
        if not row or not row[0]:
            return jsonify({"msg": "Файл не найден"}), 404

        filename = row[0]
        filepath = os.path.join(app.config['UPLOAD_FOLDER_PROJECTS'], filename)

        # Удаляем файл, если существует
        if os.path.exists(filepath):
            os.remove(filepath)

        # Обнуляем поле file в БД
        cursor.execute('UPDATE Projects SET file = NULL WHERE id = ?', (team_id,))
        db.commit()

        return jsonify({"msg": "Файл успешно удалён"}), 200

    except Exception as e:
        print(e)
        db.rollback()
        return jsonify({"msg": "Ошибка при удалении файла"}), 500

    finally:
        cursor.close()
        db.close()
    
@app.route('/get_project_file', methods=['GET'])
@jwt_required()
def get_project_file():
    print(os.path.exists(os.path.join(app.config['UPLOAD_FOLDER_PROJECTS'], '9ee847bb661b474fb00636248d395f04.jpg')))
    team_id = request.args.get('team_id')
    if not team_id:
        return jsonify({"msg": "Missing team_id"}), 400

    db = get_db(DATABASE_PROJECTS)
    cursor = db.cursor()
    try:
        cursor.execute('SELECT file FROM Projects WHERE id = ?', (team_id,))
        row = cursor.fetchone()
        if row and row[0]:
            filename = row[0]
            file_url = f"http://127.0.0.1:5000/uploads/project_files/{filename}"
            return jsonify({"filename": filename, "file_url": file_url}), 200
        else:
            return jsonify({"filename": None, "file_url": None}), 200
    finally:
        cursor.close()
        db.close()

# Добавление акции с изображением
@app.route('/campaigns', methods=['POST'])
@jwt_required()
def add_campaign():
    title = request.form.get('title')
    description = request.form.get('description')
    full_description = request.form.get('full_description')
    rules = request.form.get('rules')
    start_date = request.form.get('start_date')
    end_date = request.form.get('end_date')
    created_by = get_jwt_identity()

    # Логирование данных запроса
    print('Request Data:', {
        'title': title,
        'description': description,
        'full_description': full_description,
        'rules': rules,
        'start_date': start_date,
        'end_date': end_date,
        'created_by': created_by,
        'files': request.files
    })
    
    if 'image' not in request.files:
        return jsonify({"msg": "No selected file"}), 400
    
    image = request.files['image']

    if image.filename == '':
        return jsonify({"msg": "No selected file"}), 400
    if image and allowed_file(image.filename):
        ext = os.path.splitext(image.filename)[1]  # получить расширение, например, ".jpg"
        # Генерируем новое имя файла, например, uuid4 + расширение
        new_filename = f"{uuid.uuid4().hex}{ext}"
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], new_filename)
        image.save(filepath)
        # Сохраняем в БД путь с новым именем
        
        # В БД сохранить НЕ полный путь filepath, а только относительный URL:
        image_path = f'/uploads/{new_filename}'

        db = get_db(DATABASE_CAMPAIGNS)
        cursor = db.cursor()

        try:
            cursor.execute('INSERT INTO Campaigns (title, description, full_description, rules, start_date, end_date, created_by, image_path) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
                           (title, description, full_description, rules, start_date, end_date, created_by, image_path))
            db.commit()
            return jsonify({"msg": "Campaign added successfully"}), 201
        except Exception as e:
            print(e)
            return jsonify({"msg": "Error adding campaign"}), 500
        finally:
            cursor.close()
    else:
        return jsonify({"msg": "Invalid file format"}), 400

# Получение списка акций
@app.route('/campaigns', methods=['GET'])
@jwt_required() 
def get_campaigns():
    current_user = get_jwt_identity()  # Получаем email текущего пользователя
    db = get_db(DATABASE_CAMPAIGNS)
    cursor = db.cursor()

    try:
        # cursor.execute('SELECT id, title, description, start_date, end_date, image_path FROM Campaigns')
        cursor.execute('''
            SELECT id, title, description, full_description, rules, start_date, end_date, image_path, approval_status 
            FROM Campaigns 
            WHERE created_by = ?
        ''', (current_user,))
        campaigns = cursor.fetchall()
        campaigns_data = []

        for campaign in campaigns:
            campaign_data = {
                'id': campaign[0],
                'title': campaign[1],
                'description': campaign[2],
                'full_description': campaign[3],
                'rules': campaign[4],
                'start_date': campaign[5],
                'end_date': campaign[6],
                'image_url': f'/backend/uploads/{os.path.basename(campaign[7])}' if campaign[7] else None,
                'approval_status': campaign[8]
            }
            campaigns_data.append(campaign_data)

        return jsonify(campaigns_data), 200
    except Exception as e:
        print(e)
        return jsonify({"msg": "Error fetching campaigns"}), 500
    finally:
        cursor.close()

# Получение списка всех акций
@app.route('/allcampaigns', methods=['GET'])
# @jwt_required()
@cross_origin()
def get_allcampaigns():
    db = get_db(DATABASE_CAMPAIGNS)
    cursor = db.cursor()

    try:
        cursor.execute('SELECT id, title, description, start_date, end_date, image_path, approval_status  FROM Campaigns')
        campaigns = cursor.fetchall()
        campaigns_data = []

        for campaign in campaigns:
            campaign_data = {
                'id': campaign[0],
                'title': campaign[1],
                'description': campaign[2],
                'start_date': campaign[3],
                'end_date': campaign[4],
                'image_url': f'/backend/uploads/{os.path.basename(campaign[5])}' if campaign[5] else None,
                'approval_status': campaign[6]
            }
            campaigns_data.append(campaign_data)

        return jsonify(campaigns_data), 200
    except Exception as e:
        print(e)
        return jsonify({"msg": "Error fetching campaigns"}), 500
    finally:
        cursor.close()


@app.route('/selectedcampaigns', methods=['GET', 'POST'])
@jwt_required()
@cross_origin()
def get_selected_campaigns():
    data = request.json
    user_id = data.get('userId')
    db = get_db(DATABASE_CAMPAIGNS)
    cursor = db.cursor()

    db_team_members = get_db_team_members()
    db_campaigns = get_db_campaigns()
    db_users = get_db_users()

    cursor_team_members = db_team_members.cursor()
    cursor_campaigns = db_campaigns.cursor()
    cursor_users = db_users.cursor()


    try:
        cursor_users.execute('''
            SELECT role
            FROM Users
            WHERE email = ?
        ''', (user_id,))
        users_role = cursor_users.fetchone()

        if users_role is None or users_role[0] not in ('участник', 'наставник', '?наставник'):
            # Логика получения списка кампаний для модераторов
            cursor_campaigns.execute('''
                SELECT id
                FROM Campaigns
                WHERE created_by = ?
            ''', ((user_id),))

            campaign_ids = cursor_campaigns.fetchall()

            # Если пользователь не состоит ни в одной команде
            if not campaign_ids:
                return jsonify([]), 200

            # Извлекаем только уникальные идентификаторы кампаний
            campaign_ids = [campaign_id[0] for campaign_id in campaign_ids]

            # Получаем кампании по найденным campaign_ids
            if campaign_ids:  # Проверяем, что список не пуст
                cursor_campaigns.execute('''
                    SELECT id, title, description, start_date, end_date, image_path, approval_status 
                    FROM Campaigns 
                    WHERE id IN ({seq})
                '''.format(seq=','.join(['?'] * len(campaign_ids))), campaign_ids)

                campaigns = cursor_campaigns.fetchall()
            else:
                campaigns = []  # Если список пуст, присваиваем пустой список
            
            campaigns_data = []
            for campaign in campaigns:
                campaign_data = {
                    'id': campaign[0],
                    'title': campaign[1],
                    'description': campaign[2],
                    'start_date': campaign[3],
                    'end_date': campaign[4],
                    'image_url': f'/backend/uploads/{os.path.basename(campaign[5])}' if campaign[5] else None,
                    'approval_status': campaign[6]
                }
                campaigns_data.append(campaign_data)

            print("Fetched campaigns:", campaigns_data)  # Логируем кампании
            return jsonify(campaigns_data), 200
        else:
            # Получаем team_ids, в которых состоит пользователь
            cursor_team_members.execute('''
                SELECT campaign_id
                FROM Team_Members
                WHERE user_id = ?
            ''', (user_id,))
            campaign_ids = cursor_team_members.fetchall()
            
            # Если пользователь не состоит ни в одной команде
            if not campaign_ids:
                return jsonify([]), 200

            # Извлекаем только уникальные идентификаторы кампаний
            campaign_ids = [campaign_id[0] for campaign_id in campaign_ids]

            # Получаем кампании по найденным campaign_ids
            if campaign_ids:  # Проверяем, что список не пуст
                cursor_campaigns.execute('''
                    SELECT id, title, description, start_date, end_date, image_path, approval_status 
                    FROM Campaigns 
                    WHERE id IN ({seq})
                '''.format(seq=','.join(['?'] * len(campaign_ids))), campaign_ids)

                campaigns = cursor_campaigns.fetchall()
            else:
                campaigns = []  # Если список пуст, присваиваем пустой список
            
            # Получаем team_ids пользователя
            cursor_team_members.execute('''
                SELECT DISTINCT team_id
                FROM Team_Members
                WHERE user_id = ?
            ''', (user_id,))
            team_ids = [row[0] for row in cursor_team_members.fetchall()]

            # Получаем description из Projects
            db_projects = get_db_projects()
            cursor_projects = db_projects.cursor()

            if team_ids:
                query = f'''
                    SELECT description
                    FROM Projects
                    WHERE team_id IN ({','.join(['?'] * len(team_ids))})
                '''
                cursor_projects.execute(query, team_ids)
                descriptions = [row[0] for row in cursor_projects.fetchall()]
            else:
                descriptions = []

            total = len(descriptions)
            completed = sum(1 for d in descriptions if d == 'yes')
            won = sum(1 for d in descriptions if d == 'yes')  # или другое условие

            campaigns_data = []
            for campaign in campaigns:
                campaign_data = {
                    'id': campaign[0],
                    'title': campaign[1],
                    'description': campaign[2],
                    'start_date': campaign[3],
                    'end_date': campaign[4],
                    'image_url': f'/backend/uploads/{os.path.basename(campaign[5])}' if campaign[5] else None,
                    'approval_status': campaign[6]
                }
                campaigns_data.append(campaign_data)

            result = {
                "campaigns": campaigns_data,
                "stats": {
                    "total": total,
                    "completed": completed,
                    "won": won
                }
            }
            print('данные ЛК', result)

            return jsonify(result), 200

    except Exception as e:
        print("Error in fetching campaigns:", e)  # Логируем ошибку
        return jsonify({"msg": "Error fetching campaigns"}), 500
    finally:
        cursor_team_members.close()
        cursor_campaigns.close()
        cursor_users.close()
        if 'cursor_projects' in locals():
            cursor_projects.close()

        db_team_members.close()
        db_campaigns.close()
        db_users.close()
        if 'db_projects' in locals():
            db_projects.close()

        db.close()


@app.route('/campaigns/<int:id>', methods=['GET'])
# @jwt_required()  # если нужна авторизация, можно убрать, если нет — удалите эту строку
def get_campaign_by_id(id):
    db = get_db(DATABASE_CAMPAIGNS)
    cursor = db.cursor()

    try:
        cursor.execute('''
            SELECT id, title, description, full_description, rules, start_date, end_date, image_path, approval_status 
            FROM Campaigns
            WHERE id = ?
        ''', (id,))
        campaign = cursor.fetchone()

        if campaign is None:
            return jsonify({"msg": "Campaign not found"}), 404

        campaign_data = {
            'id': campaign[0],
            'title': campaign[1],
            'description': campaign[2],
            'full_description': campaign[3],
            'rules': campaign[4],
            'start_date': campaign[5],
            'end_date': campaign[6],
            'image_url': f'/backend/uploads/{os.path.basename(campaign[7])}' if campaign[7] else None,
            'approval_status': campaign[8],
        }
        return jsonify(campaign_data), 200

    except Exception as e:
        print(e)
        return jsonify({"msg": "Error fetching campaign"}), 500
    finally:
        cursor.close()


@app.route('/createTeam', methods=['POST'])
@jwt_required()
def create_team():
    data = request.json
    name = data.get('name')
    campaign_id = data.get('campaignId')
    user_id = data.get('userId')
    print(user_id)

    if not name or not campaign_id or not user_id:
        return jsonify({"msg": "Missing fields"}), 400

    db_teams = get_db_teams()
    db_projects = get_db_projects()
    db_team_members = get_db_team_members()
    db_users = get_db_users()

    cursor_teams = db_teams.cursor()
    cursor_projects = db_projects.cursor()
    cursor_team_members = db_team_members.cursor()
    cursor_users = db_users.cursor()

    try:
        # Получаем имя и фамилию пользователя
        cursor_users.execute('SELECT name, surname FROM Users WHERE email = ?', (user_id,))
        user = cursor_users.fetchone()
        if not user:
            return jsonify({"msg": "User not found"}), 404

        user_name, user_surname = user
        
        # Создаем команду
        cursor_teams.execute('INSERT INTO Teams (name, campaign_id, created_by) VALUES (?, ?, ?)', (name, campaign_id, user_id))
        team_id = cursor_teams.lastrowid
        
        # Добавляем пользователя в команду
        cursor_team_members.execute('INSERT INTO Team_Members (team_id, user_id, campaign_id, name, surname) VALUES (?, ?, ?, ?, ?)', (team_id, user_id, campaign_id, user_name, user_surname))

        # Генерируем уникальный код
        project_code = generate_unique_code(db_projects)

        # Создаем проект и связываем его с командой
        cursor_projects.execute('INSERT INTO Projects (title, campaign_id, team_id, project_code) VALUES (?, ?, ?, ?)', (name, campaign_id, team_id, project_code))
        cursor_projects.execute('SELECT team_id FROM Projects WHERE team_id = ?', (team_id,))
        row = cursor_projects.fetchone()
        url_id = row[0] if row else None
        db_teams.commit()
        db_projects.commit()
        db_team_members.commit()
        
        return jsonify({
            "msg": "Team created successfully",
            "teamId": url_id  # или url_id, если нужно другое
        }), 201
    except Exception as e:
        print(e)
        return jsonify({"msg": "Error creating team"}), 500
    finally:
        cursor_teams.close()
        cursor_projects.close()
        cursor_team_members.close()
        cursor_users.close()
        db_teams.close()
        db_projects.close()
        db_team_members.close()
        db_users.close()

        
@app.route('/checkUserInTeam', methods=['POST'])
@jwt_required()
def check_user_in_team():
    data = request.json
    user_id = data.get('userId')
    campaign_id = data.get('campaignId')

    if not user_id or not campaign_id:
        return jsonify({"msg": "Missing fields"}), 400

    db_team_members = get_db_team_members()
    db_projects = get_db_projects()
    db_teams = get_db_teams()

    cursor_team_members = db_team_members.cursor()
    cursor_projects = db_projects.cursor()

    try:
        # Получаем список команд, связанных с кампанией
        cursor_projects.execute('''
            SELECT team_id
            FROM Projects
            WHERE campaign_id = ?
        ''', (campaign_id,))
        team_ids = [row[0] for row in cursor_projects.fetchall()]

        if not team_ids:
            return jsonify({"isInTeam": False}), 200

        # Проверяем, состоит ли пользователь в одной из команд и получаем team_id
        cursor_team_members.execute('''
            SELECT team_id
            FROM Team_Members
            WHERE user_id = ? AND team_id IN ({seq})
        '''.format(seq=','.join('?'*len(team_ids))), (user_id, *team_ids))
        result = cursor_team_members.fetchone()

        if result:
            team_id = result[0]
            return jsonify({"isInTeam": True, "teamId": team_id}), 200
        else:
            return jsonify({"isInTeam": False}), 200

    except Exception as e:
        print(e)
        return jsonify({"msg": "Error checking user in team"}), 500
    finally:
        cursor_team_members.close()
        cursor_projects.close()
        db_team_members.close()
        db_projects.close()



@app.route('/joinTeam', methods=['POST'])
@jwt_required()
def join_team():
    data = request.json
    user_id = data.get('userId')
    campaign_id = data.get('campaignId')
    team_code = data.get('teamCode')  # Получаем код команды

    if not user_id or not campaign_id or not team_code:
        return jsonify({"msg": "Missing fields"}), 400

    db_teams = get_db_teams()
    db_projects = get_db_projects()
    db_team_members = get_db_team_members()
    db_users = get_db_users()

    cursor_teams = db_teams.cursor()
    cursor_projects = db_projects.cursor()
    cursor_team_members = db_team_members.cursor()
    cursor_users = db_users.cursor()

    try:
        # Получаем имя и фамилию пользователя
        cursor_users.execute('SELECT name, surname FROM Users WHERE email = ?', (user_id,))
        user = cursor_users.fetchone()
        if not user:
            return jsonify({"msg": "User not found"}), 404

        user_name, user_surname = user

        # Проверяем, существует ли команда с таким кодом в данной акции
        cursor_projects.execute('''
            SELECT team_id FROM Projects 
            WHERE campaign_id = ? AND project_code = ?
        ''', (campaign_id, team_code))
        
        team = cursor_projects.fetchone()
        if not team:
            return jsonify({"msg": "Invalid team code"}), 400

        team_id = team[0]

        # Проверяем, состоит ли пользователь в команде
        cursor_team_members.execute('''
            SELECT COUNT(*) 
            FROM Team_Members 
            WHERE user_id = ? AND team_id = ?
        ''', (user_id, team_id))

        if cursor_team_members.fetchone()[0] > 0:
            return jsonify({"msg": "User already in the team"}), 400

        # Добавляем пользователя в команду
        cursor_team_members.execute('INSERT INTO Team_Members (team_id, user_id, name, surname, campaign_id) VALUES (?, ?, ?, ?, ?)', (team_id, user_id, user_name, user_surname, campaign_id))

        # Опционально: можно добавить логику обновления проектов или других действий
        db_teams.commit()
        db_projects.commit()
        db_team_members.commit()
        db_users.commit()

        return jsonify({"msg": "User joined team successfully", "teamId": team_id}), 200
    except Exception as e:
        print(e)
        return jsonify({"msg": "Error joining team"}), 500
    finally:
        cursor_teams.close()
        cursor_projects.close()
        cursor_team_members.close()
        cursor_users.close()
        db_teams.close()
        db_projects.close()
        db_team_members.close()
        db_users.close()

@app.route('/team/<int:team_id>', methods=['GET'])
@jwt_required()
def get_team_details(team_id):
    db_projects = get_db_projects()
    db_team_members = get_db_team_members()
    db_users = get_db_users()

    cursor_projects = db_projects.cursor()
    cursor_team_members = db_team_members.cursor()
    cursor_users = db_users.cursor()

    user_email = get_jwt_identity()  # Получаем email пользователя из JWT

    try:
        # Извлекаем детали проекта по team_id
        cursor_projects.execute('''
            SELECT id, project_code, title, description, campaign_id, team_id, answers, status
            FROM Projects 
            WHERE team_id = ?
        ''', (team_id,))
        project = cursor_projects.fetchone()

        if project:
            project_data = {
                'id': project[0],
                'project_code': project[1],
                'title': project[2],
                'description': project[3],
                'campaign_id': project[4],
                'team_id': project[5],
                'answers': project[6],
                'status': project[7],
            }
        else:
            return jsonify({"msg": "Проект не найден"}), 404

        # Извлекаем участников команды по team_id, включая name и surname
        cursor_team_members.execute('''
            SELECT name, surname, user_id FROM Team_Members 
            WHERE team_id = ?
        ''', (team_id,))
        team_members = cursor_team_members.fetchall()

        members_list = []
        for member in team_members:
            name, surname, email = member

            # Получаем роль пользователя по email
            cursor_users.execute('''
                SELECT role 
                FROM Users 
                WHERE email = ?
            ''', (email,))
            user_role = cursor_users.fetchone()
            role = user_role[0] if user_role else "unknown"

            members_list.append({
                "name": name,
                "surname": surname,
                # "email": email,
                "role": role
            })

        # Извлекаем роль пользователя из базы данных
        cursor_users.execute('''
            SELECT role 
            FROM Users 
            WHERE email = ?
        ''', (user_email,))
        user_role = cursor_users.fetchone()

        if not user_role:
            return jsonify({"msg": "Роль пользователя не найдена"}), 404
        
        role = user_role[0]  # Извлекаем роль из кортежа

        response_data = {
            'project': project_data,
            'team_members': members_list,
            'user_role': role
        }

        return jsonify(response_data), 200

    except Exception as e:
        print(e)
        return jsonify({"msg": "Ошибка при получении данных"}), 500
    finally:
        cursor_projects.close()
        cursor_team_members.close()
        cursor_users.close()
        db_projects.close()
        db_team_members.close()
        db_users.close()

@app.route('/api/get-answers', methods=['GET'])
@jwt_required()
def get_answers():
    try:
        team_id = request.args.get("team_id")

        if not team_id:
            return jsonify({"error": "Team ID is required"}), 400

        db = get_db_projects()
        cursor = db.cursor()

        # Получаем сохраненные ответы
        cursor.execute("SELECT answers FROM Projects WHERE id = ?", (team_id,))
        row = cursor.fetchone()

        if row is None:
            return jsonify({"error": "Project not found"}), 404

        answers = json.loads(row[0]) if row and row[0] else {}
        
        return jsonify({"answers": answers}), 200

    except Exception as e:
        print(traceback.format_exc())
        return jsonify({"error": str(e)}), 500

    finally:
        cursor.close()
        db.close()

@app.route('/api/save-answers', methods=['POST'])
@jwt_required()
def save_answers():
    try:
        db = get_db_projects()
        cursor = db.cursor()

        data = request.get_json()
        if not data:
            return jsonify({"error": "Неверный формат запроса"}), 400

        team_id = data.get("team_id")  # <--- взять из JSON
        answers = data.get("answers")

        if not team_id or answers is None:
            return jsonify({"error": "Недостаточно данных"}), 400

        cursor.execute("SELECT answers FROM Projects WHERE id = ?", (team_id,))
        row = cursor.fetchone()
        existing_answers = json.loads(row[0]) if row and row[0] else {}

        for section, section_answers in answers.items():
            if section not in existing_answers:
                existing_answers[section] = {}
            existing_answers[section].update(section_answers)

        cursor.execute(
            "UPDATE Projects SET answers = ? WHERE id = ?",
            (json.dumps(existing_answers, ensure_ascii=False), team_id)
        )
        db.commit()

        return jsonify({"message": "Данные сохранены"}), 200

    except Exception as e:
        db.rollback()
        print(traceback.format_exc())
        return jsonify({"error": str(e)}), 500

    finally:
        cursor.close()
        db.close()


# Добавление изображения к проекту
@app.route('/api/upload-file', methods=['POST'])
@jwt_required()
def add_project_image():
    team_id = request.form.get('team_id')
    created_by = get_jwt_identity()

    if not team_id:
        return jsonify({"msg": "team_id обязателен"}), 400

    if 'file' not in request.files:
        return jsonify({"msg": "Файл не найден"}), 400

    file = request.files['file']

    if file.filename == '':
        return jsonify({"msg": "Файл не выбран"}), 400

    if file and allowed_file_projects(file.filename):
        ext = os.path.splitext(file.filename)[1]
        new_filename = f"{uuid.uuid4().hex}{ext}"
        filepath = os.path.join(UPLOAD_FOLDER_PROJECTS, new_filename)
        file.save(filepath)

        file_url = f'/uploads/project_files/{new_filename}'

        print(f"Файл сохранён по пути: {filepath}")
        print(f"URL файла: {file_url}")

        db = get_db(DATABASE_PROJECTS)
        cursor = db.cursor()

        try:
            # Загружаем текущие answers
            cursor.execute("SELECT answers FROM Projects WHERE id = ?", (team_id,))
            row = cursor.fetchone()
            answers = json.loads(row[0]) if row and row[0] else {}

            # Обновляем поле thirdMassive["1."]
            if 'thirdMassive' not in answers:
                answers['thirdMassive'] = {}

            answers['thirdMassive']['1.'] = {
                "filename": file.filename,
                "path": file_url
            }

            print("answers перед обновлением:", json.dumps(answers, ensure_ascii=False, indent=2))

            # Сохраняем обратно в БД
            cursor.execute(
                'UPDATE Projects SET answers = ? WHERE id = ?',
                (json.dumps(answers, ensure_ascii=False), team_id)
            )
            db.commit()

            # ✅ Возвращаем ожидаемую фронтом структуру
            return jsonify({
                "filename": file.filename,
                "data": {
                    "file_url": file_url
                }
            }), 200

        except Exception as e:
            db.rollback()
            print("Ошибка при сохранении:", e)
            return jsonify({"msg": "Ошибка при обновлении проекта"}), 500
        finally:
            cursor.close()
    else:
        return jsonify({"msg": "Недопустимый формат файла"}), 400

@app.route('/api/set-project-status', methods=['POST'])
@jwt_required()
def set_project_status():
    try:
        db = get_db_projects()
        cursor = db.cursor()
        data = request.get_json()
        team_id = data.get("team_id")
        status = data.get("status")

        if not team_id or not status:
            return jsonify({"error": "team_id and status are required"}), 400

        cursor.execute("UPDATE Projects SET status = ? WHERE id = ?", (status, team_id))
        db.commit()

        return jsonify({"message": "Статус успешно обновлен"}), 200
    except Exception as e:
        db.rollback()
        return jsonify({"error": str(e)}), 500
    finally:
        cursor.close()
        db.close()

@app.route('/api/projects/<int:project_id>', methods=['PUT'])
@cross_origin()
def update_project_description(project_id):
    data = request.get_json()
    new_description = data.get('description')
    new_status = data.get('status')

    # if new_description is None:
    #     return jsonify({"error": "Missing 'description'"}), 400

    # if new_status is None:
    #     return jsonify({"error": "Missing 'status'"}), 400

    db = get_db(DATABASE_PROJECTS)
    cursor = db.cursor()
    
    try:
        # Получаем campaign_id проекта
        cursor.execute("SELECT campaign_id FROM projects WHERE id = ?", (project_id,))
        result = cursor.fetchone()

        if not result:
            return jsonify({"error": "Project not found"}), 404

        campaign_id = result[0]

        if new_description == 'yes':
            # Сброс всех остальных description
            cursor.execute("""
                UPDATE projects
                SET description = 'no'
                WHERE campaign_id = ? AND id != ?
            """, (campaign_id, project_id))

        cursor.execute("UPDATE projects SET description = ? WHERE id = ?", (new_description, project_id))

        if new_status is not None:
            cursor.execute("UPDATE projects SET status = ? WHERE id = ?", (new_status, project_id))

        db.commit()
        return jsonify({"message": "Project updated successfully"}), 200

    except Exception as e:
        db.rollback()
        return jsonify({"error": str(e)}), 500

    finally:
        cursor.close()
        db.close()

@app.route('/api/projects/<int:team_id>', methods=['GET'])
@cross_origin()
def get_public_project(team_id):
    db_projects = get_db_projects()
    db_team_members = get_db_team_members()
    db_users = get_db_users()

    cursor_projects = db_projects.cursor()
    cursor_team_members = db_team_members.cursor()
    cursor_users = db_users.cursor()

    try:
        # Извлекаем детали проекта по team_id
        cursor_projects.execute('''
            SELECT id, project_code, title, description, campaign_id, team_id, answers, status, file, file_design
            FROM Projects 
            WHERE team_id = ?
        ''', (team_id,))
        project = cursor_projects.fetchone()

        if project:
            project_data = {
                'id': project[0],
                'project_code': project[1],
                'title': project[2],
                'description': project[3],
                'campaign_id': project[4],
                'team_id': project[5],
                'answers': project[6],
                'status': project[7],
                # 👇 добавляем файл проекта
                'file': None,
                'file_design': None,
            }

            # Если файл есть, формируем url
            filename = project[8]
            if filename:
                project_data['file'] = {
                    'filename': filename,
                    'file_url': f"http://127.0.0.1:5000/uploads/project_files/{filename}"
                }

                        # Если файл есть, формируем url
            filename_design = project[9]
            if filename_design:
                project_data['file_design'] = {
                    'filename_design': filename_design,
                    'file_url': f"http://127.0.0.1:5000/uploads/project_files_design/{filename_design}"
            }

        else:
            return jsonify({"msg": "Проект не найден"}), 404

        # Извлекаем участников команды
        cursor_team_members.execute('''
            SELECT name, surname, user_id FROM Team_Members 
            WHERE team_id = ?
        ''', (team_id,))
        team_members = cursor_team_members.fetchall()

        members_list = []
        for member in team_members:
            name, surname, email = member
            cursor_users.execute('SELECT role FROM Users WHERE email = ?', (email,))
            user_role = cursor_users.fetchone()
            role = user_role[0] if user_role else "unknown"
            members_list.append({
                "name": name,
                "surname": surname,
                "role": role
            })

        response_data = {
            'project': project_data,
            'team_members': members_list,
        }

        return jsonify(response_data), 200

    except Exception as e:
        print(e)
        return jsonify({"msg": "Ошибка при получении данных"}), 500
    finally:
        cursor_projects.close()
        cursor_team_members.close()
        cursor_users.close()
        db_projects.close()
        db_team_members.close()
        db_users.close()


@app.route('/api/get-public-answers', methods=['GET'])
def get_public_answers():
    try:
        team_id = request.args.get("team_id")

        if not team_id:
            return jsonify({"error": "Team ID is required"}), 400

        db = get_db_projects()
        cursor = db.cursor()

        # Получаем сохраненные ответы
        cursor.execute("SELECT answers FROM Projects WHERE id = ?", (team_id,))
        row = cursor.fetchone()

        if row is None:
            return jsonify({"error": "Project not found"}), 404

        answers = json.loads(row[0]) if row and row[0] else {}
        
        return jsonify({"answers": answers}), 200

    except Exception as e:
        print(traceback.format_exc())
        return jsonify({"error": str(e)}), 500

    finally:
        cursor.close()
        db.close()


@app.route('/api/projects/upload-design', methods=['POST'])
def upload_design_file():
    project_id = request.form.get('project_id')
    if not project_id:
        return jsonify({"msg": "Missing project_id"}), 400

    if 'file' not in request.files:
        return jsonify({"msg": "No file provided"}), 400

    file = request.files['file']
    if file.filename == '':
        return jsonify({"msg": "No selected file"}), 400

    if not allowed_file(file.filename):
        return jsonify({"msg": "File type not allowed"}), 400

    filename = secure_filename(file.filename)
    save_path = os.path.join(app.config['UPLOAD_FOLDER_PROJECTS_DESIGN'], filename)

    # Сохраняем файл
    file.save(save_path)

    # Обновляем запись в БД
    db = get_db_projects()
    cursor = db.cursor()
    try:
        # Проверяем, есть ли старый файл
        cursor.execute('SELECT file_design FROM Projects WHERE id = ?', (project_id,))
        row = cursor.fetchone()
        if row and row[0]:
            old_file = row[0]
            old_path = os.path.join(app.config['UPLOAD_FOLDER_PROJECTS_DESIGN'], old_file)
            if os.path.exists(old_path) and old_file != filename:
                os.remove(old_path)  # удаляем старый файл

        # Сохраняем новое имя файла в БД
        cursor.execute('UPDATE Projects SET file_design = ? WHERE id = ?', (filename, project_id))
        db.commit()
    finally:
        cursor.close()
        db.close()

    file_url = f"http://127.0.0.1:5000/uploads/project_files_design/{filename}"
    return jsonify({"filename": filename, "file_url": file_url}), 200

@app.route('/api/news/admin', methods=['POST'])
def create_news_admin():
    title = request.form.get('title')
    text = request.form.get('text')
    date = request.form.get('date')
    file = request.files.get('file')

    if not all([title, text, date, file]):
        return jsonify({'error': 'Все поля обязательны'}), 400

    if file.filename == '':
        return jsonify({'error': 'Файл не выбран'}), 400

    # Проверка расширения
    ext = os.path.splitext(file.filename)[1]
    if not ext:
        return jsonify({'error': 'Файл без расширения'}), 400

    # Генерация безопасного имени файла
    new_filename = f"{uuid.uuid4().hex}{ext}"
    filepath = os.path.join(app.config['UPLOAD_FOLDER_NEWS'], new_filename)

    # Убедиться, что папка существует
    os.makedirs(app.config['UPLOAD_FOLDER_NEWS'], exist_ok=True)

    # Сохраняем файл
    try:
        file.save(filepath)
    except Exception as e:
        return jsonify({'error': f'Ошибка сохранения файла: {str(e)}'}), 500

    # Сохраняем в БД
    try:
        db = get_db_news()
        cursor = db.cursor()
        cursor.execute(
            "INSERT INTO News (title, text, date, file) VALUES (?, ?, ?, ?)",
            (title, text, date, new_filename)
        )
        db.commit()
        db.close()
        return jsonify({'message': 'Новость создана'}), 201
    except Exception as e:
            print('❌ Ошибка на сервере:', str(e))
            traceback.print_exc()  # <- Вот это даст тебе конкретную трассировку ошибки
            return jsonify({'error': 'Внутренняя ошибка сервера'}), 500
    
@app.route('/api/news/<int:news_id>', methods=['GET'])
def get_news_by_id(news_id):
    db = get_db_news()
    cursor = db.cursor()
    cursor.execute("SELECT * FROM News WHERE id = ?", (news_id,))
    row = cursor.fetchone()
    if row:
        return jsonify(dict(row))
    else:
        return jsonify({'error': 'Новость не найдена'}), 404

@app.route('/api/news/<int:news_id>', methods=['PUT'])
def update_news(news_id):
    # Проверяем, какой контент пришел
    if request.content_type and request.content_type.startswith("multipart/form-data"):
        # Обновление файла и полей
        title = request.form.get('title')
        text = request.form.get('text')
        date = request.form.get('date')
        status = request.form.get('status')
        file = request.files.get('file')

        db = get_db_news()
        cursor = db.cursor()

        if title:
            cursor.execute("UPDATE News SET title = ? WHERE id = ?", (title, news_id))
        if text:
            cursor.execute("UPDATE News SET text = ? WHERE id = ?", (text, news_id))
        if date:
            cursor.execute("UPDATE News SET date = ? WHERE id = ?", (date, news_id))
        if status:
            cursor.execute("UPDATE News SET status = ? WHERE id = ?", (status, news_id))

        if file:
            ext = os.path.splitext(file.filename)[1]
            new_filename = f"{uuid.uuid4().hex}{ext}"
            filepath = os.path.join(app.config['UPLOAD_FOLDER_NEWS'], new_filename)
            os.makedirs(app.config['UPLOAD_FOLDER_NEWS'], exist_ok=True)
            file.save(filepath)

            cursor.execute("UPDATE News SET file = ? WHERE id = ?", (new_filename, news_id))

        db.commit()
        db.close()
        return jsonify({"message": "Новость обновлена с файлом"}), 200
    else:
        data = request.get_json()
        new_status = data.get('status')
        new_text = data.get('text')
        new_title = data.get('title')
        new_date = data.get('date')

        db = get_db_news()
        cursor = db.cursor()

        if new_status is not None:
            cursor.execute("UPDATE News SET status = ? WHERE id = ?", (new_status, news_id))
        
        if new_text is not None:
            cursor.execute("UPDATE News SET text = ? WHERE id = ?", (new_text, news_id))

        if new_title is not None:
            cursor.execute("UPDATE News SET title = ? WHERE id = ?", (new_title, news_id))

        if new_date is not None:
            cursor.execute("UPDATE News SET date = ? WHERE id = ?", (new_date, news_id))

        db.commit()
        return jsonify({"message": "Новость обновлена успешно"})
        
def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

# Обслуживание загрузки изображений
@app.route('/backend/uploads/<filename>')
def uploaded_file(filename):
    return send_from_directory(app.config['UPLOAD_FOLDER'], filename)

@app.route('/uploads/<filename>')
def new_uploaded_file(filename):
    return send_from_directory(app.config['UPLOAD_FOLDER'], filename)

def generate_unique_code(db, length=6):
    while True:
        code = ''.join(random.choices('0123456789', k=length))
        cursor = db.cursor()
        cursor.execute('SELECT COUNT(*) FROM Projects WHERE project_code = ?', (code,))
        if cursor.fetchone()[0] == 0:  # Код уникален
            return code
        
@app.route('/api/winners', methods=['GET'])
def get_winners():
    users = fetch_users()
    campaigns = fetch_campaigns()
    teams = fetch_teams()
    members = fetch_team_members()
    projects = fetch_projects()

    winners = []

    for p in projects:
        if p['description'] != 'yes':
            continue  # только победители
        print(f"\n=== Обрабатываем проект: {p['title']} (id={p['id']}) ===")

        campaign = next((c for c in campaigns if c['id'] == p['campaign_id']), None)
        team = next((t for t in teams if t['id'] == p['team_id']), None)
        if not campaign:
            print(f"❌ Кампания с id={p['campaign_id']} не найдена")
            continue
        if not team:
            print(f"❌ Команда с id={p['team_id']} не найдена")
            continue
        print(f"Кампания: {campaign['title']}, Команда: {team['name']}")

        # участники команды
        team_members = [m for m in members if m['team_id'] == team['id']]
        print(f"Участники команды: {[m['name'] + ' ' + m['surname'] for m in team_members]}")

        members_list = [f"{m['name']} {m['surname']}" for m in team_members]

        # ищем наставника среди участников команды
        mentor_user = None
        for m in team_members:
            user = next((u for u in users if u['email'] == m['user_id']), None)
            if not user:
                print(f"⚠ Пользователь с email={m['user_id']} не найден в users")
                continue
            print(f"Проверяем пользователя {user['name']} {user['surname']} с ролью {user.get('role')}")
            if user.get('role') == 'наставник':
                mentor_user = user
                print(f"✅ Найден наставник: {user['name']} {user['surname']}, регион: {user['region']}")
                break

        if not mentor_user:
            print("⚠ Наставник не найден, используем 'Неизвестно'")

        winners.append({
            "project_id": p['id'],  
            "campaign_id": campaign['id'],
            "campaign_title": campaign['title'],
            "team_name": team['name'],
            "region": mentor_user['region'] if mentor_user else "Неизвестно",
            "members": members_list,
            "project_file": p['file'],
            "project_design": p['file_design']
        })

    print(f"\nВсего победителей: {len(winners)}")
    return jsonify(winners)

        
# Маршрут для статики
@app.route('/<path:filename>')
def serve_static(filename):
    return send_from_directory('dist', filename)

# Маршрут для всех остальных запросов
@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def catch_all(path):
    return send_from_directory(app.static_folder, 'index.html')

# Настройка логирования
logging.basicConfig(
    level=logging.INFO,          # INFO, DEBUG, ERROR — уровень логов
    stream=sys.stdout,           # вывод в stdout, чтобы systemd видел
    format='[%(asctime)s] %(levelname)s in %(module)s: %(message)s'
)

# Логирование ошибок Flask
@app.errorhandler(Exception)
def handle_exception(e):
    app.logger.error("Unhandled Exception", exc_info=e)
    return {"error": str(e)}, 500

if __name__ == '__main__':
    init_db()  # Инициализируем базу данных
    # app.run(port="5000", debug=True)
    # socketio.run(app, host="0.0.0.0", port=5001, debug=True)