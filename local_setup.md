# AI Farming Assistant - Local Setup Guide

## Prerequisites

1. **Python 3.11+** installed on your system
2. **PostgreSQL** database server
3. **Git** for cloning the repository

## Step 1: Clone and Setup Environment

```bash
# Clone the repository
git clone <your-repo-url>
cd ai-farming-assistant

# Create virtual environment
python -m venv venv

# Activate virtual environment
# On Windows:
venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

## Step 2: Database Setup

### Install PostgreSQL
- **Windows**: Download from https://www.postgresql.org/download/windows/
- **macOS**: `brew install postgresql`
- **Linux**: `sudo apt-get install postgresql postgresql-contrib`

### Create Database
```bash
# Login to PostgreSQL
psql -U postgres

# Create database and user
CREATE DATABASE farming_assistant;
CREATE USER farming_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE farming_assistant TO farming_user;
\q
```

## Step 3: Environment Configuration

Create a `.env` file in the project root:

```env
# Database Configuration
DATABASE_URL=postgresql://farming_user:your_password@localhost:5432/farming_assistant

# Flask Configuration
FLASK_SECRET_KEY=your-super-secret-key-here
SESSION_SECRET=another-secret-key-for-sessions

# Google Gemini API
GEMINI_API_KEY=your-gemini-api-key-here

# Email Configuration (for password reset)
MAIL_SERVER=smtp.gmail.com
MAIL_PORT=587
MAIL_USE_TLS=True
MAIL_USERNAME=your-email@gmail.com
MAIL_PASSWORD=your-app-password

# PostgreSQL Connection Details
PGHOST=localhost
PGPORT=5432
PGUSER=farming_user
PGPASSWORD=your_password
PGDATABASE=farming_assistant
```

## Step 4: Install Python Dependencies

Create `requirements.txt`:

```txt
email-validator==2.1.0
flask==3.0.0
flask-login==0.6.3
flask-mail==0.9.1
flask-sqlalchemy==3.1.1
flask-wtf==1.2.1
google-genai==0.8.0
gunicorn==21.2.0
psycopg2-binary==2.9.9
werkzeug==3.0.1
wtforms==3.1.1
python-dotenv==1.0.0
```

Then install:
```bash
pip install -r requirements.txt
```

## Step 5: Application Setup

Create `run_local.py`:

```python
import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

from main import app

if __name__ == '__main__':
    # Create tables if they don't exist
    with app.app_context():
        from app import db
        db.create_all()
    
    # Run the application
    app.run(
        host='127.0.0.1',
        port=5000,
        debug=True
    )
```

## Step 6: Get API Keys

### Google Gemini API Key
1. Go to https://console.cloud.google.com/
2. Create a new project or select existing one
3. Enable the "Generative Language API"
4. Go to "Credentials" and create an API key
5. Copy the API key to your `.env` file

### Gmail App Password (for email features)
1. Enable 2-factor authentication on your Gmail account
2. Go to Google Account settings
3. Security → App passwords
4. Generate an app password for "Mail"
5. Use this password in your `.env` file

## Step 7: Run the Application

```bash
# Activate virtual environment (if not already active)
source venv/bin/activate  # or venv\Scripts\activate on Windows

# Run the application
python run_local.py
```

The application will be available at `http://127.0.0.1:5000`

## Troubleshooting

### Database Connection Issues
- Ensure PostgreSQL is running: `sudo service postgresql start` (Linux) or check services (Windows)
- Verify database credentials in `.env` file
- Test connection: `psql -U farming_user -d farming_assistant -h localhost`

### Missing Dependencies
```bash
pip install --upgrade pip
pip install -r requirements.txt --force-reinstall
```

### Port Already in Use
Change port in `run_local.py`:
```python
app.run(host='127.0.0.1', port=5001, debug=True)
```

### API Key Issues
- Verify Gemini API key is correct
- Check API quotas and billing in Google Cloud Console
- Ensure the "Generative Language API" is enabled

## Development Mode Features

- **Auto-reload**: Changes to Python files will automatically restart the server
- **Debug mode**: Detailed error messages and interactive debugger
- **Local database**: All data stored locally in PostgreSQL

## Production Deployment Notes

For production deployment:
1. Set `debug=False` in `run_local.py`
2. Use a production WSGI server like Gunicorn
3. Set secure environment variables
4. Use a production database with backups
5. Configure SSL/HTTPS
6. Set up proper logging

## Directory Structure

```
ai-farming-assistant/
├── app.py              # Flask application setup
├── main.py             # Application entry point
├── run_local.py        # Local development runner
├── requirements.txt    # Python dependencies
├── .env               # Environment variables (create this)
├── models.py          # Database models
├── forms.py           # WTForms definitions
├── auth.py            # Authentication routes
├── chat.py            # Chat functionality
├── gemini_service.py  # AI integration
├── utils.py           # Utility functions
├── templates/         # HTML templates
├── static/           # CSS, JS, images
└── local_setup.md    # This file
```

This setup provides a complete local development environment that matches the production deployment on Replit.