import json

from flask import abort
from flask_login import current_user, login_required
from flask_wtf import FlaskForm
from wtforms import BooleanField, PasswordField, StringField, validators
from werkzeug.security import generate_password_hash

from app import app, db
from app.models import User, AccessLevel


class UserForm(FlaskForm):
	username = StringField('Username', [validators.Length(min=4, max=30)])
	email = StringField('Email')
	isAdmin = BooleanField('Admin?')
	password = PasswordField('Password', [validators.Length(min=4)])
	confirmPassword = PasswordField('Confirm password', [validators.Length(min=4)])


@app.route('/admin/users', methods=['GET'])
@login_required
def user_list():
	if current_user.accessLevel == AccessLevel.Admin:
		db_users = db.session.query(User).all()
		users = [
			{
				'username': user.username,
				'email': user.email,
				'accessLevel': user.accessLevel.value
			}
			for user in db_users
		]
		return json.dumps(users)
	abort(401)

