from flask import Flask, render_template, request, redirect, url_for, flash
from datetime import datetime, timedelta
import sqlite3
from werkzeug.exceptions import abort

app = Flask(__name__)
app.config['SECRET_KEY'] = 'your-secret-key-here'
app.config['DATABASE'] = 'projects.db'

def get_db_connection():
    conn = sqlite3.connect(app.config['DATABASE'])
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    with app.app_context():
        conn = get_db_connection()
        conn.execute('''
            CREATE TABLE IF NOT EXISTS projects (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                creation_start TEXT NOT NULL,
                creation_weeks INTEGER NOT NULL,
                homedesign_weeks INTEGER NOT NULL,
                construction_weeks INTEGER NOT NULL,
                created TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        conn.commit()
        conn.close()

def get_project(project_id):
    conn = get_db_connection()
    project = conn.execute('SELECT * FROM projects WHERE id = ?', (project_id,)).fetchone()
    conn.close()
    if project is None:
        abort(404)
    return project

@app.route('/')
def home():
    conn = get_db_connection()
    projects = conn.execute('SELECT * FROM projects ORDER BY created DESC').fetchall()
    conn.close()
    return render_template('index.html', projects=projects)

@app.route('/create', methods=('GET', 'POST'))
def create():
    if request.method == 'POST':
        name = request.form['name']
        creation_start = request.form['creation_start']
        creation_weeks = int(request.form['creation_weeks'])
        homedesign_weeks = int(request.form['homedesign_weeks'])
        construction_weeks = int(request.form['construction_weeks'])

        if not name:
            flash('Project name is required!')
        else:
            conn = get_db_connection()
            conn.execute('INSERT INTO projects (name, creation_start, creation_weeks, homedesign_weeks, construction_weeks) VALUES (?, ?, ?, ?, ?)',
                         (name, creation_start, creation_weeks, homedesign_weeks, construction_weeks))
            conn.commit()
            conn.close()
            return redirect(url_for('home'))

    return render_template('create.html')

@app.route('/<int:id>/edit', methods=('GET', 'POST'))
def edit(id):
    project = get_project(id)
    
    if request.method == 'POST':
        name = request.form['name']
        creation_start = request.form['creation_start']
        creation_weeks = int(request.form['creation_weeks'])
        homedesign_weeks = int(request.form['homedesign_weeks'])
        construction_weeks = int(request.form['construction_weeks'])

        if not name:
            flash('Project name is required!')
        else:
            conn = get_db_connection()
            conn.execute('UPDATE projects SET name = ?, creation_start = ?, creation_weeks = ?, homedesign_weeks = ?, construction_weeks = ?'
                         ' WHERE id = ?',
                         (name, creation_start, creation_weeks, homedesign_weeks, construction_weeks, id))
            conn.commit()
            conn.close()
            return redirect(url_for('view_timeline', project_id=id))

    return render_template('edit.html', project=project)

@app.route('/<int:project_id>')
def view_timeline(project_id):
    project = get_project(project_id)
    
    # Convert string dates to datetime objects for calculations
    creation_start = datetime.strptime(project['creation_start'], '%Y-%m-%d')
    creation_end = creation_start + timedelta(weeks=project['creation_weeks'])
    homedesign_start = creation_end
    homedesign_end = homedesign_start + timedelta(weeks=project['homedesign_weeks'])
    construction_start = homedesign_end
    construction_end = construction_start + timedelta(weeks=project['construction_weeks'])
    total_weeks = project['creation_weeks'] + project['homedesign_weeks'] + project['construction_weeks']
    
    project_data = {
        'id': project['id'],  # Include the ID in the project data
        'name': project['name'],
        'creation': {
            'start': creation_start,
            'end': creation_end,
            'weeks': project['creation_weeks']
        },
        'homedesign': {
            'start': homedesign_start,
            'end': homedesign_end,
            'weeks': project['homedesign_weeks']
        },
        'construction': {
            'start': construction_start,
            'end': construction_end,
            'weeks': project['construction_weeks']
        },
        'total_weeks': total_weeks,
        'completion_date': construction_end
    }
    
    return render_template('view_timeline.html', 
                         project=project_data,
                         project_id=project['id'])  # Pass project_id separately

@app.route('/<int:id>/delete', methods=('POST',))
def delete(id):
    project = get_project(id)
    conn = get_db_connection()
    conn.execute('DELETE FROM projects WHERE id = ?', (id,))
    conn.commit()
    conn.close()
    flash(f'Project "{project["name"]}" was successfully deleted!')
    return redirect(url_for('home'))

if __name__ == '__main__':
    init_db()
    app.run(debug=True)