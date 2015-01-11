import os
import urlparse
import logging

import psycopg2

from flask import Flask, abort, jsonify, request

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

# List of valid preferences keys
PREF_KEYS = ('temperature', 'target_address', 'seat_position', 'radio', 'sideview_mirror_left', 'sideview_mirror_right', 'rearview_mirror')

@app.before_first_request
def setup_logging():
    if not app.debug:
        # In production mode, add log handler to sys.stderr.
        app.logger.addHandler(logging.StreamHandler())
        app.logger.setLevel(logging.DEBUG)

@app.route('/')
def index():
    return 'It works! Be my wife?'

@app.route('/login/<username>')
def login(username):
    cur = pgconn.cursor()
    # Check if user id exists
    cur.execute('SELECT ID FROM USERS WHERE USERNAME = %s', (username,))    
    row = cur.fetchone()
    if row is None:
        abort(404)

    app.logger.info(row)

    return jsonify({'userid': row[0]})

def get_user_preferences(user_id):
    cur = pgconn.cursor()
    cur.execute('SELECT "KEY", "VALUE" FROM preferences WHERE ID = %s', (user_id,))
    rows = cur.fetchall()

    preferences = {}

    for row in rows:
        key, value = row
        if key not in PREF_KEYS:
            app.logger.debug('Invalid preferences key: %s' % key)
            continue

        preferences[key] = value

    return preferences

@app.route('/preferences/<int:user_id>', methods=['GET', 'POST'])
def preferences(user_id):
    '''Return or edit preferences of the user'''
    cur = pgconn.cursor()

    # Check if user id exists
    cur.execute('SELECT ID FROM USERS WHERE ID = %s', (user_id,))
    row = cur.fetchone()

    if row is None:
        abort(404)

    if request.method == 'GET':
        result = {'userid': user_id}
        result['preferences'] = get_user_preferences(user_id)

        app.logger.info(get_user_preferences(user_id)   )

        return jsonify(result)

    if request.method == 'POST':
        result = {'userid': user_id}
        for key in request.form:
            value = request.form[key]

            if key not in PREF_KEYS:
                if 'warnings' not in result:
                    result['warnings'] = []
                result['warnings'].append('Invalid key: %s' % key)
                continue

            cur.execute('DELETE FROM preferences WHERE ID = %s AND "KEY" = %s;', (user_id, key))
            cur.execute('INSERT INTO preferences VALUES (%s, %s, %s);', (user_id, key, value))

        pgconn.commit()
        result['preferences'] = get_user_preferences(user_id)
        return jsonify(result)

    abort(500)
