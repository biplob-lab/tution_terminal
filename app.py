from flask import Flask, render_template, jsonify, request

app = Flask(__name__)

# Mock Data Storage
tutor_profile = {
    "name": "Biplob Mojumder",
    "headline": "Full-Stack Web Developer & Private Tutor",
    "rating": 4.9,
    "reviews": 24,
    "bio": "Experienced tutor specializing in Computer Science, Mathematics, and Web Technologies with 3+ years of teaching experience.",
    "subjects": ["Python", "JavaScript", "HTML/CSS", "Data Structures"],
    "students_taught": 35,
    "hours_taught": 420,
    "hourly_rate": 20
}
jobs_list = [
    {
        "id": 1,
        "subject": "Python & Data Structures",
        "level": "University",
        "mode": "Online",
        "location": "Dhaka",
        "frequency": "3 days/week",
        "posted": "2 days ago",
        "description": "Looking for an experienced Python tutor for university level Data Structures and Algorithms.",
        "rate": 25,
        "applied": False
    },
    {
        "id": 2,
        "subject": "Web Development (HTML/CSS/JS)",
        "level": "College",
        "mode": "In-Person",
        "location": "Bashundhara R/A, Dhaka",
        "frequency": "2 days/week",
        "posted": "1 day ago",
        "description": "Need a tutor to teach front-end web development basics and responsive design.",
        "rate": 20,
        "applied": False
    },
    {
        "id": 2,
        "subject": "Web Development (HTML/CSS/JS)",
        "level": "College",
        "mode": "In-Person",
        "location": "Bashundhara R/A, Dhaka",
        "frequency": "2 days/week",
        "posted": "1 day ago",
        "description": "Need a tutor to teach front-end web development basics and responsive design.",
        "rate": 20,
        "applied": False
    },
    {
        "id": 3,
        "subject": "Higher Mathematics",
        "level": "HSC",
        "mode": "In-Person",
        "location": "Uttara, Dhaka",
        "frequency": "4 days/week",
        "posted": "3 days ago",
        "description": "HSC Examinee needs intensive guidance for Higher Mathematics syllabus.",
        "rate": 18,
        "applied": False
    }
]
applications_list = []

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/tutor', methods=['GET'])
def get_tutor():
    return jsonify(tutor_profile)

@app.route('/api/jobs', methods=['GET'])
def get_jobs():
    return jsonify(jobs_list)

@app.route('/api/applications', methods=['GET', 'POST'])
def handle_applications():
    if request.method == 'POST':
        data = request.get_json()
        job_id = data.get('job_id')
        
        for job in jobs_list:
            if job['id'] == job_id and not job['applied']:
                job['applied'] = True
                applications_list.append({
                    "id": len(applications_list) + 1,
                    "subject": job['subject'],
                    "level": job['level'],
                    "rate": job['rate'],
                    "applied": "Just now",
                    "status": "pending"
                })
                break
        return jsonify({"success": True})
    
    return jsonify(applications_list)

@app.route('/api/stats', methods=['GET'])
def get_stats():
    total_apps = len(applications_list)
    accepted_apps = sum(1 for a in applications_list if a['status'] == 'accepted')
    pending_apps = sum(1 for a in applications_list if a['status'] == 'pending')
    rejected_apps = sum(1 for a in applications_list if a['status'] == 'rejected')
    
    acceptance_rate = round((accepted_apps / total_apps * 100), 1) if total_apps > 0 else 0

    return jsonify({
        "open_jobs": len(jobs_list),
        "total_applications": total_apps,
        "acceptance_rate": acceptance_rate,
        "status_counts": {
            "pending": pending_apps,
            "accepted": accepted_apps,
            "rejected": rejected_apps
        },
        "applications_timeline": [
            {"date": "2026-08-01", "count": 1},
            {"date": "2026-08-03", "count": 2},
            {"date": "2026-08-06", "count": 4},
            {"date": "2026-08-09", "count": total_apps}
        ]
    })

if __name__ == '__main__':
    app.run(debug=True, port=5000)