#!/usr/bin/env python3
"""
Test script to debug KMIT API calls
"""

import requests
import json

def test_kmit_api():
    print("🧪 Testing KMIT API directly...")
    print("=" * 50)
    
    # Test 1: Simple GET request to see if API is reachable
    print("\n1️⃣ Testing API connectivity...")
    try:
        response = requests.get(
            "https://kmit-api.teleuniv.in/auth/login",
            timeout=10
        )
        print(f"   Status: {response.status_code}")
        print(f"   Headers: {dict(response.headers)}")
        print(f"   Response: {response.text[:200]}...")
    except Exception as e:
        print(f"   ❌ Error: {e}")
    
    # Test 2: Try login with minimal payload
    print("\n2️⃣ Testing login with minimal payload...")
    try:
        minimal_payload = {
            "username": "test",
            "password": "test",
            "application": "netra",
            "token": ""
        }
        
        response = requests.post(
            "https://kmit-api.teleuniv.in/auth/login",
            json=minimal_payload,
            headers={
                'Content-Type': 'application/json',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36',
                'Origin': 'https://kmit.teleuniv.in',
                'Referer': 'https://kmit.teleuniv.in/'
            },
            timeout=15
        )
        
        print(f"   Status: {response.status_code}")
        print(f"   Response: {response.text[:300]}...")
        
        if response.status_code != 201:
            print(f"   ❌ Expected 201, got {response.status_code}")
        else:
            print("   ✅ Success! API accepts minimal payload")
            
    except Exception as e:
        print(f"   ❌ Error: {e}")
    
    # Test 3: Try with your actual credentials (without hCaptcha)
    print("\n3️⃣ Testing with your credentials (no hCaptcha)...")
    try:
        real_payload = {
            "username": "8712596188",
            "password": "Kmit123$",
            "application": "netra",
            "token": ""
        }
        
        response = requests.post(
            "https://kmit-api.teleuniv.in/auth/login",
            json=real_payload,
            headers={
                'Content-Type': 'application/json',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36',
                'Origin': 'https://kmit.teleuniv.in',
                'Referer': 'https://kmit.teleuniv.in/'
            },
            timeout=15
        )
        
        print(f"   Status: {response.status_code}")
        print(f"   Response: {response.text[:300]}...")
        
        if response.status_code == 201:
            print("   ✅ Success! Your credentials work without hCaptcha")
            data = response.json()
            print(f"   Access Token: {data.get('access_token', 'N/A')[:50]}...")
            print(f"   Student ID: {data.get('sub', 'N/A')}")
        else:
            print(f"   ❌ Failed with status {response.status_code}")
            
    except Exception as e:
        print(f"   ❌ Error: {e}")
    
    print("\n" + "=" * 50)
    print("🏁 Testing complete!")

if __name__ == "__main__":
    test_kmit_api()
