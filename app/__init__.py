from flask import Flask, render_template,redirect,url_for
from flask_talisman import Talisman
from flask_sqlalchemy import SQLAlchemy
from flask_login import LoginManager
from flask_migrate import Migrate
from config import Config
from flask_wtf.csrf import CSRFProtect

csp = {
    'default-src': [
        '\'self\''
    ],
    'script-src': ['\'self\'','\'unsafe-inline\''],
    'style-src': ['\'self\'','\'unsafe-inline\''],
    'img-src': ['\'self\'','data:'],
}

app = Flask(__name__, static_folder='../static/dist', template_folder='../static')
app.config.from_object(Config)
talisman = Talisman(app, content_security_policy=csp)
csrf = CSRFProtect(app)
login = LoginManager(app)
login.login_view = "login"
login.session_protection = "strong"
db=SQLAlchemy(app)
migrate=Migrate(app,db)

from app import gene_report_routes
from app import routes
