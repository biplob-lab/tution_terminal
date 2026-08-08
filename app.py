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