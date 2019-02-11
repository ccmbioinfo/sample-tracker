from flask_wtf import FlaskForm
from wtforms import BooleanField, PasswordField, StringField, validators

class LoginForm(FlaskForm):

	username = StringField('Username', [validators.Length(min=4,max=30)])
	password = PasswordField('Password',[validators.Length(min=4)])

class PasswordResetForm(FlaskForm):
    
    username = StringField('Username', [validators.Length(min=4,max=30)])
    oldpassword = PasswordField('Password',[validators.Length(min=4)])
    newpassword = PasswordField('Password',[validators.Length(min=4)])
    confirmpassword = PasswordField('Password',[validators.Length(min=4)])
