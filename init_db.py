from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash

app = Flask(__name__)

# SQLite database stored in the "instance" folder as users.db
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///users.db'
# Disable change tracking; it is not needed and uses extra memory
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)


class User(db.Model):
    """A user who is allowed to log in to the app."""
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    # Only the hash is stored, never the plain-text password
    password = db.Column(db.String(200), nullable=False)


def init_db():
    """
    Creates the database from scratch and adds two sample users.

    WARNING: drop_all() deletes every existing table first, so running
    this script wipes any users you added before.
    """
    # Tables are defined through the SQLAlchemy models, which need an
    # application context to work with the database
    with app.app_context():
        db.drop_all()
        db.create_all()

        # Sample accounts for development only.
        # Change these passwords before using the app for real.
        user1 = User(username="admin", password=generate_password_hash("password123"))
        user2 = User(username="user", password=generate_password_hash("mypassword"))

        db.session.add(user1)
        db.session.add(user2)
        db.session.commit()
        print("Database initialized with 2 users.")


if __name__ == '__main__':
    init_db()
