import os
import urlparse
import logging

import psycopg2

from flask import Flask

app = Flask(__name__)

urlparse.uses_netloc.append("postgres")
url = urlparse.urlparse(os.environ["DATABASE_URL"])

pgconn = psycopg2.connect(
    database=url.path[1:],
    user=url.username,
    password=url.password,
    host=url.hostname,
    port=url.port
)

@app.before_first_request
def setup_logging():
    if not app.debug:
        # In production mode, add log handler to sys.stderr.
        app.logger.addHandler(logging.StreamHandler())
        app.logger.setLevel(logging.INFO)

@app.route('/')
def index():
    return 'It works! Be my wife?'

@app.route('/login/<username>')
def login(username):
    cur = pgconn.cursor()
    cur.execute('select * from information_schema.tables')
    app.logger.info(cur.fetchone())

    return 'hi, ' + username

@app.route('/initpg')
def initpg():
    cur = pgconn.cursor()

    cur.execute('CREATE TABLE users ( ID INT PRIMARY KEY NOT NULL, USERNAME VARCHAR(50) NOT NULL, FULLNAME VARCHAR(100) NOT NULL );')
    cur.execute('CREATE TABLE preferences (USERID INT NOT NULL, "KEY" VARCHAR(50), "VALUE" TEXT);')

    return ""
