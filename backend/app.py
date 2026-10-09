from flask import Flask
from flask_cors import CORS
from db import init_db
from routes.movies import movies_bp
from routes.bookings import bookings_bp
from routes.dashboard import dashboard_bp
from routes.sql_playground import sql_bp
from routes.schema import schema_bp

app = Flask(__name__)
CORS(app)

app.register_blueprint(movies_bp, url_prefix='/api')
app.register_blueprint(bookings_bp, url_prefix='/api')
app.register_blueprint(dashboard_bp, url_prefix='/api')
app.register_blueprint(sql_bp, url_prefix='/api')
app.register_blueprint(schema_bp, url_prefix='/api')

if __name__ == '__main__':
    init_db()
    app.run(debug=True, port=5000)
