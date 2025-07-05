import os
import secrets
from datetime import datetime, timedelta
from flask import Blueprint, render_template, request, redirect, url_for, flash, session
from flask_login import login_user, logout_user, login_required, current_user
from flask_mail import Message
from werkzeug.security import generate_password_hash
from app import db, mail
from models import User
from forms import LoginForm, RegistrationForm, ForgotPasswordForm, ResetPasswordForm, ProfileForm

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/login', methods=['GET', 'POST'])
def login():
    if current_user.is_authenticated:
        return redirect(url_for('chat.dashboard'))
    
    form = LoginForm()
    if form.validate_on_submit():
        user = User.query.filter_by(username=form.username.data).first()
        if user and user.check_password(form.password.data):
            login_user(user, remember=form.remember_me.data)
            next_page = request.args.get('next')
            flash('Login successful!', 'success')
            return redirect(next_page) if next_page else redirect(url_for('chat.dashboard'))
        else:
            flash('Invalid username or password', 'danger')
    
    return render_template('login.html', form=form)

@auth_bp.route('/register', methods=['GET', 'POST'])
def register():
    if current_user.is_authenticated:
        return redirect(url_for('chat.dashboard'))
    
    form = RegistrationForm()
    if form.validate_on_submit():
        user = User(
            username=form.username.data,
            email=form.email.data,
            full_name=form.full_name.data,
            phone=form.phone.data,
            location=form.location.data,
            farm_size=form.farm_size.data,
            preferred_language=form.preferred_language.data
        )
        user.set_password(form.password.data)
        
        try:
            db.session.add(user)
            db.session.commit()
            flash('Registration successful! Please log in.', 'success')
            return redirect(url_for('auth.login'))
        except Exception as e:
            db.session.rollback()
            flash('Registration failed. Username or email already exists.', 'danger')
    
    return render_template('register.html', form=form)

@auth_bp.route('/logout')
@login_required
def logout():
    logout_user()
    flash('You have been logged out.', 'info')
    return redirect(url_for('index'))

@auth_bp.route('/forgot-password', methods=['GET', 'POST'])
def forgot_password():
    if current_user.is_authenticated:
        return redirect(url_for('chat.dashboard'))
    
    form = ForgotPasswordForm()
    if form.validate_on_submit():
        user = User.query.filter_by(email=form.email.data).first()
        if user:
            # Generate reset token
            token = secrets.token_urlsafe(32)
            user.reset_token = token
            user.reset_token_expiry = datetime.utcnow() + timedelta(hours=1)
            
            try:
                db.session.commit()
                send_reset_email(user, token)
                flash('Password reset instructions have been sent to your email.', 'info')
                return redirect(url_for('auth.login'))
            except Exception as e:
                db.session.rollback()
                flash('Error sending reset email. Please try again.', 'danger')
        else:
            flash('Email not found in our records.', 'danger')
    
    return render_template('forgot_password.html', form=form)

@auth_bp.route('/reset-password/<token>', methods=['GET', 'POST'])
def reset_password(token):
    if current_user.is_authenticated:
        return redirect(url_for('chat.dashboard'))
    
    user = User.query.filter_by(reset_token=token).first()
    if not user or user.reset_token_expiry < datetime.utcnow():
        flash('Invalid or expired reset token.', 'danger')
        return redirect(url_for('auth.forgot_password'))
    
    form = ResetPasswordForm()
    if form.validate_on_submit():
        user.set_password(form.password.data)
        user.reset_token = None
        user.reset_token_expiry = None
        
        try:
            db.session.commit()
            flash('Password reset successful! Please log in.', 'success')
            return redirect(url_for('auth.login'))
        except Exception as e:
            db.session.rollback()
            flash('Error resetting password. Please try again.', 'danger')
    
    return render_template('reset_password.html', form=form)

@auth_bp.route('/profile', methods=['GET', 'POST'])
@login_required
def profile():
    form = ProfileForm(obj=current_user)
    if form.validate_on_submit():
        current_user.full_name = form.full_name.data
        current_user.phone = form.phone.data
        current_user.location = form.location.data
        current_user.farm_size = form.farm_size.data
        current_user.preferred_language = form.preferred_language.data
        
        try:
            db.session.commit()
            flash('Profile updated successfully!', 'success')
            return redirect(url_for('auth.profile'))
        except Exception as e:
            db.session.rollback()
            flash('Error updating profile. Please try again.', 'danger')
    
    return render_template('profile.html', form=form)

def send_reset_email(user, token):
    """Send password reset email"""
    try:
        reset_url = url_for('auth.reset_password', token=token, _external=True)
        
        msg = Message(
            'Password Reset Request - Farming Assistant',
            recipients=[user.email]
        )
        
        msg.body = f'''Hello {user.full_name},

You have requested to reset your password for your Farming Assistant account.

Please click the following link to reset your password:
{reset_url}

This link will expire in 1 hour.

If you did not request this password reset, please ignore this email.

Best regards,
Farming Assistant Team
'''
        
        msg.html = f'''
<h2>Password Reset Request</h2>
<p>Hello {user.full_name},</p>
<p>You have requested to reset your password for your Farming Assistant account.</p>
<p><a href="{reset_url}" style="background-color: #28a745; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Reset Password</a></p>
<p>This link will expire in 1 hour.</p>
<p>If you did not request this password reset, please ignore this email.</p>
<p>Best regards,<br>Farming Assistant Team</p>
'''
        
        mail.send(msg)
        
    except Exception as e:
        raise Exception(f"Failed to send reset email: {str(e)}")
