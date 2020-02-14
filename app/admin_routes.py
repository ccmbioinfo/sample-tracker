import json

from flask import abort, Response, request
from flask_login import current_user, login_required

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
			'isAdmin': user.accessLevel == AccessLevel.Admin
		}
		for user in db_users
	]
	return json.dumps(users)


def validate(request_user: dict):
	if 'username' in request_user and 4 <= len(request_user['username']) <= 30:
		if 'password' in request_user and len(request_user['password']):
			return 'confirmPassword' in request_user and len(request_user['password']) >= 4 and \
				request_user['password'] == request_user['confirmPassword']
		return True
	return False


@app.route('/admin/users', methods=['POST'])
@login_required
def create_user():
	if current_user.accessLevel != AccessLevel.Admin:
		return abort(401)

	rq_user = request.get_json()
	if not validate(rq_user):
		return abort(400)

	db_user = User.query.filter_by(username=rq_user['username']).first()
	if db_user is not None:
		return abort(403)

	if 'password' not in rq_user or 'email' not in rq_user:
		return abort(400)

	role = AccessLevel.Admin if 'isAdmin' in rq_user and rq_user['isAdmin'] else AccessLevel.Regular
	user = User(
		username=rq_user['username'],
		email=rq_user['email'],
		accessLevel=role
	)
	user.set_password(rq_user['password'])
	db.session.add(user)
	try:
		db.session.commit()
		return Response(status=201)
	except:
		db.session.rollback()
		return abort(500)


@app.route('/admin/users', methods=['PUT'])
@login_required
def update_user():
	if current_user.accessLevel != AccessLevel.Admin:
		return abort(401)

	rq_user = request.get_json()
	if not validate(rq_user):
		return abort(400)

	db_user = User.query.filter_by(username=rq_user['username']).first_or_404()
	if 'password' in rq_user and len(rq_user['password']):
		db_user.set_password(rq_user['password'])
	if 'email' in rq_user:
		db_user.email = rq_user['email']
	if 'isAdmin' in rq_user:
		db_user.accessLevel = AccessLevel.Admin if rq_user['isAdmin'] else AccessLevel.Regular
	try:
		db.session.commit()
		return Response(status=204)
	except:
		db.session.rollback()
		return abort(500)


@app.route('/admin/users', methods=['DELETE'])
@login_required
def delete_user():
	if current_user.accessLevel != AccessLevel.Admin:
		return abort(401)

	rq_user = request.get_json()
	if not validate(rq_user):
		return abort(400)

	db_user = User.query.filter_by(username=rq_user['username']).first_or_404()
	try:
		db.session.delete(db_user)
		db.session.commit()
		return Response(status=204)
	except:
		db.session.rollback()
		return abort(500)
