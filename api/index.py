from flask import Flask, request, jsonify
from flask_cors import CORS
import requests
import json
import sqlite3
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
     supports_credentials=False)  # Enable CORS for all routes

# Database configuration - Use in-memory database for Vercel compatibility
DATABASE = ':memory:'  # In-memory database that works on Vercel

def init_db():
    """Initialize the database with required tables"""
    conn = sqlite3.connect(DATABASE)
    cursor = conn.cursor()
    
    # Create students table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS students (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            kmit_id INTEGER UNIQUE NOT NULL,
            name TEXT NOT NULL,
            hall_ticket TEXT UNIQUE NOT NULL,
            roll_number TEXT,
            branch TEXT,
            year INTEGER,
            semester INTEGER,
            email TEXT,
            phone TEXT,
            branch_code TEXT,
            course TEXT,
            section TEXT,
            admission_year INTEGER,
            dob TEXT,
            father_name TEXT,
            father_mobile TEXT,
            gender TEXT,
            qr_key TEXT,
            student_type TEXT,
            status TEXT,
            regulation TEXT,
            last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # Create search_history table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS search_history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            searcher_ip TEXT,
            search_term TEXT NOT NULL,
            search_type TEXT NOT NULL,
            results_count INTEGER,
            searched_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # Create user_sessions table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS user_sessions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            kmit_id INTEGER NOT NULL,
            access_token TEXT NOT NULL,
            refresh_token TEXT NOT NULL,
            expires_at TIMESTAMP NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (kmit_id) REFERENCES students (kmit_id)
        )
    ''')
    
    conn.commit()
    conn.close()
    print("Database initialized successfully!")

def get_db():
    """Get database connection"""
    conn = sqlite3.connect(DATABASE)
    conn.row_factory = sqlite3.Row  # This enables column access by name
    return conn

# Initialize database on startup
init_db()

# KMIT API configuration
KMIT_API_BASE = "https://kmit-api.teleuniv.in"

# Handle CORS preflight requests
@app.route('/<path:path>', methods=['OPTIONS'])
def handle_options(path):
    """Handle OPTIONS requests for CORS preflight"""
    response = jsonify({'status': 'ok'})
    response.headers.add('Access-Control-Allow-Origin', 'https://vichaar-kappa.vercel.app')
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization,X-Requested-With')
    response.headers.add('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS')
    return response

@app.route('/api/')
def root():
    """Root endpoint to confirm backend is running"""
    return jsonify({
        "message": "KMIT Vichaar Backend is running!",
        "status": "active",
        "timestamp": datetime.now().isoformat(),
        "endpoints": {
            "test": "/api/test-kmit",
            "attendance": "/api/attendance",
            "results": "/api/results",
            "timetable": "/api/timetable"
        }
    })

@app.route('/api/test-kmit', methods=['GET'])
def test_kmit():
    """
    Test endpoint to check KMIT API connectivity and see what it expects
    """
    try:
        print("Testing KMIT API connectivity...")
        
        # Try a simple GET request to see if we can reach the API
        test_response = requests.get(
            f"{KMIT_API_BASE}/auth/login",
            timeout=10
        )
        
        print(f"Test response status: {test_response.status_code}")
        print(f"Test response headers: {dict(test_response.headers)}")
        print(f"Test response: {test_response.text}")
        
        return jsonify({
            "success": True,
            "message": "KMIT API test completed",
            "status_code": test_response.status_code,
            "response": test_response.text[:500] + "..." if len(test_response.text) > 500 else test_response.text
        })
        
    except Exception as e:
        return jsonify({
            "success": False,
            "error": f"Test failed: {str(e)}"
        }), 500

@app.route('/api/login', methods=['POST'])
def login():
    try:
        # Get login data from frontend
        data = request.get_json()
        phone_number = data.get('phoneNumber')
        password = data.get('password')
        
        print(f"Login attempt for phone: {phone_number}")
        print(f"Received data: {data}")
        
        # The frontend should send the complete payload including hCaptcha token
        # If they don't have hCaptcha token, we'll try with empty token first
        if 'token' in data:
            # Frontend is sending complete payload
            login_payload = data
        else:
            # Frontend only sending phone/password, we'll add defaults
            login_payload = {
                "username": phone_number,
                "password": password,
                "application": "netra",
                "token": ""  # Empty token - this might fail but worth trying
            }
        
        print(f"KMIT API payload: {login_payload}")
        
        # Make request to KMIT API
        headers = {
            'Content-Type': 'application/json',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36',
            'Accept': 'application/json, text/plain, */*',
            'Accept-Language': 'en-US,en;q=0.9',
            'Accept-Encoding': 'gzip, deflate, br, zstd',
            'Origin': 'https://kmit.teleuniv.in',
            'Referer': 'https://kmit.teleuniv.in/',
            'Connection': 'keep-alive'
        }
        
        print(f"Making request to: {KMIT_API_BASE}/auth/login")
        print(f"Headers: {headers}")
        
        response = requests.post(
            f"{KMIT_API_BASE}/auth/login",
            json=login_payload,
            headers=headers,
            timeout=30
        )
        
        print(f"KMIT API Response Status: {response.status_code}")
        print(f"KMIT API Response Headers: {dict(response.headers)}")
        print(f"KMIT API Response: {response.text}")
        
        if response.status_code == 201:
            # Success
            try:
                kmit_data = response.json()
                
                # Store student data in database
                if kmit_data.get('Error') == False and 'access_token' in kmit_data:
                    # Extract student ID from JWT token
                    import jwt
                    try:
                        # Decode JWT to get student ID
                        token_parts = kmit_data['access_token'].split('.')
                        if len(token_parts) == 3:
                            import base64
                            import urllib.parse
                            
                            # Decode JWT payload
                            payload = token_parts[1]
                            # Add padding if needed
                            payload += '=' * (4 - len(payload) % 4)
                            decoded_payload = base64.urlsafe_b64decode(payload)
                            payload_data = json.loads(decoded_payload.decode('utf-8'))
                            
                            student_id = payload_data.get('sub')
                            if student_id:
                                print(f"Extracted student ID from JWT: {student_id}")
                                # Store student data in database
                                store_student_data(kmit_data, student_id)
                            else:
                                print("No student ID found in JWT payload")
                        else:
                            print("Invalid JWT token format")
                    except Exception as jwt_error:
                        print(f"Failed to decode JWT: {jwt_error}")
                
                return jsonify({
                    "success": True,
                    "message": "Login successful",
                    "data": kmit_data
                })
            except json.JSONDecodeError:
                return jsonify({
                    "success": False,
                    "error": "Invalid JSON response from KMIT API",
                    "details": response.text
                }), 400
        else:
            # Error from KMIT API
            error_message = f"KMIT API error: {response.status_code}"
            try:
                error_data = response.json()
                if 'message' in error_data:
                    error_message = error_data['message']
                elif 'error' in error_data:
                    error_message = error_data['error']
            except:
                pass
                
            return jsonify({
                "success": False,
                "error": error_message,
                "status_code": response.status_code,
                "details": response.text
            }), 400
            
    except requests.exceptions.Timeout:
        return jsonify({
            "success": False,
            "error": "Request timeout - KMIT API is taking too long to respond"
        }), 408
    except requests.exceptions.RequestException as e:
        return jsonify({
            "success": False,
            "error": f"Network error: {str(e)}"
        }), 500
    except Exception as e:
        return jsonify({
            "success": False,
            "error": f"Server error: {str(e)}"
        }), 500

@app.route('/api/login-with-token', methods=['POST'])
def login_with_token_direct():
    """Direct login endpoint without /api prefix for frontend compatibility"""
    try:
        data = request.get_json()
        print(f"Direct login attempt: {data}")
        
        # Expect the complete payload from frontend
        if not all(key in data for key in ['username', 'password', 'application', 'token']):
            return jsonify({
                "success": False,
                "error": "Missing required fields: username, password, application, token"
            }), 400
        
        headers = {
            'Content-Type': 'application/json',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36',
            'Accept': 'application/json, text/plain, */*',
            'Accept-Language': 'en-US,en;q=0.9',
            'Accept-Encoding': 'gzip, deflate, br, zstd',
            'Origin': 'https://kmit.teleuniv.in',
            'Referer': 'https://kmit.teleuniv.in/',
            'Connection': 'keep-alive'
        }
        
        response = requests.post(
            f"{KMIT_API_BASE}/auth/login",
            json=data,
            headers=headers,
            timeout=30
        )
        
        print(f"KMIT API Response Status: {response.status_code}")
        print(f"KMIT API Response: {response.text}")
        
        if response.status_code == 201:
            kmit_data = response.json()
            return jsonify({
                "success": True,
                "data": kmit_data,
                "message": "Login successful"
            })
        else:
            error_message = f"KMIT API error: {response.status_code}"
            try:
                error_data = response.json()
                if 'message' in error_data:
                    error_message = error_data['message']
            except:
                pass
                
            return jsonify({
                "success": False,
                "error": error_message,
                "status_code": response.status_code,
                "details": response.text
            }), 400
            
    except Exception as e:
        return jsonify({
            "success": False,
            "error": f"Server error: {str(e)}"
        }), 500

@app.route('/api/attendance', methods=['GET'])
def get_attendance():
    try:
        auth_header = request.headers.get('Authorization')
        if not auth_header:
            return jsonify({"success": False, "error": "No authorization token"}), 401
        
        # Extract student ID from JWT token
        try:
            import base64
            token_parts = auth_header.replace('Bearer ', '').split('.')
            if len(token_parts) == 3:
                payload = token_parts[1]
                payload += '=' * (4 - len(payload) % 4)
                decoded_payload = base64.urlsafe_b64decode(payload)
                payload_data = json.loads(decoded_payload.decode('utf-8'))
                student_id = payload_data.get('sub')
                print(f"Extracted student ID from token: {student_id}")
            else:
                return jsonify({"success": False, "error": "Invalid token format"}), 400
        except Exception as e:
            print(f"Failed to decode JWT: {e}")
            return jsonify({"success": False, "error": "Invalid token"}), 400
        
        headers = {
            'Authorization': auth_header,
            'Content-Type': 'application/json',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36'
        }
        
        # Now fetch real attendance data using the correct student ID
        print(f"Fetching attendance for student ID: {student_id}")
        attendance_response = requests.get(
            f"{KMIT_API_BASE}/sanjaya/getAttendance",
            headers=headers,
            timeout=30
        )
        
        print(f"KMIT attendance response status: {attendance_response.status_code}")
        print(f"KMIT attendance response: {attendance_response.text}")
        
        if attendance_response.status_code == 200:
            try:
                attendance_data = attendance_response.json()
                print(f"Parsed KMIT attendance data: {json.dumps(attendance_data, indent=2)}")
                
                # Return the raw KMIT data so we can see its actual structure
                return jsonify({
                    "success": True,
                    "data": attendance_data,
                    "message": "Real attendance data fetched from KMIT"
                })
            except json.JSONDecodeError:
                return jsonify({
                    "success": False,
                    "error": "Invalid JSON response from KMIT API"
                }), 400
        else:
            return jsonify({
                "success": False,
                "error": f"Failed to fetch attendance: {attendance_response.status_code}",
                "response": attendance_response.text
            }), 400
            
    except Exception as e:
        print(f"Attendance endpoint error: {e}")
        return jsonify({
            "success": False,
            "error": f"Server error: {str(e)}"
        }), 500

@app.route('/api/notices-count', methods=['GET'])
def get_notices_count():
    try:
        auth_header = request.headers.get('Authorization')
        if not auth_header:
            return jsonify({"success": False, "error": "No authorization token"}), 401
        
        headers = {
            'Authorization': auth_header,
            'Content-Type': 'application/json',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36'
        }
        
        response = requests.get(
            f"{KMIT_API_BASE}/sanjaya/getUnseenNoticesCountByStudent",
            headers=headers,
            timeout=30
        )
        
        if response.status_code == 200:
            return jsonify({
                "success": True,
                "data": response.json()
            })
        else:
            return jsonify({
                "success": False,
                "error": f"Failed to fetch notices: {response.status_code}"
            }), 400
            
    except Exception as e:
        return jsonify({
            "success": False,
            "error": f"Server error: {str(e)}"
        }), 500

@app.route('/api/test-attendance', methods=['GET'])
def test_attendance():
    """Test endpoint to see KMIT attendance API structure"""
    try:
        print("Testing KMIT attendance API...")
        
        # Try to get attendance data structure
        test_response = requests.get(
            f"{KMIT_API_BASE}/sanjaya/getAttendance",
            timeout=10
        )
        
        print(f"Attendance test response status: {test_response.status_code}")
        print(f"Attendance test response headers: {dict(test_response.headers)}")
        
        if test_response.status_code == 200:
            try:
                attendance_data = test_response.json()
                print(f"Attendance data structure: {json.dumps(attendance_data, indent=2)}")
                return jsonify({
                    "success": True,
                    "message": "KMIT attendance API test completed",
                    "status_code": test_response.status_code,
                    "data_structure": attendance_data
                })
            except json.JSONDecodeError:
                return jsonify({
                    "success": True,
                    "message": "KMIT attendance API test completed (non-JSON response)",
                    "status_code": test_response.status_code,
                    "response_text": test_response.text[:500]
                })
        else:
            return jsonify({
                "success": True,
                "message": "KMIT attendance API test completed",
                "status_code": test_response.status_code,
                "response_text": test_response.text[:500]
            })
        
    except Exception as e:
        return jsonify({
            "success": False,
            "error": f"Attendance test failed: {str(e)}"
        }), 500

@app.route('/api/subject-attendance', methods=['GET'])
def get_subject_attendance():
    """Fetch subject-wise attendance from KMIT API"""
    try:
        auth_header = request.headers.get('Authorization')
        if not auth_header:
            return jsonify({"success": False, "error": "No authorization token"}), 401
        
        headers = {
            'Authorization': auth_header,
            'Content-Type': 'application/json',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36'
        }
        
        # Fetch subject attendance from KMIT
        response = requests.get(
            f"{KMIT_API_BASE}/sanjaya/getSubjectAttendance",
            headers=headers,
            timeout=30
        )
        
        print(f"Subject attendance response status: {response.status_code}")
        print(f"Subject attendance response: {response.text}")
        
        if response.status_code == 200:
            try:
                subject_data = response.json()
                return jsonify({
                    "success": True,
                    "data": subject_data,
                    "message": "Subject attendance fetched from KMIT"
                })
            except json.JSONDecodeError:
                return jsonify({
                    "success": False,
                    "error": "Invalid JSON response from KMIT API"
                }), 400
        else:
            return jsonify({
                "success": False,
                "error": f"Failed to fetch subject attendance: {response.status_code}"
            }), 400
            
    except Exception as e:
        print(f"Subject attendance error: {e}")
        return jsonify({
            "success": False,
            "error": f"Server error: {str(e)}"
        }), 500

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({"status": "healthy", "message": "KMIT Vichaar Backend is running"})

@app.route('/api/search-students', methods=['GET'])
def search_students():
    """Search for students by name or hall ticket number"""
    try:
        query = request.args.get('q', '').strip()
        if not query:
            return jsonify({
                "success": False,
                "error": "Search query is required"
            }), 400
        
        conn = get_db()
        cursor = conn.cursor()
        
        # Search by name (partial match) or hall ticket (exact match)
        cursor.execute('''
            SELECT 
                kmit_id, name, hall_ticket, roll_number, branch, year, semester,
                email, phone, branch_code, course, section, admission_year,
                dob, father_name, father_mobile, gender, student_type, status,
                regulation, last_updated
            FROM students 
            WHERE name LIKE ? OR hall_ticket LIKE ? OR roll_number LIKE ?
            ORDER BY 
                CASE 
                    WHEN hall_ticket = ? THEN 1
                    WHEN name LIKE ? THEN 2
                    ELSE 3
                END,
                name ASC
            LIMIT 20
        ''', (f'%{query}%', f'%{query}%', f'%{query}%', query, f'%{query}%'))
        
        results = cursor.fetchall()
        
        # Convert to list of dictionaries
        students = []
        for row in results:
            student = dict(row)
            # Convert timestamp to readable format
            if student['last_updated']:
                student['last_updated'] = student['last_updated']
            students.append(student)
        
        # Log search history
        searcher_ip = request.remote_addr
        search_type = 'name' if any(query.lower() in str(row['name']).lower() for row in results) else 'hall_ticket'
        
        cursor.execute('''
            INSERT INTO search_history (searcher_ip, search_term, search_type, results_count)
            VALUES (?, ?, ?, ?)
        ''', (searcher_ip, query, search_type, len(students)))
        
        conn.commit()
        conn.close()
        
        return jsonify({
            "success": True,
            "data": {
                "students": students,
                "total_results": len(students),
                "query": query
            }
        })
        
    except Exception as e:
        return jsonify({
            "success": False,
            "error": f"Search failed: {str(e)}"
        }), 500

def store_student_data(student_data, kmit_id):
    """Store or update student data in database"""
    try:
        conn = get_db()
        cursor = conn.cursor()
        
        # Extract student info from KMIT response
        student = student_data.get('student', {})
        
        # Check if student already exists
        cursor.execute('SELECT id FROM students WHERE kmit_id = ?', (kmit_id,))
        existing = cursor.fetchone()
        
        if existing:
            # Update existing student
            cursor.execute('''
                UPDATE students SET
                    name = ?, hall_ticket = ?, roll_number = ?, branch = ?, year = ?, semester = ?,
                    email = ?, phone = ?, branch_code = ?, course = ?, section = ?, admission_year = ?,
                    dob = ?, father_name = ?, father_mobile = ?, gender = ?, qr_key = ?,
                    student_type = ?, status = ?, regulation = ?, last_updated = CURRENT_TIMESTAMP
                WHERE kmit_id = ?
            ''', (
                student.get('name'),
                student.get('htno'),
                student.get('rollno'),
                student.get('branch', {}).get('name') if student.get('branch') else None,
                student.get('currentyear'),
                student.get('currentsemester'),
                student.get('student_email'),
                student.get('phone'),
                student.get('branch', {}).get('code') if student.get('branch') else None,
                student.get('course', {}).get('name') if student.get('course') else None,
                student.get('section', {}).get('name') if student.get('section') else None,
                student.get('admissionyear'),
                student.get('dob'),
                student.get('fathername'),
                student.get('fathermobile'),
                student.get('gender'),
                student.get('qr_key'),
                student.get('studenttype'),
                student.get('status'),
                student.get('regulation', {}).get('name') if student.get('regulation') else None,
                kmit_id
            ))
            print(f"Updated student {kmit_id} in database")
        else:
            # Insert new student
            cursor.execute('''
                INSERT INTO students (
                    kmit_id, name, hall_ticket, roll_number, branch, year, semester,
                    email, phone, branch_code, course, section, admission_year,
                    dob, father_name, father_mobile, gender, qr_key, student_type, status, regulation
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ''', (
                kmit_id,
                student.get('name'),
                student.get('htno'),
                student.get('rollno'),
                student.get('branch', {}).get('name') if student.get('branch') else None,
                student.get('currentyear'),
                student.get('currentsemester'),
                student.get('student_email'),
                student.get('phone'),
                student.get('branch', {}).get('code') if student.get('branch') else None,
                student.get('course', {}).get('name') if student.get('course') else None,
                student.get('section', {}).get('name') if student.get('section') else None,
                student.get('admissionyear'),
                student.get('dob'),
                student.get('fathername'),
                student.get('fathermobile'),
                student.get('gender'),
                student.get('qr_key'),
                student.get('studenttype'),
                student.get('status'),
                student.get('regulation', {}).get('name') if student.get('regulation') else None
            ))
            print(f"Added new student {kmit_id} to database")
        
        conn.commit()
        conn.close()
        
    except Exception as e:
        print(f"Failed to store student data: {e}")
        # Don't fail the login if database storage fails

@app.route('/api/internal-results', methods=['GET'])
def get_internal_results():
    """
    Fetch internal assessment results from KMIT API
    """
    try:
        # Get authorization header
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({"error": "Authorization header required"}), 401
        
        token = auth_header.split(' ')[1]
        
        # Extract student ID from JWT token
        try:
            import jwt
            print(f"Attempting to decode token: {token[:50]}...")
            decoded = jwt.decode(token, options={"verify_signature": False})
            print(f"Decoded token: {decoded}")
            student_id = decoded.get('sub')
            print(f"Extracted student ID: {student_id}")
            if not student_id:
                return jsonify({"error": "Invalid token: no student ID"}), 401
        except Exception as e:
            print(f"Token decode error: {e}")
            return jsonify({"error": "Invalid token"}), 401
        
        # Make request to KMIT API
        headers = {
            'Authorization': f'Bearer {token}',
            'Content-Type': 'application/json'
        }
        
        print(f"Making request to KMIT API with student ID: {student_id}")
        response = requests.get(
            f"{KMIT_API_BASE}/sanjaya/getInternalResultsbyStudent/{student_id}",
            headers=headers,
            timeout=30
        )
        
        if response.status_code == 200:
            return jsonify({
                "success": True,
                "data": response.json()
            })
        else:
            print(f"KMIT API error: {response.status_code} - {response.text}")
            return jsonify({
                "success": False,
                "error": f"KMIT API returned {response.status_code}",
                "details": response.text
            }), response.status_code
            
    except requests.exceptions.Timeout:
        return jsonify({"error": "Request timeout"}), 504
    except requests.exceptions.RequestException as e:
        print(f"Request error: {e}")
        return jsonify({"error": "Internal server error"}), 500
    except Exception as e:
        print(f"Unexpected error: {e}")
        return jsonify({"error": "Internal server error"}), 500

@app.route('/api/semester-results', methods=['GET'])
def get_semester_results():
    """
    Fetch semester results from KMIT API
    """
    try:
        # Get authorization header
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({"error": "Authorization header required"}), 401
        
        token = auth_header.split(' ')[1]
        
        # Extract student ID from JWT token
        try:
            import jwt
            print(f"Semester Results - Attempting to decode token: {token[:50]}...")
            decoded = jwt.decode(token, options={"verify_signature": False})
            print(f"Semester Results - Decoded token: {decoded}")
            student_id = decoded.get('sub')
            print(f"Semester Results - Extracted student ID: {student_id}")
            if not student_id:
                return jsonify({"error": "Invalid token: no student ID"}), 401
        except Exception as e:
            print(f"Semester Results - Token decode error: {e}")
            return jsonify({"error": "Invalid token"}), 401
        
        # Make request to KMIT API for semester results
        headers = {
            'Authorization': f'Bearer {token}',
            'Content-Type': 'application/json'
        }
        
        print(f"Semester Results - Making request to KMIT API with student ID: {student_id}")
        # Using the correct endpoint for semester results
        response = requests.get(
            f"{KMIT_API_BASE}/ouresults/getcmm/{student_id}",
            headers=headers,
            timeout=30
        )
        
        if response.status_code == 200:
            return jsonify({
                "success": True,
                "data": response.json()
            })
        else:
            print(f"KMIT API error: {response.status_code} - {response.text}")
            return jsonify({
                "success": False,
                "error": f"KMIT API returned {response.status_code}",
                "details": response.text
            }), response.status_code
            
    except requests.exceptions.Timeout:
        return jsonify({"error": "Request timeout"}), 504
    except requests.exceptions.RequestException as e:
        print(f"Request error: {e}")
        return jsonify({"error": "Internal server error"}), 500
    except Exception as e:
        print(f"Unexpected error: {e}")
        return jsonify({"error": "Internal server error"}), 500

@app.route('/api/timetable', methods=['GET'])
def get_timetable():
    """
    Fetch timetable from KMIT API
    """
    try:
        # Get authorization header
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({"error": "Authorization header required"}), 401
        
        token = auth_header.split(' ')[1]
        
        # Extract student ID from JWT token
        try:
            import jwt
            print(f"Timetable - Attempting to decode token: {token[:50]}...")
            decoded = jwt.decode(token, options={"verify_signature": False})
            print(f"Timetable - Decoded token: {decoded}")
            student_id = decoded.get('sub')
            print(f"Timetable - Extracted student ID: {student_id}")
            if not student_id:
                return jsonify({"error": "Invalid token: no student ID"}), 401
        except Exception as e:
            print(f"Timetable - Token decode error: {e}")
            return jsonify({"error": "Invalid token"}), 401
        
        # Make request to KMIT API for timetable
        headers = {
            'Authorization': f'Bearer {token}',
            'Content-Type': 'application/json'
        }
        
        print(f"Timetable - Making request to KMIT API with student ID: {student_id}")
        response = requests.get(
            f"{KMIT_API_BASE}/sanjaya/getTimeTablebyStudent",
            headers=headers,
            timeout=30
        )
        
        if response.status_code == 200:
            return jsonify({
                "success": True,
                "data": response.json()
            })
        else:
            print(f"KMIT API error: {response.status_code} - {response.text}")
            return jsonify({
                "success": False,
                "error": f"KMIT API returned {response.status_code}",
                "details": response.text
            }), response.status_code
            
    except requests.exceptions.Timeout:
        return jsonify({"error": "Request timeout"}), 504
    except requests.exceptions.RequestException as e:
        print(f"Request error: {e}")
        return jsonify({"error": "Internal server error"}), 500
    except Exception as e:
        print(f"Unexpected error: {e}")
        return jsonify({"error": "Internal server error"}), 500

@app.route('/api/student-profile/<student_id>', methods=['GET'])
def get_student_profile_direct(student_id):  # Different function name
    try:
        # Get authorization header from frontend
        auth_header = request.headers.get('Authorization')
        if not auth_header:
            return jsonify({"success": False, "error": "No authorization token"}), 401
        
        headers = {
            'Authorization': auth_header,
            'Content-Type': 'application/json',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36'
        }
        
        response = requests.get(
            f"{KMIT_API_BASE}/studentmaster/studentprofile/{student_id}",
            headers=headers,
            timeout=30
        )
        
        if response.status_code == 200:
            return jsonify({
                "success": True,
                "data": response.json()
            })
        else:
            return jsonify({
                "success": False,
                "error": f"Failed to fetch profile: {response.status_code}"
            }), 400
            
    except Exception as e:
        return jsonify({
            "success": False,
            "error": f"Server error: {str(e)}"
        }), 500

@app.route('/api/debug/search/<hall_ticket>', methods=['GET'])
def debug_search(hall_ticket):
    """Debug search functionality"""
    try:
        # This will help us see what's in your database
        return jsonify({
            "message": f"Searching for hall ticket: {hall_ticket}",
            "timestamp": "2025-08-17",
            "note": "Check your Supabase dashboard for actual data"
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# This is required for Vercel
if __name__ == '__main__':
    app.run()
