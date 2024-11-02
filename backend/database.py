import sqlite3
import os

def create_table(db_path, create_table_sql):
    connection = sqlite3.connect(db_path)
    cursor = connection.cursor()
    cursor.execute(create_table_sql)
    connection.commit()
    connection.close()


def init_db():
    # Убедимся, что папка data существует
    os.makedirs('data', exist_ok=True)

    # Определяем путь к каждой базе данных
    db_users_path = os.path.join('data', 'users.db')
    db_campaigns_path = os.path.join('data', 'campaigns.db')
    db_projects_path = os.path.join('data', 'projects.db')
    db_teams_path = os.path.join('data', 'teams.db')
    db_team_members_path = os.path.join('data', 'team_members.db')
    
    connection = sqlite3.connect('database.db')
    cursor = connection.cursor()

    # SQL для создания таблиц
    create_users_table = '''
        CREATE TABLE IF NOT EXISTS Users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT NOT NULL UNIQUE,
            password TEXT NOT NULL,
            name TEXT NOT NULL,
            surname TEXT NOT NULL,
            region TEXT NOT NULL,
            locality TEXT NOT NULL,
            school TEXT NOT NULL,
            role TEXT NOT NULL,
            agreement TEXT NOT NULL,
            currentDate TEXT NOT NULL,
            file TEXT
        )
    '''

    create_campaigns_table = '''
        CREATE TABLE IF NOT EXISTS Campaigns (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        description TEXT,
        start_date DATE,
        end_date DATE,
        created_by INTEGER,
        image_path TEXT,
        approval_status TEXT DEFAULT 'InProcess',
        FOREIGN KEY (created_by) REFERENCES Users(id)
        )
    '''

    create_projects_table = '''
        CREATE TABLE IF NOT EXISTS Projects (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            project_code TEXT,
            title TEXT NOT NULL,
            description TEXT,
            campaign_id INTEGER,
            team_id INTEGER,
            FOREIGN KEY (campaign_id) REFERENCES Campaigns(id),
            FOREIGN KEY (team_id) REFERENCES Teams(id)
        )
    '''

    create_teams_table = '''
        CREATE TABLE IF NOT EXISTS Teams (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            campaign_id INTEGER,
            created_by INTEGER,
            FOREIGN KEY (created_by) REFERENCES Users(id)
        )
    '''

    create_team_members_table = '''
        CREATE TABLE IF NOT EXISTS Team_Members (
            team_id INTEGER,
            user_id INTEGER,
            name TEXT NOT NULL,
            surname TEXT NOT NULL,
            campaign_id INTEGER,
            FOREIGN KEY (team_id) REFERENCES Teams(id),
            FOREIGN KEY (user_id) REFERENCES Users(id),
            PRIMARY KEY (team_id, user_id)
        )
    '''
    
    # Создаем таблицы в отдельных файлах базы данных
    create_table(db_users_path, create_users_table)
    create_table(db_campaigns_path, create_campaigns_table)
    create_table(db_projects_path, create_projects_table)
    create_table(db_teams_path, create_teams_table)
    create_table(db_team_members_path, create_team_members_table)

    print("Базы данных успешно созданы в папке data")

if __name__ == '__main__':
    init_db()