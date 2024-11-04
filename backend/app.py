from flask import Flask, request, jsonify, g, make_response, send_from_directory
from flask_cors import CORS, cross_origin
import requests
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity
from datetime import timedelta
import sqlite3
import bcrypt
from database import init_db
from werkzeug.utils import secure_filename
import os
import random
from admin import fetch_users, fetch_campaigns, fetch_projects, close_connection

app = Flask(__name__)

app = Flask(__name__)
app.config['JWT_SECRET_KEY'] = 'your_jwt_secret_key'
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(minutes=1000)  # Устанавливаем время жизни токена
jwt = JWTManager(app)
# CORS(app, resources={r"/*": {"origins": "http://localhost:3000"}})
CORS(app, resources={r"/*": {"origins": "*"}})


# Папка для загрузки изображений
# UPLOAD_FOLDER = 'uploads'
# app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

# Получаем абсолютный путь к папке backend
BASE_DIR = os.path.abspath(os.path.dirname(__file__))

# Папка для загрузки изображений
UPLOAD_FOLDER = os.path.join(BASE_DIR, 'uploads')
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

# Разрешенные расширения файлов для изображений
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif'}

DATABASE_USERS = 'data/users.db'
DATABASE_CAMPAIGNS = 'data/campaigns.db'
DATABASE_TEAMS = 'data/teams.db'
DATABASE_PROJECTS = 'data/projects.db'
DATABASE_TEAM_MEMBERS = 'data/team_members.db'

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
@app.route('/api/admin_campaigns', methods=['GET'])
def get_admin_campaigns():
    campaigns = fetch_campaigns()
    return jsonify(campaigns)

# Эндпоинт для получения проектов
@app.route('/api/projects', methods=['GET'])
def get_projects():
    projects = fetch_projects()
    return jsonify(projects)

@app.teardown_appcontext
def close_connection(exception):
    db = getattr(g, '_database', None)
    if db is not None:
        db.close()

@app.route('/api/projects/<int:project_id>', methods=['PUT'])
def update_project(project_id):
    data = request.get_json()
    title = data.get('title')

    db = get_db(DATABASE_PROJECTS)
    cursor = db.cursor()

    if title:
        cursor.execute("UPDATE Projects SET title = ? WHERE id = ?", (title, project_id))

    db.commit()
    return jsonify({"message": "Project updated successfully"}), 200

@app.route('/api/campaigns/<int:campaign_id>', methods=['PUT'])
def update_campaign(campaign_id):
    data = request.get_json()
    title = data.get('title')  # Добавлено поле title
    status = data.get('approval_status')

    db = get_db(DATABASE_CAMPAIGNS)
    cursor = db.cursor()

    if title:  # Если title присутствует, обновляем его
        cursor.execute("UPDATE Campaigns SET title = ? WHERE id = ?", (title, campaign_id))

    if status:  # Обновление статуса
        cursor.execute("UPDATE Campaigns SET approval_status = ? WHERE id = ?", (status, campaign_id))

    db.commit()
    return jsonify({"message": "Campaign updated successfully"}), 200

@app.route('/api/users/<int:user_id>', methods=['PUT'])
def update_user(user_id):
    data = request.get_json()
    role = data.get('role')

    db = get_db(DATABASE_USERS)
    cursor = db.cursor()

    if role:
        cursor.execute("UPDATE Users SET role = ? WHERE id = ?", (role, user_id))

    db.commit()
    return jsonify({"message": "User updated successfully"}), 200

# Функция для проверки разрешенного расширения файла
def allowed_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

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
    if 'file' not in request.files:
        return jsonify({'error': 'No file part'}), 400

    file = request.files['file']

    try:
        # Получение ссылки для загрузки на Яндекс.Диск
        get_upload_link_response = requests.get(
            'https://cloud-api.yandex.net/v1/disk/resources/upload',
            params={'path': f'disk:/{file.filename}'},
            headers={'Authorization': f'OAuth {YANDEX_DISK_OAUTH_TOKEN}'}
        )
        print('Запрос на получение ссылки для загрузки файла:', get_upload_link_response.url)
        print('Статус код:', get_upload_link_response.status_code)
        print('Тело ответа:', get_upload_link_response.text)

        # Проверяем успешность запроса на получение ссылки
        if get_upload_link_response.status_code != 200:
            return jsonify({'error': 'Failed to get upload link'}), get_upload_link_response.status_code
        
        upload_url = get_upload_link_response.json().get('href')
        print('Ссылка для загрузки файла:', upload_url) 
        # Загрузка файла на Яндекс.Диск
        upload_response = requests.put(upload_url, files={'file': file.stream}, headers={'Authorization': f'OAuth {YANDEX_DISK_OAUTH_TOKEN}'})
        print('Статус код загрузки файла:', upload_response.status_code)
        print('Тело ответа загрузки:', upload_response.text)
        upload_response.raise_for_status()

        return jsonify({'message': 'Файл успешно загружен'})

    except requests.RequestException as e:
        print(e)  # Вывод ошибки в консоль для отладки
        return jsonify({'error': 'Internal Server Error'}), 500
    
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

        try:
            db = sqlite3.connect(DATABASE_USERS)
            cursor = db.cursor()
            cursor.execute('''
                UPDATE Users
                SET name = ?, surname = ?, region = ?, locality = ?, school = ?, role = ?
                WHERE email = ?
            ''', (name, surname, region, locality, school, role, current_user_email))
            db.commit()
            return jsonify({"msg": "User data updated successfully"}), 200
        except Exception as e:
            print(e)
            return jsonify({"msg": "Error updating user data"}), 500
        finally:
            cursor.close()
            db.close()

# Добавление акции с изображением
@app.route('/campaigns', methods=['POST'])
@jwt_required()
def add_campaign():
    title = request.form.get('title')
    description = request.form.get('description')
    start_date = request.form.get('start_date')
    end_date = request.form.get('end_date')
    created_by = get_jwt_identity()

    # Логирование данных запроса
    print('Request Data:', {
        'title': title,
        'description': description,
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
        filename = secure_filename(image.filename)
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        image.save(filepath)

        db = get_db(DATABASE_CAMPAIGNS)
        cursor = db.cursor()

        try:
            cursor.execute('INSERT INTO Campaigns (title, description, start_date, end_date, created_by, image_path) VALUES (?, ?, ?, ?, ?, ?)',
                           (title, description, start_date, end_date, created_by, filepath))
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
            SELECT id, title, description, start_date, end_date, image_path, approval_status 
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
    except Exception as e:
        print("Error in fetching campaigns:", e)  # Логируем ошибку
        return jsonify({"msg": "Error fetching campaigns"}), 500
    finally:
        cursor_team_members.close()
        cursor_campaigns.close()
        cursor_users.close()
        db_team_members.close()
        db_campaigns.close()
        db_users.close()
        db.close()  # Закрываем соединение с базой данных

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
        db_teams.commit()
        db_projects.commit()
        db_team_members.commit()
        
        return jsonify({"msg": "Team created successfully"}), 201
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

        return jsonify({"msg": "User joined team successfully"}), 200
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
            SELECT id, title, description, campaign_id 
            FROM Projects 
            WHERE team_id = ?
        ''', (team_id,))
        project = cursor_projects.fetchone()

        if project:
            project_data = {
                'id': project[0],
                'title': project[1],
                'description': project[2],
                'campaign_id': project[3]
            }
        else:
            return jsonify({"msg": "Проект не найден"}), 404

        # Извлекаем участников команды по team_id, включая name и surname
        cursor_team_members.execute('''
            SELECT name, surname FROM Team_Members 
            WHERE team_id = ?
        ''', (team_id,))
        team_members = cursor_team_members.fetchall()

        # Создаем список участников с именем и фамилией
        members_list = [{"name": member[0], "surname": member[1]} for member in team_members] if team_members else []

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


# Обслуживание загрузки изображений
@app.route('/backend/uploads/<filename>')
def uploaded_file(filename):
    return send_from_directory(app.config['UPLOAD_FOLDER'], filename)

def generate_unique_code(db, length=6):
    while True:
        code = ''.join(random.choices('0123456789', k=length))
        cursor = db.cursor()
        cursor.execute('SELECT COUNT(*) FROM Projects WHERE project_code = ?', (code,))
        if cursor.fetchone()[0] == 0:  # Код уникален
            return code
        
# Маршрут для статики
@app.route('/<path:filename>')
def serve_static(filename):
    return send_from_directory('dist', filename)

# Маршрут для всех остальных запросов
@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def catch_all(path):
    return send_from_directory(app.static_folder, 'index.html')

if __name__ == '__main__':
    init_db()  # Инициализируем базу данных
    app.run(port="5000", debug=True)