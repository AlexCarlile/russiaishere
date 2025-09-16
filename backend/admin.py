import sqlite3
import os
from flask import g

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

DATABASE_USERS = os.path.join(BASE_DIR, "data", "users.db")
DATABASE_CAMPAIGNS = os.path.join(BASE_DIR, "data", "campaigns.db")
DATABASE_PROJECTS = os.path.join(BASE_DIR, "data", "projects.db")
DATABASE_TEAMS = os.path.join(BASE_DIR, "data", "teams.db")
DATABASE_TEAM_MEMBERS = os.path.join(BASE_DIR, "data", "team_members.db")
DATABASE_NEWS = os.path.join(BASE_DIR, "data", "news.db")


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

# Подключение к базе данных команд
def get_db_teams():
    db = getattr(g, '_database_teams', None)
    if db is None:
        db = g._database_teams = sqlite3.connect(DATABASE_TEAMS)
    return db

# Подключение к базе данных участников команд
def get_db_team_members():
    db = getattr(g, '_database_team_members', None)
    if db is None:
        db = g._database_team_members = sqlite3.connect(DATABASE_TEAM_MEMBERS)
    return db

# Подключение к базе данных проектов
def get_db_projects():
    db = getattr(g, '_database_projects', None)
    if db is None:
        db = g._database_projects = sqlite3.connect(DATABASE_PROJECTS)
    return db

def get_db_news():
    db = getattr(g, '_database_news', None)
    if db is None:
        db = g._database_news = sqlite3.connect(DATABASE_NEWS)
        db.row_factory = sqlite3.Row  # ← добавляем это
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
    
    db_news = getattr(g, '_database_news', None)
    if db_news is not None:
        db_news.close()

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
    db_campaigns = get_db_campaigns()
    cursor = db_campaigns.cursor()
    cursor.execute("SELECT * FROM Campaigns")
    campaigns = cursor.fetchall()

    db_teams = get_db_teams()
    team_cursor = db_teams.cursor()

    result = []
    for row in campaigns:
        campaign_id = row[0]

        # Подсчёт количества команд для каждой акции
        team_cursor.execute("SELECT COUNT(*) FROM Teams WHERE campaign_id = ?", (campaign_id,))
        team_count = team_cursor.fetchone()[0]

        result.append({
            'id': row[0],
            'title': row[1],
            'description': row[2],
            'full_description': row[3],
            'rules': row[4],
            'start_date': row[5],
            'end_date': row[6],
            'created_by': row[7],
            'image_path': row[8],
            'approval_status': row[9],
            'team_count': team_count  # ← добавляем сюда
        })

    return result

# Эндпоинт для получения команд
def fetch_teams():
    db = get_db_teams()
    cursor = db.cursor()
    cursor.execute("SELECT * FROM Teams")
    teams = cursor.fetchall()
    return [{'id': row[0], 'name': row[1], 'campaign_id': row[2], 
             'created_by': row[3]} for row in teams]

# Эндпоинт для получения участников команд
def fetch_team_members():
    db = get_db_team_members()
    cursor = db.cursor()
    cursor.execute("SELECT * FROM Team_Members")
    team_members = cursor.fetchall()
    return [{'team_id': row[0], 'user_id': row[1], 'name': row[2], 
             'surname': row[3], 'campaign_id': row[4]} for row in team_members]

# Эндпоинт для получения проектов
def fetch_projects():
    db = get_db_projects()
    cursor = db.cursor()
    cursor.execute("SELECT * FROM Projects")
    projects = cursor.fetchall()

    result = []
    for row in projects:
        row = list(row)  # на всякий случай

        result.append({
            'id': row[0],
            'project_code': row[1],
            'title': row[2],
            'description': row[3],
            'campaign_id': row[4],
            'team_id': row[5],
            'answers': row[6] if len(row) > 6 else None,
            'status': row[7] if len(row) > 7 else None,
            'file': row[8] if len(row) > 8 else None,
            'file_design': row[9] if len(row) > 9 else None,
        })

    return result

# Эндпоинт для получения команд
def fetch_news():
    db = get_db_news()
    cursor = db.cursor()
    cursor.execute("SELECT * FROM News")
    rows = cursor.fetchall()
    return [dict(row) for row in rows]

