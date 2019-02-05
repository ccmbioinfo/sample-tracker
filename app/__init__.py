from flask import Flask, render_template,redirect,url_for
from flask_sqlalchemy import SQLAlchemy
from flask_login import LoginManager
from flask_migrate import Migrate
from config import Config
from flask_wtf.csrf import CSRFProtect


app = Flask(__name__, static_folder='../static/dist', template_folder='../static')
app.config.from_object(Config)
csrf = CSRFProtect(app)
login = LoginManager(app)
login.login_view = "login"
login.session_protection = "strong"
db=SQLAlchemy(app)
migrate=Migrate(app,db)

from app import routes
