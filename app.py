import sqlite3
import random
from flask import Flask, render_template, request, jsonify, g, session

app = Flask(__name__)
app.secret_key = 'tuition_terminal_secret_key_2026' # Session Enable
DATABASE = 'tuition_terminal.db'

def get_db():
    db = getattr(g, '_database', None)
    if db is None:
        db = g._database = sqlite3.connect(DATABASE)
        db.row_factory = sqlite3.Row
    return db

@app.teardown_appcontext
def close_connection(exception):
    db = getattr(g, '_database', None)
    if db is not None:
        db.close()

def init_db():
    with app.app_context():
        db = get_db()
        cursor = db.cursor()
        
        # 1. Users Table with Password
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                custom_id TEXT UNIQUE,
                name TEXT NOT NULL,
                email TEXT UNIQUE,
                phone TEXT UNIQUE,
                password TEXT DEFAULT '123456',
                role TEXT NOT NULL,
                profile_completion INTEGER DEFAULT 50,
                father_name TEXT,
                mother_name TEXT,
                emergency_contact TEXT,
                father_phone TEXT,
                mother_phone TEXT,
                emergency_phone TEXT,
                tutoring_experience TEXT,
                tutoring_method TEXT,
                availability_days TEXT,
                availability_time TEXT,
                expected_salary INTEGER,
                country TEXT,
                city TEXT,
                location TEXT,
                resume_file TEXT,
                is_verified INTEGER DEFAULT 0
            )
        ''')
        
        # 2. Tuition Jobs Table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS tuition_jobs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                job_id TEXT UNIQUE,
                guardian_id INTEGER,
                title TEXT NOT NULL,
                class_level TEXT,
                subjects TEXT,
                per_week TEXT,
                tutoring_mode TEXT,
                salary INTEGER,
                tutor_gender TEXT,
                tutoring_time TEXT,
                city TEXT,
                location TEXT,
                posted_date TEXT,
                status TEXT DEFAULT 'Available',
                FOREIGN KEY(guardian_id) REFERENCES users(id)
            )
        ''')

        # 3. Applications Table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS applications (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                job_id INTEGER,
                tutor_id INTEGER,
                status TEXT DEFAULT 'Applied',
                applied_date DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY(job_id) REFERENCES tuition_jobs(id),
                FOREIGN KEY(tutor_id) REFERENCES users(id)
            )
        ''')

        # Seed Default Users if Empty
        cursor.execute("SELECT COUNT(*) FROM users")
        if cursor.fetchone()[0] == 0:
            # Seed Tutor (Biplob M.)
            cursor.execute("""
                INSERT INTO users (custom_id, name, email, phone, password, role, profile_completion, 
                father_name, mother_name, emergency_contact, father_phone, mother_phone, emergency_phone,
                tutoring_experience, tutoring_method, availability_days, availability_time, expected_salary, 
                country, city, location, is_verified) 
                VALUES ('A67896A', 'Biplob M.', 'biplob@gmail.com', '01817583307', '123456', 'tutor', 90,
                'Parimal Mojumder', 'Kakali Rani Shil', 'Badhan Mojumder', '01817583307', '01622943474', '01795165790',
                '3 Year(s)', 'Home Tutoring', 'Saturday, Sunday, Monday, Tuesday, Wednesday, Thursday, Friday', 
                '05:30 AM To 09:30 PM', 4500, 'Bangladesh', 'Dhaka', 'Bashundhara R/A', 1)
            """)
            
            # Seed Guardian (Biplob Parent)
            cursor.execute("""
                INSERT INTO users (custom_id, name, email, phone, password, role, profile_completion) 
                VALUES ('P35167A', 'Biplob (Guardian)', 'guardian@gmail.com', '01700000000', '123456', 'guardian', 50)
            """)

            # Seed Real Jobs
            jobs_seed = [
                ('81000', 2, 'Standard 1', 'Standard 1', 'All', '5 days', 'Home Tutoring', 4000, 'Female', '4:00 PM', 'Dhaka', 'Uttara Sector 4', '09 Aug 2026'),
                ('80999', 2, 'Standard 4', 'Standard 4', 'All', '5 days', 'Home Tutoring', 4000, 'Female', '4:00 PM', 'Dhaka', 'Vatara', '09 Aug 2026'),
                ('80998', 2, 'Class 6', 'Class 6', 'Math & Science', '4 days', 'Home Tutoring', 5000, 'Male', '5:00 PM', 'Dhaka', 'Khilkhet', '09 Aug 2026'),
                ('80997', 2, 'Standard 3', 'Standard 3', 'English Version', '5 days', 'Home Tutoring', 4500, 'Any', '6:00 PM', 'Dhaka', 'Shewrapara', '09 Aug 2026')
            ]
            for j in jobs_seed:
                cursor.execute("""
                    INSERT INTO tuition_jobs (job_id, guardian_id, title, class_level, subjects, per_week, tutoring_mode, salary, tutor_gender, tutoring_time, city, location, posted_date)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, j)

        db.commit()

# --- AUTHENTICATION & SESSION ROUTES ---

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/auth/me', methods=['GET'])
def get_current_user():
    if 'user_id' in session:
        db = get_db()
        user = db.execute("SELECT id, custom_id, name, email, phone, role FROM users WHERE id = ?", (session['user_id'],)).fetchone()
        if user:
            return jsonify({"logged_in": True, "user": dict(user)})
    return jsonify({"logged_in": False})

@app.route('/api/auth/login', methods=['POST'])
def login():
    data = request.json
    login_id = data.get('login_id', '').strip()
    password = data.get('password', '').strip()
    selected_role = data.get('role', 'tutor')

    db = get_db()
    user = db.execute(
        "SELECT * FROM users WHERE (email = ? OR phone = ?) AND role = ?", 
        (login_id, login_id, selected_role)
    ).fetchone()

    if user and user['password'] == password:
        session['user_id'] = user['id']
        session['role'] = user['role']
        return jsonify({"success": True, "user": dict(user)})
    else:
        return jsonify({"success": False, "message": "Invalid Phone/Email, Password or Role selection!"})

@app.route('/api/auth/register', methods=['POST'])
def register():
    data = request.json
    name = data.get('name')
    email = data.get('email')
    phone = data.get('phone')
    password = data.get('password')
    role = data.get('role', 'tutor')
    custom_id = ('A' if role == 'tutor' else 'P') + str(random.randint(10000, 99999)) + 'A'

    db = get_db()
    try:
        db.execute("""
            INSERT INTO users (custom_id, name, email, phone, password, role)
            VALUES (?, ?, ?, ?, ?, ?)
        """, (custom_id, name, email, phone, password, role))
        db.commit()
        
        # Auto Login after registration
        new_user = db.execute("SELECT * FROM users WHERE email = ?", (email,)).fetchone()
        session['user_id'] = new_user['id']
        session['role'] = new_user['role']
        return jsonify({"success": True, "user": dict(new_user)})
    except Exception as e:
        return jsonify({"success": False, "message": "Email or Phone already registered!"})

@app.route('/api/auth/logout', methods=['POST'])
def logout():
    session.clear()
    return jsonify({"success": True})

# --- DATA ROUTES ---

@app.route('/api/tutor/dashboard/<int:tutor_id>', methods=['GET'])
def tutor_dashboard(tutor_id):
    db = get_db()
    user = db.execute("SELECT * FROM users WHERE id = ?", (tutor_id,)).fetchone()
    applied = db.execute("SELECT COUNT(*) FROM applications WHERE tutor_id = ? AND status = 'Applied'", (tutor_id,)).fetchone()[0]
    
    return jsonify({
        "user": dict(user),
        "metrics": {
            "applied": applied + 9,
            "shortlisted": 2,
            "appointed": 2,
            "confirmed": 1,
            "payment": 1,
            "canceled": 1
        }
    })

@app.route('/api/user/profile/<int:user_id>', methods=['GET'])
def get_profile(user_id):
    db = get_db()
    user = db.execute("SELECT * FROM users WHERE id = ?", (user_id,)).fetchone()
    return jsonify(dict(user))

@app.route('/api/tuition-jobs', methods=['GET'])
def get_tuition_jobs():
    city = request.args.get('city', 'All')
    job_id = request.args.get('job_id', '').strip()
    db = get_db()
    query = "SELECT * FROM tuition_jobs WHERE status = 'Available'"
    params = []

    if city != 'All' and city != '':
        query += " AND city = ?"
        params.append(city)
    if job_id:
        query += " AND job_id LIKE ?"
        params.append(f'%{job_id}%')

    query += " ORDER BY id DESC"
    jobs = db.execute(query, params).fetchall()
    return jsonify([dict(j) for j in jobs])

if __name__ == '__main__':
    init_db()
    app.run(debug=True, port=5000)