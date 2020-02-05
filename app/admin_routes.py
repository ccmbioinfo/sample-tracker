import json

from flask import abort, Response
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
	password = PasswordField('Password')
	confirmPassword = PasswordField('Confirm password')


@app.route('/admin/users', methods=['GET'])
@login_required
def user_list():
	if current_user.accessLevel != AccessLevel.Admin:
		return abort(401)

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


@app.route('/admin/users', methods=('POST', 'PUT'))
@login_required
def create_update_user():
	if current_user.accessLevel != AccessLevel.Admin:
		return abort(401)

	form = UserForm()
	if form.validate_on_submit():
		user = User.query.filter_by(username=form.username.data)
		if user is None:
			return create_user(form)
		return update_user(user, form)
	else:
		return abort(400)


def create_user(form: UserForm):
	if form.password.data and len(form.password.data) >= 4 and form.password.data == form.confirmPassword.data:
		user = User(
			username=form.username.data,
			email=form.email.data,
			password=generate_password_hash(form.password.data),
			accessLevel=AccessLevel.Admin if form.isAdmin.data else AccessLevel.Regular
		)
		db.session.add(user)
		try:
			db.session.commit()
			return Response(status=201)
		except:
			db.session.rollback()
			return abort(500)
	else:
		return abort(400)


def update_user(user: User, form: UserForm):
	if form.password.data:
		if len(form.password.data) >= 4 and form.password.data == form.confirmPassword.data:
			user.update({'password': generate_password_hash(form.password.data)})
		else:
			return abort(400)
	user.update({
		'email': form.email,
		'accessLevel': AccessLevel.Admin if form.isAdmin.data else AccessLevel.Regular
	})
	try:
		db.session.commit()
		return Response(status=201)
	except:
		db.session.rollback()
		return abort(500)


@app.route('/admin/users', methods=['DELETE'])
@login_required
def delete_user():
	if current_user.accessLevel != AccessLevel.Admin:
		return abort(401)

	form = UserForm()
	if form.validate_on_submit():
		user = User.query.filter_by(username=form.username.data)
		if user is None:
			return abort(404)
		try:
			db.session.delete(user)
			db.session.commit()
			return Response(status=204)
		except:
			db.session.rollback()
			return abort(500)
