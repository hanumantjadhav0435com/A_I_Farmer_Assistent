# AI Farming Assistant

## Overview

The AI Farming Assistant is a Flask-based web application that provides personalized agricultural advice to farmers using Google's Gemini AI. The system supports multiple languages (English, Hindi, Marathi) and allows users to get expert recommendations for fertilizers, watering schedules, and pest protection based on their specific crops and soil conditions.

## System Architecture

### Frontend Architecture
- **Framework**: Flask with Jinja2 templates
- **Styling**: Bootstrap 5.3.0 with custom CSS
- **Icons**: Font Awesome 6.4.0
- **JavaScript**: Vanilla JavaScript for chat functionality
- **Responsive Design**: Mobile-first approach with Bootstrap's grid system

### Backend Architecture
- **Framework**: Flask (Python web framework)
- **Database ORM**: SQLAlchemy with declarative base
- **Authentication**: Flask-Login for session management
- **Form Handling**: Flask-WTF for form validation
- **Email Service**: Flask-Mail for password reset functionality
- **AI Service**: Google Gemini API integration

### Database Schema
The application uses SQLAlchemy with the following models:
- **User**: Stores user profile information, authentication details, and preferences
- **ChatSession**: Manages chat conversation sessions
- **ChatMessage**: Stores individual messages within chat sessions
- **FarmProfile**: Stores farm-specific information (referenced but not fully implemented)

## Key Components

### Authentication System
- User registration and login functionality
- Password hashing with Werkzeug security
- Password reset via email
- Session management with Flask-Login
- Multi-language support for user preferences

### Chat System
- Real-time chat interface with AI assistant
- Session-based conversation management
- Message history persistence
- Quick action buttons for common queries
- Context-aware responses based on user farm profiles

### AI Integration
- Google Gemini 2.5 Flash model integration
- Personalized farming advice generation
- Multi-language support (English, Hindi, Marathi)
- Context-aware responses using farm profile data
- Temperature-controlled response generation (0.7)

### User Profile Management
- Comprehensive user profiles with farming details
- Farm size, location, and crop preferences
- Language preference settings
- Profile update functionality

## Data Flow

1. **User Authentication**: Users register/login through forms validated by Flask-WTF
2. **Profile Setup**: Users provide farm details stored in the database
3. **Chat Initiation**: Users start conversations through the chat interface
4. **AI Processing**: User queries are sent to Gemini API with context
5. **Response Generation**: AI generates personalized farming advice
6. **Data Persistence**: All conversations are stored in the database
7. **Session Management**: Chat sessions are maintained across user visits

## External Dependencies

### AI Services
- **Google Gemini API**: Primary AI service for generating farming advice
- **API Configuration**: Temperature 0.7, max tokens 2000
- **Model**: gemini-2.5-flash

### Email Services
- **SMTP Configuration**: Gmail SMTP for password reset emails
- **Flask-Mail**: Email service integration
- **Configurable Settings**: Server, port, TLS, authentication

### Database
- **Default**: SQLite for development
- **Production Ready**: PostgreSQL support via DATABASE_URL
- **Connection Pool**: Configured with pre-ping and recycle settings

### Frontend Libraries
- **Bootstrap 5.3.0**: UI framework
- **Font Awesome 6.4.0**: Icon library
- **Custom CSS**: Enhanced styling and theming

## Deployment Strategy

### Environment Configuration
- Environment variables for sensitive data (API keys, database URLs)
- Session secret management
- Database URL configuration
- Email service configuration

### Production Considerations
- ProxyFix middleware for proper header handling
- Database connection pooling
- Logging configuration
- WSGI-compatible application structure

### Scalability Features
- Session-based architecture
- Database relationship management with cascade operations
- Efficient query patterns
- Proper error handling and logging

## Changelog

```
Changelog:
- July 05, 2025. Initial setup with full authentication system
- July 05, 2025. Enhanced chat interface with category-based input system
- July 05, 2025. Removed sidebar sessions, improved spacing and text visibility
- July 05, 2025. Added structured input forms for fertilizer, watering, pest control, crop selection, and general categories
- July 05, 2025. Fixed farm profile template error and database farm_size parsing issue
- July 05, 2025. Optimized chat layout to 1/3 input (33vh) and 2/3 output (67vh) for better conversation visibility
- July 05, 2025. Created local development setup with configuration files and deployment guide
```

## User Preferences

```
Preferred communication style: Simple, everyday language.
```

## Technical Notes

### Security Implementation
- Password hashing with Werkzeug
- CSRF protection via Flask-WTF
- Session management with secure cookies
- Input validation and sanitization

### Performance Optimization
- Database connection pooling
- Efficient SQLAlchemy queries
- Proper relationship management
- Static file optimization

### Error Handling
- Comprehensive logging configuration
- Graceful API error handling
- User-friendly error messages
- Fallback mechanisms for AI service failures

### Future Enhancements
- Farm profile system completion
- Advanced analytics and reporting
- Weather integration
- Crop calendar features
- Multi-farm management support