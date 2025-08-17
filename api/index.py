from flask import Flask, request, jsonify
from flask_cors import CORS
import requests
import json
import os
from datetime import datetime, timedelta

app = Flask(__name__)
CORS(app, 
     origins=[
         "https://vichaar-kappa.vercel.app",
         "https://vichaar-g05ubfbf0-kalki2898ads-projects.vercel.app",
         "http://localhost:3000",
         "http://localhost:3001"
     ],
     methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
     allow_headers=["Content-Type", "Authorization", "X-Requested-With"],
     supports_credentials=False)

# KMIT API configuration
KMIT_API_BASE = "https://kmit-api.teleuniv.in"

@app.route('/', methods=['GET'])
def root():
    return jsonify({
        "message": "KMIT Vichaar Backend API",
        "status": "running",
        "timestamp": datetime.now().isoformat()
    })

@app.route('/test-kmit', methods=['POST'])
def test_kmit():
    try:
        data = request.get_json()
        hall_ticket = data.get('hall_ticket')
        password = data.get('password')
        
        if not hall_ticket or not password:
            return jsonify({"error": "Hall ticket and password are required"}), 400
        
        # KMIT API login endpoint
        login_url = f"{KMIT_API_BASE}/api/login"
        
        login_data = {
            "htno": hall_ticket,
            "password": password
        }
        
        headers = {
            "Content-Type": "application/json",
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
        }
        
        response = requests.post(login_url, json=login_data, headers=headers, timeout=10)
        
        if response.status_code == 200:
            kmit_data = response.json()
            return jsonify({
                "success": True,
                "message": "KMIT API connection successful",
                "data": kmit_data
            })
        else:
            return jsonify({
                "success": False,
                "message": f"KMIT API returned status {response.status_code}",
                "error": response.text
            }), 400
            
    except requests.exceptions.Timeout:
        return jsonify({
            "success": False,
            "message": "KMIT API request timed out"
        }), 408
    except requests.exceptions.RequestException as e:
        return jsonify({
            "success": False,
            "message": f"KMIT API request failed: {str(e)}"
        }), 500
    except Exception as e:
        return jsonify({
            "success": False,
            "message": f"Server error: {str(e)}"
        }), 500

@app.route('/login-with-token', methods=['POST'])
def login_with_token():
    try:
        data = request.get_json()
        hall_ticket = data.get('hall_ticket')
        password = data.get('password')
        captcha_token = data.get('captcha_token')
        
        if not all([hall_ticket, password, captcha_token]):
            return jsonify({"error": "All fields are required"}), 400
        
        # KMIT API login with captcha
        login_url = f"{KMIT_API_BASE}/api/login"
        
        login_data = {
            "htno": hall_ticket,
            "password": password,
            "captcha": captcha_token
        }
        
        headers = {
            "Content-Type": "application/json",
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
        }
        
        response = requests.post(login_url, json=login_data, headers=headers, timeout=10)
        
        if response.status_code == 200:
            kmit_data = response.json()
            return jsonify({
                "success": True,
                "message": "Login successful",
                "data": kmit_data
            })
        else:
            return jsonify({
                "success": False,
                "message": f"Login failed: {response.text}",
                "status_code": response.status_code
            }), 400
            
    except Exception as e:
        return jsonify({
            "success": False,
            "message": f"Server error: {str(e)}"
        }), 500

@app.route('/student-profile', methods=['GET'])
def get_student_profile():
    try:
        # Get authorization header
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({"error": "Authorization header required"}), 401
        
        token = auth_header.split(' ')[1]
        
        # KMIT API profile endpoint
        profile_url = f"{KMIT_API_BASE}/api/student/profile"
        
        headers = {
            "Authorization": f"Bearer {token}",
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
        }
        
        response = requests.get(profile_url, headers=headers, timeout=10)
        
        if response.status_code == 200:
            profile_data = response.json()
            return jsonify({
                "success": True,
                "data": profile_data
            })
        else:
            return jsonify({
                "success": False,
                "message": f"Failed to fetch profile: {response.text}",
                "status_code": response.status_code
            }), 400
            
    except Exception as e:
        return jsonify({
            "success": False,
            "message": f"Server error: {str(e)}"
        }), 500

@app.route('/attendance', methods=['GET'])
def get_attendance():
    try:
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({"error": "Authorization header required"}), 401
        
        token = auth_header.split(' ')[1]
        
        # KMIT API attendance endpoint
        attendance_url = f"{KMIT_API_BASE}/api/student/attendance"
        
        headers = {
            "Authorization": f"Bearer {token}",
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
        }
        
        response = requests.get(attendance_url, headers=headers, timeout=10)
        
        if response.status_code == 200:
            attendance_data = response.json()
            return jsonify({
                "success": True,
                "data": attendance_data
            })
        else:
            return jsonify({
                "success": False,
                "message": f"Failed to fetch attendance: {response.text}",
                "status_code": response.status_code
            }), 400
            
    except Exception as e:
        return jsonify({
            "success": False,
            "message": f"Server error: {str(e)}"
        }), 500

@app.route('/subject-attendance', methods=['GET'])
def get_subject_attendance():
    try:
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({"error": "Authorization header required"}), 401
        
        token = auth_header.split(' ')[1]
        
        # KMIT API subject attendance endpoint
        subject_url = f"{KMIT_API_BASE}/api/student/subject-attendance"
        
        headers = {
            "Authorization": f"Bearer {token}",
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
        }
        
        response = requests.get(subject_url, headers=headers, timeout=10)
        
        if response.status_code == 200:
            subject_data = response.json()
            return jsonify({
                "success": True,
                "data": subject_data
            })
        else:
            return jsonify({
                "success": False,
                "message": f"Failed to fetch subject attendance: {response.text}",
                "status_code": response.status_code
            }), 400
            
    except Exception as e:
        return jsonify({
            "success": False,
            "message": f"Server error: {str(e)}"
        }), 500

@app.route('/timetable', methods=['GET'])
def get_timetable():
    try:
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({"error": "Authorization header required"}), 401
        
        token = auth_header.split(' ')[1]
        
        # KMIT API timetable endpoint
        timetable_url = f"{KMIT_API_BASE}/api/student/timetable"
        
        headers = {
            "Authorization": f"Bearer {token}",
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
        }
        
        response = requests.get(timetable_url, headers=headers, timeout=10)
        
        if response.status_code == 200:
            timetable_data = response.json()
            return jsonify({
                "success": True,
                "data": timetable_data
            })
        else:
            return jsonify({
                "success": False,
                "message": f"Failed to fetch timetable: {response.text}",
                "status_code": response.status_code
            }), 400
            
    except Exception as e:
        return jsonify({
            "success": False,
            "message": f"Server error: {str(e)}"
        }), 500

@app.route('/internal-results', methods=['GET'])
def get_internal_results():
    try:
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({"error": "Authorization header required"}), 401
        
        token = auth_header.split(' ')[1]
        
        # KMIT API internal results endpoint
        results_url = f"{KMIT_API_BASE}/api/student/internal-results"
        
        headers = {
            "Authorization": f"Bearer {token}",
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
        }
        
        response = requests.get(results_url, headers=headers, timeout=10)
        
        if response.status_code == 200:
            results_data = response.json()
            return jsonify({
                "success": True,
                "data": results_data
            })
        else:
            return jsonify({
                "success": False,
                "message": f"Failed to fetch internal results: {response.text}",
                "status_code": response.status_code
            }), 400
            
    except Exception as e:
        return jsonify({
            "success": False,
            "message": f"Server error: {str(e)}"
        }), 500

@app.route('/semester-results', methods=['GET'])
def get_semester_results():
    try:
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({"error": "Authorization header required"}), 401
        
        token = auth_header.split(' ')[1]
        
        # KMIT API semester results endpoint
        results_url = f"{KMIT_API_BASE}/api/student/semester-results"
        
        headers = {
            "Authorization": f"Bearer {token}",
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
        }
        
        response = requests.get(results_url, headers=headers, timeout=10)
        
        if response.status_code == 200:
            results_data = response.json()
            return jsonify({
                "success": True,
                "data": results_data
            })
        else:
            return jsonify({
                "success": False,
                "message": f"Failed to fetch semester results: {response.text}",
                "status_code": response.status_code
            }), 400
            
    except Exception as e:
        return jsonify({
            "success": False,
            "message": f"Server error: {str(e)}"
        }), 500

# Handle CORS preflight requests
@app.route('/<path:path>', methods=['OPTIONS'])
def handle_options(path):
    response = jsonify({'status': 'ok'})
    response.headers.add('Access-Control-Allow-Origin', '*')
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
    response.headers.add('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS')
    return response

if __name__ == '__main__':
    app.run(debug=True)
