# sample-tracker

sample-tracker: a light weight flask,react and MySQL based web app to store and track status of incoming samples and their associated information.

### Update instructions
    Once you pull a latest copy of Sample-Tracker , use the following commands to update the schema and JS bundle
    ```
        npm run build # to update JS bunble
        export FLASK_APP=sample_tracker.py
        flask db upgrade # to update database schema if necessary
    ```
    Once you update JS bundle and db schema, restart flask server for changes to take effect.

### Installation instructions for ubuntu
  Please make sure that your account has sudo permissions before proceeding with these installation steps and commands.
  ```
   apt-get update
   apt-get install -y python3 python3-pip git mysql-server vim npm
  ```
  Then, start mysql-server using

 ```
    service mysql start
  ```

 Clone this git repo into your current working directory using
 ```
  cd sample-tracker
  git clone https://github.com/ccmbioinfo/sample-tracker
 ```

 After cloning, ```cd``` into the clone'd repo folder and install python3 modules using
 ```
  pip3 install -r requirements.txt
 ```

 After installing python3 modules, ```cd``` into ```static``` folder and install JS dependencies using
 ```
    cd static
    npm install -g
 ```

Then, create the minifi'ed JS bundle using the command
  ```
    npm run build
  ```

  Now access the mysql command line using the command ```mysql -u root``` and create a new user in mysql. The following command creates a user 'test' and grants the user all priviliges to the database ```sample_tracker```. Change the username from 'test' to whatever you see fit.
  ```
    mysql -uroot
    create user 'test'@'localhost' identified by 'test';
    create database sample_tracker;
    grant all privileges on sample_tracker.* to 'test'@'localhost';
  ```

  Once this user is created, create a python class config.py in the sample-tracker root folder that will contain the following lines.

  ```
    cd .. # if you are in static folder. if not, make sure that you are in the sample-tracker folder (root folder).
    vim config.py # this could be any editor. I use vim.
    # add the following lines to config.py
    import os

    class Config(object):
      SECRET_KEY = 'YOUR_SECRET_KEY' # this should be a long random string
      SQLALCHEMY_DATABASE_URI = 'mysql+pymysql://test:test@localhost/sample_tracker' #replace test:test with the username and password you used to create a new user in mysql.
      SQLALCHEMY_TRACK_MODIFICATIONS=False
  ```

  Now create a directory for downloading gene level reports:

  ```
    mkdir gene_reports
    mv ~/2019-12-12.sample_wise.csv ./gene_reports
    mv ~/2019-12-12.variant_wise.csv ./gene_reports
  ```

  Sample wise and variant wise reports should contain counts of variants occuring across samples in the cohort. The reports have one requirement --- they must contain a column called "Gene".
  Python scripts to generate these reports from our typical WES reports are here: https://github.com/dennis-kao/cre/tree/master/gene.database

  sample-tracker uses flask-talisman module to https'ise traffic by default, which will not work unless you deploy the website with gunicorn, nginx and with a  proper https keys. Lets comment this module for our test instance to work.

  Open the script ```app/__init__.py``` in your favorite editor and comment out the following lines - To comment lines in python, insert the character '#' at the front of the line as shown below.
  ```
  from flask import Flask, render_template,redirect,url_for
  #from flask_talisman import Talisman # COMMENT THIS LINE
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
  #talisman = Talisman(app, content_security_policy=csp) #COMMENT THIS LINE
  csrf = CSRFProtect(app)
  login = LoginManager(app)
  login.login_view = "login"
  login.session_protection = "strong"
  db=SQLAlchemy(app)
  migrate=Migrate(app,db)

  from app import routes

  ```
  Now, initialize the database with sample-tracker's latest schema by using the following commands (from the root folder)

  ```
    export FLASK_APP=sample_tracker.py
    export LC_ALL=C.UTF-8
    export LANG=C.UTF-8
    flask db upgrade
  ```
  Finally, start the development flask server using the following command

  ```
    flask run --host=0.0.0.0

  ```

  Now, you should be able to access sample-tracker at ```http://localhost:5000```

  As discussed above, this setup of sample-tracker without https, gunicorn, nginx and flask-talisman should only be used for **testing purposes**. If you want to deploy sample-tracker, please serve flask using gunicorn, nginx and https'ise sample-tracker's traffic using flask-talisman (i.e. uncomment the  flask-talisman lines from app/__init__.py and use a https key to secure the traffic).

  Teja
