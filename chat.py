import json
from datetime import datetime
from flask import Blueprint, render_template, request, redirect, url_for, flash, jsonify
from flask_login import login_required, current_user
from app import db
from models import ChatSession, ChatMessage, FarmProfile
from gemini_service import farming_assistant
from forms import ChatForm, FarmProfileForm

chat_bp = Blueprint('chat', __name__)

@chat_bp.route('/dashboard')
@login_required
def dashboard():
    """Main dashboard showing recent chats and farm profiles"""
    recent_sessions = ChatSession.query.filter_by(user_id=current_user.id)\
        .order_by(ChatSession.updated_at.desc()).limit(5).all()
    
    farm_profiles = FarmProfile.query.filter_by(user_id=current_user.id, is_active=True).all()
    
    return render_template('chat.html', 
                         recent_sessions=recent_sessions,
                         farm_profiles=farm_profiles)

@chat_bp.route('/chat')
@chat_bp.route('/chat/<int:session_id>')
@login_required
def chat(session_id=None):
    """Chat interface"""
    if session_id:
        session = ChatSession.query.filter_by(id=session_id, user_id=current_user.id).first()
        if not session:
            flash('Chat session not found.', 'danger')
            return redirect(url_for('chat.dashboard'))
    else:
        session = None
    
    # Get user's farm profiles for context
    farm_profiles = FarmProfile.query.filter_by(user_id=current_user.id, is_active=True).all()
    
    return render_template('chat.html', 
                         current_session=session,
                         farm_profiles=farm_profiles)

@chat_bp.route('/api/send-message', methods=['POST'])
@login_required
def send_message():
    """API endpoint to send a message and get AI response"""
    try:
        data = request.get_json()
        user_message = data.get('message', '').strip()
        session_id = data.get('session_id')
        
        if not user_message:
            return jsonify({'error': 'Message cannot be empty'}), 400
        
        # Get or create chat session
        if session_id:
            session = ChatSession.query.filter_by(id=session_id, user_id=current_user.id).first()
            if not session:
                return jsonify({'error': 'Session not found'}), 404
        else:
            # Create new session
            session = ChatSession(
                user_id=current_user.id,
                session_name=f"Chat {datetime.now().strftime('%Y-%m-%d %H:%M')}"
            )
            db.session.add(session)
            db.session.commit()
        
        # Analyze the query to extract farming context
        query_analysis = farming_assistant.analyze_farming_query(user_message)
        
        # Parse farm size to numeric value
        from utils import parse_farm_size
        farm_size_numeric = parse_farm_size(query_analysis.get('farm_size'))
        
        # Save user message
        user_msg = ChatMessage(
            session_id=session.id,
            message_type='user',
            content=user_message,
            crop_type=query_analysis.get('crop_type'),
            soil_type=query_analysis.get('soil_type'),
            farm_size_acres=farm_size_numeric,
            query_type=query_analysis.get('query_type', 'general')
        )
        db.session.add(user_msg)
        
        # Get AI response
        ai_response = farming_assistant.get_farming_advice(
            user_query=user_message,
            crop_type=query_analysis.get('crop_type'),
            soil_type=query_analysis.get('soil_type'),
            farm_size=query_analysis.get('farm_size'),
            language=current_user.preferred_language
        )
        
        # Save AI response
        ai_msg = ChatMessage(
            session_id=session.id,
            message_type='assistant',
            content=ai_response,
            crop_type=query_analysis.get('crop_type'),
            soil_type=query_analysis.get('soil_type'),
            farm_size_acres=farm_size_numeric,
            query_type=query_analysis.get('query_type', 'general')
        )
        db.session.add(ai_msg)
        
        # Update session timestamp
        session.updated_at = datetime.utcnow()
        db.session.commit()
        
        return jsonify({
            'success': True,
            'session_id': session.id,
            'user_message': {
                'id': user_msg.id,
                'content': user_message,
                'timestamp': user_msg.timestamp.isoformat()
            },
            'ai_response': {
                'id': ai_msg.id,
                'content': ai_response,
                'timestamp': ai_msg.timestamp.isoformat()
            }
        })
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Failed to process message: {str(e)}'}), 500

@chat_bp.route('/api/chat-history/<int:session_id>')
@login_required
def get_chat_history(session_id):
    """Get chat history for a session"""
    session = ChatSession.query.filter_by(id=session_id, user_id=current_user.id).first()
    if not session:
        return jsonify({'error': 'Session not found'}), 404
    
    messages = ChatMessage.query.filter_by(session_id=session_id)\
        .order_by(ChatMessage.timestamp.asc()).all()
    
    history = []
    for msg in messages:
        history.append({
            'id': msg.id,
            'type': msg.message_type,
            'content': msg.content,
            'timestamp': msg.timestamp.isoformat()
        })
    
    return jsonify({
        'session_id': session_id,
        'session_name': session.session_name,
        'messages': history
    })

@chat_bp.route('/api/sessions')
@login_required
def get_sessions():
    """Get all chat sessions for the user"""
    sessions = ChatSession.query.filter_by(user_id=current_user.id)\
        .order_by(ChatSession.updated_at.desc()).all()
    
    session_list = []
    for session in sessions:
        last_message = ChatMessage.query.filter_by(session_id=session.id)\
            .order_by(ChatMessage.timestamp.desc()).first()
        
        session_list.append({
            'id': session.id,
            'name': session.session_name,
            'created_at': session.created_at.isoformat(),
            'updated_at': session.updated_at.isoformat(),
            'last_message': last_message.content[:100] + '...' if last_message else 'No messages yet'
        })
    
    return jsonify({'sessions': session_list})

@chat_bp.route('/farm-profile', methods=['GET', 'POST'])
@login_required
def farm_profile():
    """Manage farm profiles"""
    form = FarmProfileForm()
    
    if form.validate_on_submit():
        profile = FarmProfile(
            user_id=current_user.id,
            crop_name=form.crop_name.data,
            soil_type=form.soil_type.data,
            farm_size_acres=form.farm_size_acres.data,
            sowing_date=form.sowing_date.data,
            location=form.location.data,
            irrigation_type=form.irrigation_type.data,
            farming_experience=form.farming_experience.data
        )
        
        try:
            db.session.add(profile)
            db.session.commit()
            flash('Farm profile added successfully!', 'success')
            return redirect(url_for('chat.dashboard'))
        except Exception as e:
            db.session.rollback()
            flash('Error adding farm profile. Please try again.', 'danger')
    
    profiles = FarmProfile.query.filter_by(user_id=current_user.id, is_active=True).all()
    return render_template('farm_profile.html', form=form, profiles=profiles)

@chat_bp.route('/delete-session/<int:session_id>', methods=['POST'])
@login_required
def delete_session(session_id):
    """Delete a chat session"""
    session = ChatSession.query.filter_by(id=session_id, user_id=current_user.id).first()
    if not session:
        flash('Session not found.', 'danger')
        return redirect(url_for('chat.dashboard'))
    
    try:
        db.session.delete(session)
        db.session.commit()
        flash('Chat session deleted successfully.', 'success')
    except Exception as e:
        db.session.rollback()
        flash('Error deleting session. Please try again.', 'danger')
    
    return redirect(url_for('chat.dashboard'))

@chat_bp.route('/api/crop-suggestions', methods=['POST'])
@login_required
def get_crop_suggestions():
    """Get crop suggestions based on soil and location"""
    try:
        data = request.get_json()
        soil_type = data.get('soil_type')
        location = data.get('location')
        
        if not soil_type or not location:
            return jsonify({'error': 'Soil type and location are required'}), 400
        
        suggestions = farming_assistant.get_crop_suggestions(
            soil_type=soil_type,
            location=location,
            language=current_user.preferred_language
        )
        
        return jsonify({
            'success': True,
            'suggestions': suggestions
        })
        
    except Exception as e:
        return jsonify({'error': f'Failed to get crop suggestions: {str(e)}'}), 500
