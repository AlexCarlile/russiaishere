import sqlite3
from flask import g

DATABASE_USERS = 'data/users.db'
DATABASE_CAMPAIGNS = 'data/campaigns.db'
DATABASE_PROJECTS = 'data/projects.db'

# Подключение к базе данных пользователей
def get_db_users():
    db = getattr(g, '_database_users', None)
    if db is None:
        db = g._database_users = sqlite3.connect(DATABASE_USERS)
    return db

# Подключение к базе данных акций
def get_db_campaigns():
    db = getattr(g, '_database_campaigns', None)
    if db is None:
        db = g._database_campaigns = sqlite3.connect(DATABASE_CAMPAIGNS)
    return db

# Подключение к базе данных проектов
def get_db_projects():
    db = getattr(g, '_database_projects', None)
    if db is None:
        db = g._database_projects = sqlite3.connect(DATABASE_PROJECTS)
    return db

# Закрытие соединения с базой данных
def close_connection(exception):
    db_users = getattr(g, '_database_users', None)
    if db_users is not None:
        db_users.close()

    db_campaigns = getattr(g, '_database_campaigns', None)
    if db_campaigns is not None:
        db_campaigns.close()

    db_projects = getattr(g, '_database_projects', None)
    if db_projects is not None:
        db_projects.close()

# Эндпоинт для получения пользователей
def fetch_users():
    db = get_db_users()
    cursor = db.cursor()
    cursor.execute("SELECT * FROM Users")
    users = cursor.fetchall()
    return [{'id': row[0], 'email': row[1], 'password': row[2].decode('utf-8') if isinstance(row[2], bytes) else row[2], 'name': row[3], 
             'surname': row[4], 'region': row[5], 'locality': row[6], 
             'school': row[7], 'role': row[8], 'agreement': row[9], 
             'currentDate': row[10], 'file': row[11]} for row in users]

# Эндпоинт для получения акций
def fetch_campaigns():
    db = get_db_campaigns()
    cursor = db.cursor()
    cursor.execute("SELECT * FROM Campaigns")
    campaigns = cursor.fetchall()
    return [{'id': row[0], 'title': row[1], 'description': row[2], 
             'start_date': row[3], 'end_date': row[4], 
             'created_by': row[5], 'image_path': row[6], 
             'approval_status': row[7]} for row in campaigns]

# Эндпоинт для получения проектов
def fetch_projects():
    db = get_db_projects()
    cursor = db.cursor()
    cursor.execute("SELECT * FROM Projects")
    projects = cursor.fetchall()
    return [{'id': row[0], 'project_code': row[1], 'title': row[2], 
             'description': row[3], 'campaign_id': row[4], 
             'team_id': row[5]} for row in projects]