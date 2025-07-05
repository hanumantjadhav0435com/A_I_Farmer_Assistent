import re
from datetime import datetime
from flask import current_app

def validate_phone_number(phone):
    """Validate phone number format"""
    if not phone:
        return True  # Optional field
    
    # Remove all non-digit characters
    cleaned = re.sub(r'\D', '', phone)
    
    # Check if it's a valid Indian mobile number
    if len(cleaned) == 10 and cleaned.startswith(('6', '7', '8', '9')):
        return True
    elif len(cleaned) == 11 and cleaned.startswith('0'):
        return True
    elif len(cleaned) == 12 and cleaned.startswith('91'):
        return True
    
    return False

def format_phone_number(phone):
    """Format phone number for display"""
    if not phone:
        return ''
    
    cleaned = re.sub(r'\D', '', phone)
    
    if len(cleaned) == 10:
        return f"+91 {cleaned[:5]} {cleaned[5:]}"
    elif len(cleaned) == 12 and cleaned.startswith('91'):
        return f"+{cleaned[:2]} {cleaned[2:7]} {cleaned[7:]}"
    
    return phone

def get_farming_season():
    """Get current farming season based on month"""
    current_month = datetime.now().month
    
    if current_month in [6, 7, 8, 9]:
        return 'kharif'
    elif current_month in [10, 11, 12, 1, 2, 3]:
        return 'rabi'
    else:
        return 'summer'

def get_season_crops(season):
    """Get typical crops for a given season"""
    crops = {
        'kharif': ['Rice', 'Maize', 'Cotton', 'Sugarcane', 'Soybean', 'Groundnut'],
        'rabi': ['Wheat', 'Barley', 'Peas', 'Gram', 'Mustard', 'Potato'],
        'summer': ['Watermelon', 'Cucumber', 'Fodder crops', 'Vegetables']
    }
    return crops.get(season, [])

def parse_farm_size(size_str):
    """Parse farm size string to get numeric value"""
    if not size_str:
        return None
    
    # Extract numeric value
    numeric_match = re.search(r'(\d+\.?\d*)', size_str.lower())
    if not numeric_match:
        return None
    
    value = float(numeric_match.group(1))
    
    # Convert to acres if needed
    if 'hectare' in size_str.lower() or 'ha' in size_str.lower():
        value *= 2.47  # 1 hectare = 2.47 acres
    elif 'bigha' in size_str.lower():
        value *= 0.62  # 1 bigha ≈ 0.62 acres (varies by region)
    
    return value

def get_language_name(code):
    """Get language name from code"""
    languages = {
        'english': 'English',
        'hindi': 'हिंदी',
        'marathi': 'मराठी'
    }
    return languages.get(code, 'English')

def sanitize_input(text):
    """Sanitize user input to prevent XSS"""
    if not text:
        return ''
    
    # Remove HTML tags
    text = re.sub(r'<[^>]+>', '', text)
    
    # Remove script tags and their content
    text = re.sub(r'<script.*?</script>', '', text, flags=re.DOTALL | re.IGNORECASE)
    
    # Remove dangerous characters
    text = re.sub(r'[<>"\']', '', text)
    
    return text.strip()

def log_user_activity(user_id, activity, details=None):
    """Log user activity for monitoring"""
    try:
        current_app.logger.info(f"User {user_id}: {activity} - {details}")
    except Exception as e:
        current_app.logger.error(f"Failed to log activity: {str(e)}")
