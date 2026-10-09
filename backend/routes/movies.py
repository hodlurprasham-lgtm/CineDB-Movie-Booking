from flask import Blueprint, request, jsonify
from db import get_db
import sqlite3

movies_bp = Blueprint('movies', __name__)

@movies_bp.route('/movies', methods=['GET'])
def get_movies():
    conn = get_db()
    search = request.args.get('search', '')
    genre = request.args.get('genre', '')
    language = request.args.get('language', '')
    
    query = "SELECT * FROM movies WHERE 1=1"
    params = []
    
    if search:
        query += " AND title LIKE ?"
        params.append(f"%{search}%")
    if genre:
        query += " AND genre = ?"
        params.append(genre)
    if language:
        query += " AND language = ?"
        params.append(language)
        
    cursor = conn.execute(query, params)
    movies = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return jsonify(movies)

@movies_bp.route('/movies/<int:movie_id>', methods=['GET'])
def get_movie(movie_id):
    conn = get_db()
    cursor = conn.execute("SELECT * FROM movies WHERE movie_id = ?", (movie_id,))
    movie = cursor.fetchone()
    conn.close()
    if movie:
        return jsonify(dict(movie))
    return jsonify({"error": "Movie not found"}), 404

@movies_bp.route('/movies', methods=['POST'])
def create_movie():
    data = request.get_json()
    required = ['title', 'genre', 'duration_minutes', 'release_date']
    if not all(k in data for k in required):
        return jsonify({"error": "Missing required fields"}), 400
        
    conn = get_db()
    try:
        cursor = conn.execute("""
            INSERT INTO movies (title, genre, language, duration_minutes, release_date, rating, description, poster_color)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            data['title'],
            data['genre'],
            data.get('language', 'English'),
            data['duration_minutes'],
            data['release_date'],
            data.get('rating', 0),
            data.get('description', ''),
            data.get('poster_color', '#e50914')
        ))
        conn.commit()
        movie_id = cursor.lastrowid
        return jsonify({"movie_id": movie_id, "message": "Movie created"}), 201
    except sqlite3.Error as e:
        conn.rollback()
        return jsonify({"error": str(e)}), 400
    finally:
        conn.close()

@movies_bp.route('/movies/<int:movie_id>', methods=['PUT'])
def update_movie(movie_id):
    data = request.get_json()
    conn = get_db()
    try:
        cursor = conn.execute("SELECT * FROM movies WHERE movie_id = ?", (movie_id,))
        if not cursor.fetchone():
            return jsonify({"error": "Movie not found"}), 404
            
        fields = []
        params = []
        for key in ['title', 'genre', 'language', 'duration_minutes', 'release_date', 'rating', 'description', 'poster_color']:
            if key in data:
                fields.append(f"{key} = ?")
                params.append(data[key])
                
        if not fields:
            return jsonify({"error": "No fields to update"}), 400
            
        params.append(movie_id)
        conn.execute(f"UPDATE movies SET {', '.join(fields)} WHERE movie_id = ?", params)
        conn.commit()
        return jsonify({"message": "Movie updated"})
    except sqlite3.Error as e:
        conn.rollback()
        return jsonify({"error": str(e)}), 400
    finally:
        conn.close()

@movies_bp.route('/movies/<int:movie_id>', methods=['DELETE'])
def delete_movie(movie_id):
    conn = get_db()
    try:
        cursor = conn.execute("""
            SELECT 1 FROM bookings b
            JOIN shows s ON b.show_id = s.show_id
            WHERE s.movie_id = ? AND b.booking_status != 'Cancelled'
            LIMIT 1
        """, (movie_id,))
        if cursor.fetchone():
            return jsonify({"error": "Cannot delete movie with active bookings"}), 409
            
        cursor = conn.execute("DELETE FROM movies WHERE movie_id = ?", (movie_id,))
        if cursor.rowcount == 0:
            return jsonify({"error": "Movie not found"}), 404
        conn.commit()
        return jsonify({"message": "Movie deleted"})
    except sqlite3.Error as e:
        conn.rollback()
        return jsonify({"error": str(e)}), 400
    finally:
        conn.close()

@movies_bp.route('/movies/<int:movie_id>/shows', methods=['GET'])
def get_movie_shows(movie_id):
    conn = get_db()
    cursor = conn.execute("""
        SELECT s.*, sc.screen_name, t.theatre_name, t.city
        FROM shows s
        JOIN screens sc ON s.screen_id = sc.screen_id
        JOIN theatres t ON sc.theatre_id = t.theatre_id
        WHERE s.movie_id = ?
    """, (movie_id,))
    shows = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return jsonify(shows)

@movies_bp.route('/movies/genres', methods=['GET'])
def get_genres():
    conn = get_db()
    cursor = conn.execute("SELECT DISTINCT genre FROM movies")
    genres = [row['genre'] for row in cursor.fetchall()]
    conn.close()
    return jsonify(genres)

@movies_bp.route('/movies/languages', methods=['GET'])
def get_languages():
    conn = get_db()
    cursor = conn.execute("SELECT DISTINCT language FROM movies")
    languages = [row['language'] for row in cursor.fetchall()]
    conn.close()
    return jsonify(languages)
