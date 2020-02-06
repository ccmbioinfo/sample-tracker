import json

from flask import abort, Response, request
from flask_login import current_user, login_required
from werkzeug.security import generate_password_hash

from app import app, db
from app.models import User, AccessLevel


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


def validate(request_user: dict):
	if 'username' in request_user and 4 <= len(request_user['username']) <= 30:
		if 'password' in request_user:
			return 'confirmPassword' in request_user and len(request_user['password']) >= 4 and \
				request_user['password'] == request_user['confirmPassword']
		return True
	return False


@app.route('/admin/users', methods=('POST', 'PUT'))
@login_required
def create_update_user():
	if current_user.accessLevel != AccessLevel.Admin:
		return abort(401)

	rq_user = request.get_json()
	if validate(rq_user):
		db_user = User.query.filter_by(username=rq_user.username)
		if db_user is None:
			return create_user(rq_user)
		return update_user(db_user, rq_user)
	else:
		return abort(400)


def create_user(rq_user: dict):
	if 'password' in rq_user and 'email' in rq_user:
		role = AccessLevel.Admin if 'isAdmin' in rq_user and rq_user['isAdmin'] else AccessLevel.Regular
		user = User(
			username=rq_user['username'],
			email=rq_user['email'],
			password=generate_password_hash(rq_user['password']),
			accessLevel=role
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


def update_user(db_user: User, rq_user: dict):
	if 'password' in rq_user:
		db_user.update({'password': generate_password_hash(rq_user['password'])})
	if 'email' in rq_user:
		db_user.update({'email': rq_user['email']})
	if 'isAdmin' in rq_user:
		role = AccessLevel.Admin if rq_user['isAdmin'] else AccessLevel.Regular
		db_user.update({'accessLevel': role})
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

	rq_user = request.get_json()
	if validate(rq_user):
		db_user = User.query.filter_by(username=rq_user['username'])
		if db_user is None:
			return abort(404)
		try:
			db.session.delete(db_user)
			db.session.commit()
			return Response(status=204)
		except:
			db.session.rollback()
			return abort(500)
