from flask_wtf import FlaskForm
from wtforms import BooleanField, PasswordField, StringField, validators

class LoginForm(FlaskForm):

	username = StringField('Username', [validators.Length(min=4,max=20)])
	password = PasswordField('Password',[validators.Length(min=4)])
