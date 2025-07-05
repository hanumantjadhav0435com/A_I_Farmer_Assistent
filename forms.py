from flask_wtf import FlaskForm
from wtforms import StringField, PasswordField, BooleanField, SelectField, TextAreaField, FloatField, DateField
from wtforms.validators import DataRequired, Length, Email, EqualTo, ValidationError, Optional
from models import User

class LoginForm(FlaskForm):
    username = StringField('Username', validators=[DataRequired(), Length(min=3, max=20)])
    password = PasswordField('Password', validators=[DataRequired()])
    remember_me = BooleanField('Remember Me')

class RegistrationForm(FlaskForm):
    username = StringField('Username', validators=[DataRequired(), Length(min=3, max=20)])
    email = StringField('Email', validators=[DataRequired(), Email()])
    full_name = StringField('Full Name', validators=[DataRequired(), Length(min=2, max=100)])
    phone = StringField('Phone Number', validators=[Optional(), Length(min=10, max=15)])
    location = StringField('Location', validators=[Optional(), Length(max=100)])
    farm_size = StringField('Farm Size', validators=[Optional(), Length(max=50)])
    preferred_language = SelectField('Preferred Language', 
                                   choices=[('english', 'English'), 
                                          ('hindi', 'Hindi'), 
                                          ('marathi', 'Marathi')],
                                   default='english')
    password = PasswordField('Password', validators=[DataRequired(), Length(min=6)])
    password2 = PasswordField('Confirm Password', 
                            validators=[DataRequired(), EqualTo('password')])

    def validate_username(self, username):
        user = User.query.filter_by(username=username.data).first()
        if user:
            raise ValidationError('Username already exists. Please choose a different one.')

    def validate_email(self, email):
        user = User.query.filter_by(email=email.data).first()
        if user:
            raise ValidationError('Email already registered. Please choose a different one.')

class ForgotPasswordForm(FlaskForm):
    email = StringField('Email', validators=[DataRequired(), Email()])

class ResetPasswordForm(FlaskForm):
    password = PasswordField('New Password', validators=[DataRequired(), Length(min=6)])
    password2 = PasswordField('Confirm New Password', 
                            validators=[DataRequired(), EqualTo('password')])

class ProfileForm(FlaskForm):
    full_name = StringField('Full Name', validators=[DataRequired(), Length(min=2, max=100)])
    phone = StringField('Phone Number', validators=[Optional(), Length(min=10, max=15)])
    location = StringField('Location', validators=[Optional(), Length(max=100)])
    farm_size = StringField('Farm Size', validators=[Optional(), Length(max=50)])
    preferred_language = SelectField('Preferred Language', 
                                   choices=[('english', 'English'), 
                                          ('hindi', 'Hindi'), 
                                          ('marathi', 'Marathi')],
                                   default='english')

class ChatForm(FlaskForm):
    message = TextAreaField('Message', validators=[DataRequired(), Length(min=1, max=1000)])

class FarmProfileForm(FlaskForm):
    crop_name = StringField('Crop Name', validators=[DataRequired(), Length(min=2, max=100)])
    soil_type = SelectField('Soil Type', 
                          choices=[('clay', 'Clay'), 
                                 ('sandy', 'Sandy'), 
                                 ('loamy', 'Loamy'),
                                 ('silt', 'Silt'),
                                 ('chalky', 'Chalky'),
                                 ('peaty', 'Peaty')],
                          validators=[DataRequired()])
    farm_size_acres = FloatField('Farm Size (acres)', validators=[Optional()])
    sowing_date = DateField('Sowing Date', validators=[Optional()])
    location = StringField('Location', validators=[Optional(), Length(max=100)])
    irrigation_type = SelectField('Irrigation Type',
                                choices=[('drip', 'Drip Irrigation'),
                                       ('sprinkler', 'Sprinkler'),
                                       ('flood', 'Flood Irrigation'),
                                       ('furrow', 'Furrow Irrigation'),
                                       ('rainfed', 'Rainfed')],
                                validators=[Optional()])
    farming_experience = SelectField('Farming Experience',
                                   choices=[('beginner', 'Beginner (0-2 years)'),
                                          ('intermediate', 'Intermediate (3-10 years)'),
                                          ('experienced', 'Experienced (10+ years)')],
                                   validators=[Optional()])
