from flask import Blueprint, jsonify
from db import get_db

dashboard_bp = Blueprint('dashboard', __name__)

@dashboard_bp.route('/dashboard/stats', methods=['GET'])
def get_stats():
    conn = get_db()
    stats = {}
    
    stats['total_movies'] = conn.execute("SELECT COUNT(*) FROM movies").fetchone()[0]
    stats['total_theatres'] = conn.execute("SELECT COUNT(*) FROM theatres").fetchone()[0]
    stats['total_shows'] = conn.execute("SELECT COUNT(*) FROM shows").fetchone()[0]
    stats['total_bookings'] = conn.execute("SELECT COUNT(*) FROM bookings WHERE booking_status != 'Cancelled'").fetchone()[0]
    
    revenue = conn.execute("SELECT SUM(amount) FROM payments WHERE payment_status = 'Success'").fetchone()[0]
    stats['total_revenue'] = revenue if revenue else 0.0
    
    conn.close()
    return jsonify(stats)

@dashboard_bp.route('/dashboard/recent-bookings', methods=['GET'])
def get_recent_bookings():
    conn = get_db()
    cursor = conn.execute("""
        SELECT b.booking_id, c.name as customer_name, m.title as movie_title, 
               b.total_amount, b.booking_status, b.booking_date
        FROM bookings b
        JOIN customers c ON b.customer_id = c.customer_id
        JOIN shows s ON b.show_id = s.show_id
        JOIN movies m ON s.movie_id = m.movie_id
        ORDER BY b.booking_id DESC LIMIT 10
    """)
    bookings = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return jsonify(bookings)

@dashboard_bp.route('/dashboard/popular-movies', methods=['GET'])
def get_popular_movies():
    conn = get_db()
    cursor = conn.execute("""
        SELECT m.title, COUNT(b.booking_id) as booking_count
        FROM movies m
        LEFT JOIN shows s ON m.movie_id = s.movie_id
        LEFT JOIN bookings b ON s.show_id = b.show_id AND b.booking_status = 'Confirmed'
        GROUP BY m.movie_id
        ORDER BY booking_count DESC LIMIT 10
    """)
    movies = [{"name": row['title'], "bookings": row['booking_count']} for row in cursor.fetchall()]
    conn.close()
    return jsonify(movies)

@dashboard_bp.route('/dashboard/revenue-chart', methods=['GET'])
def get_revenue_chart():
    conn = get_db()
    cursor = conn.execute("""
        SELECT m.title as name, COALESCE(SUM(p.amount), 0) as revenue
        FROM movies m
        LEFT JOIN shows s ON m.movie_id = s.movie_id
        LEFT JOIN bookings b ON s.show_id = b.show_id
        LEFT JOIN payments p ON b.booking_id = p.booking_id AND p.payment_status = 'Success'
        GROUP BY m.movie_id
        ORDER BY revenue DESC
    """)
    data = [{"name": row['name'], "revenue": row['revenue']} for row in cursor.fetchall()]
    conn.close()
    return jsonify(data)
