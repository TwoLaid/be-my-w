import os
import urlparse
import logging

from datetime import timedelta
from functools import update_wrapper

import psycopg2

from flask import Flask, abort, jsonify, request, make_response, current_app

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

def crossdomain(origin=None, methods=None, headers=None,
                max_age=21600, attach_to_all=True,
                automatic_options=True):
    if methods is not None:
        methods = ', '.join(sorted(x.upper() for x in methods))
    if headers is not None and not isinstance(headers, basestring):
        headers = ', '.join(x.upper() for x in headers)
    if not isinstance(origin, basestring):
        origin = ', '.join(origin)
    if isinstance(max_age, timedelta):
        max_age = max_age.total_seconds()

    def get_methods():
        if methods is not None:
            return methods

        options_resp = current_app.make_default_options_response()
        return options_resp.headers['allow']

    def decorator(f):
        def wrapped_function(*args, **kwargs):
            if automatic_options and request.method == 'OPTIONS':
                resp = current_app.make_default_options_response()
            else:
                resp = make_response(f(*args, **kwargs))
            if not attach_to_all and request.method != 'OPTIONS':
                return resp

            h = resp.headers

            h['Access-Control-Allow-Origin'] = origin
            h['Access-Control-Allow-Methods'] = get_methods()
            h['Access-Control-Max-Age'] = str(max_age)
            if headers is not None:
                h['Access-Control-Allow-Headers'] = headers
            return resp

        f.provide_automatic_options = False
        return update_wrapper(wrapped_function, f)
    return decorator

@app.route('/')
def index():
    return 'It works! Be my wife?'

@app.route('/login/<username>')
@crossdomain(origin='*')
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
@crossdomain(origin='*')
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

            # no UPSERT in postgres :(
            cur.execute('DELETE FROM preferences WHERE ID = %s AND "KEY" = %s;', (user_id, key))
            cur.execute('INSERT INTO preferences VALUES (%s, %s, %s);', (user_id, key, value))

        pgconn.commit()
        result['preferences'] = get_user_preferences(user_id)
        return jsonify(result)

    abort(500)

@app.route('/preferences/<int:user_id>/apply/<int:vin>')
@crossdomain(origin='*')
def apply_preferences(user_id, vin):
    '''Apply user preferences to target car'''
    return 'Not implemented yet.'

if __name__ == '__main__':
    app.run(debug=True)
