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