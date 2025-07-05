#!/usr/bin/env python3
"""
Local development runner for AI Farming Assistant
"""
import os
import sys

# Add python-dotenv support if available
try:
    from dotenv import load_dotenv
    load_dotenv()
    print("✓ Loaded environment variables from .env file")
except ImportError:
    print("⚠ python-dotenv not installed. Set environment variables manually.")
    print("Install with: pip install python-dotenv")

# Set default environment variables for local development
if not os.environ.get('DATABASE_URL'):
    os.environ['DATABASE_URL'] = 'postgresql://farming_user:password@localhost:5432/farming_assistant'

if not os.environ.get('SESSION_SECRET'):
    os.environ['SESSION_SECRET'] = 'dev-secret-key-change-in-production'

if not os.environ.get('FLASK_SECRET_KEY'):
    os.environ['FLASK_SECRET_KEY'] = 'dev-flask-secret-change-in-production'

# Check for required environment variables
required_vars = ['GEMINI_API_KEY']
missing_vars = [var for var in required_vars if not os.environ.get(var)]

if missing_vars:
    print("❌ Missing required environment variables:")
    for var in missing_vars:
        print(f"   - {var}")
    print("\nCreate a .env file or set these environment variables:")
    print("GEMINI_API_KEY=your-api-key-here")
    sys.exit(1)

# Import the Flask application
try:
    from main import app
    print("✓ Flask application imported successfully")
except ImportError as e:
    print(f"❌ Failed to import Flask application: {e}")
    sys.exit(1)

def create_tables():
    """Create database tables if they don't exist"""
    try:
        with app.app_context():
            from app import db
            db.create_all()
            print("✓ Database tables created successfully")
    except Exception as e:
        print(f"⚠ Database setup warning: {e}")
        print("Make sure PostgreSQL is running and database exists")

if __name__ == '__main__':
    print("🌱 Starting AI Farming Assistant (Local Development)")
    print("=" * 50)
    
    # Create database tables
    create_tables()
    
    # Configuration
    host = '127.0.0.1'
    port = 5000
    debug = True
    
    print(f"🚀 Starting server at http://{host}:{port}")
    print("Press Ctrl+C to stop the server")
    print("=" * 50)
    
    try:
        app.run(
            host=host,
            port=port,
            debug=debug,
            use_reloader=True
        )
    except KeyboardInterrupt:
        print("\n👋 Server stopped by user")
    except Exception as e:
        print(f"❌ Server error: {e}")
        sys.exit(1)