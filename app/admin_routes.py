import json

from flask import abort
from flask_login import current_user, login_required
from werkzeug.security import generate_password_hash

from app import app, db
from app.models import User, AccessLevel


@app.route('/admin')
@login_required
def admin():
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

