from flask import Blueprint, request, jsonify
from db import get_db
import sqlite3

bookings_bp = Blueprint('bookings', __name__)

@bookings_bp.route('/bookings', methods=['GET'])
def get_bookings():
    conn = get_db()
    customer_id = request.args.get('customer_id')
    status = request.args.get('status')
    
    query = """
        SELECT b.*, c.name as customer_name, m.title as movie_title, 
               s.show_date, s.show_time, sc.screen_name, t.theatre_name
        FROM bookings b
        JOIN customers c ON b.customer_id = c.customer_id
        JOIN shows s ON b.show_id = s.show_id
        JOIN movies m ON s.movie_id = m.movie_id
        JOIN screens sc ON s.screen_id = sc.screen_id
        JOIN theatres t ON sc.theatre_id = t.theatre_id
        WHERE 1=1
    """
    params = []
    
    if customer_id:
        query += " AND b.customer_id = ?"
        params.append(customer_id)
    if status:
        query += " AND b.booking_status = ?"
        params.append(status)
        
    cursor = conn.execute(query, params)
    bookings = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return jsonify(bookings)

@bookings_bp.route('/bookings/<int:booking_id>', methods=['GET'])
def get_booking(booking_id):
    conn = get_db()
    cursor = conn.execute("""
        SELECT b.*, c.name as customer_name, c.email, m.title as movie_title, 
               s.show_date, s.show_time, sc.screen_name, t.theatre_name
        FROM bookings b
        JOIN customers c ON b.customer_id = c.customer_id
        JOIN shows s ON b.show_id = s.show_id
        JOIN movies m ON s.movie_id = m.movie_id
        JOIN screens sc ON s.screen_id = sc.screen_id
        JOIN theatres t ON sc.theatre_id = t.theatre_id
        WHERE b.booking_id = ?
    """, (booking_id,))
    booking = cursor.fetchone()
    if not booking:
        conn.close()
        return jsonify({"error": "Booking not found"}), 404
        
    booking_dict = dict(booking)
    
    cursor = conn.execute("""
        SELECT bs.seat_id, st.seat_number, st.seat_type, bs.ticket_price
        FROM booking_seats bs
        JOIN seats st ON bs.seat_id = st.seat_id
        WHERE bs.booking_id = ?
    """, (booking_id,))
    booking_dict['seats'] = [dict(row) for row in cursor.fetchall()]
    conn.close()
    
    return jsonify(booking_dict)

@bookings_bp.route('/bookings', methods=['POST'])
def create_booking():
    data = request.get_json()
    required = ['customer_id', 'show_id', 'seat_ids', 'payment_method']
    if not all(k in data for k in required):
        return jsonify({"error": "Missing required fields"}), 400
        
    seat_ids = data['seat_ids']
    if not seat_ids:
        return jsonify({"error": "No seats selected"}), 400
        
    conn = get_db()
    try:
        conn.execute('BEGIN')
        
        cursor = conn.execute("SELECT ticket_price FROM shows WHERE show_id = ?", (data['show_id'],))
        show = cursor.fetchone()
        if not show:
            conn.rollback()
            return jsonify({"error": "Show not found"}), 404
            
        ticket_price = show['ticket_price']
        total_amount = ticket_price * len(seat_ids)
        
        cursor = conn.execute("""
            INSERT INTO bookings (customer_id, show_id, total_amount, booking_status)
            VALUES (?, ?, ?, 'Confirmed')
        """, (data['customer_id'], data['show_id'], total_amount))
        booking_id = cursor.lastrowid
        
        for seat_id in seat_ids:
            conn.execute("""
                INSERT INTO booking_seats (booking_id, seat_id, show_id, ticket_price)
                VALUES (?, ?, ?, ?)
            """, (booking_id, seat_id, data['show_id'], ticket_price))
            
        conn.execute("""
            INSERT INTO payments (booking_id, amount, payment_method, payment_status)
            VALUES (?, ?, ?, 'Success')
        """, (booking_id, total_amount, data['payment_method']))
        
        conn.commit()
        return jsonify({"booking_id": booking_id, "total_amount": total_amount}), 201
        
    except sqlite3.IntegrityError as e:
        conn.rollback()
        return jsonify({"error": "Seat already booked or constraint violation", "details": str(e)}), 409
    except Exception as e:
        conn.rollback()
        return jsonify({"error": str(e)}), 500
    finally:
        conn.close()

@bookings_bp.route('/bookings/<int:booking_id>/cancel', methods=['PUT'])
def cancel_booking(booking_id):
    conn = get_db()
    try:
        conn.execute('BEGIN')
        cursor = conn.execute("UPDATE bookings SET booking_status = 'Cancelled' WHERE booking_id = ?", (booking_id,))
        if cursor.rowcount == 0:
            conn.rollback()
            return jsonify({"error": "Booking not found"}), 404
            
        conn.execute("DELETE FROM booking_seats WHERE booking_id = ?", (booking_id,))
        conn.execute("UPDATE payments SET payment_status = 'Failed' WHERE booking_id = ?", (booking_id,))
        
        conn.commit()
        return jsonify({"message": "Booking cancelled successfully"})
    except Exception as e:
        conn.rollback()
        return jsonify({"error": str(e)}), 500
    finally:
        conn.close()

@bookings_bp.route('/shows', methods=['GET'])
def get_shows():
    conn = get_db()
    cursor = conn.execute("""
        SELECT s.*, m.title as movie_title, sc.screen_name, t.theatre_name
        FROM shows s
        JOIN movies m ON s.movie_id = m.movie_id
        JOIN screens sc ON s.screen_id = sc.screen_id
        JOIN theatres t ON sc.theatre_id = t.theatre_id
    """)
    shows = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return jsonify(shows)

@bookings_bp.route('/shows/<int:show_id>', methods=['GET'])
def get_show(show_id):
    conn = get_db()
    cursor = conn.execute("""
        SELECT s.*, m.title as movie_title, sc.screen_name, t.theatre_name
        FROM shows s
        JOIN movies m ON s.movie_id = m.movie_id
        JOIN screens sc ON s.screen_id = sc.screen_id
        JOIN theatres t ON sc.theatre_id = t.theatre_id
        WHERE s.show_id = ?
    """, (show_id,))
    show = cursor.fetchone()
    conn.close()
    if show:
        return jsonify(dict(show))
    return jsonify({"error": "Show not found"}), 404

@bookings_bp.route('/shows/<int:show_id>/seats', methods=['GET'])
def get_show_seats(show_id):
    conn = get_db()
    cursor = conn.execute("SELECT screen_id FROM shows WHERE show_id = ?", (show_id,))
    show = cursor.fetchone()
    if not show:
        conn.close()
        return jsonify({"error": "Show not found"}), 404
        
    cursor = conn.execute("""
        SELECT s.seat_id, s.seat_number, s.seat_type,
               CASE WHEN bs.seat_id IS NOT NULL THEN 1 ELSE 0 END as is_booked
        FROM seats s
        LEFT JOIN booking_seats bs ON s.seat_id = bs.seat_id AND bs.show_id = ?
        WHERE s.screen_id = ?
    """, (show_id, show['screen_id']))
    seats = [{"seat_id": row['seat_id'], "seat_number": row['seat_number'], "seat_type": row['seat_type'], "is_booked": bool(row['is_booked'])} for row in cursor.fetchall()]
    conn.close()
    return jsonify(seats)

@bookings_bp.route('/customers', methods=['GET'])
def get_customers():
    conn = get_db()
    cursor = conn.execute("SELECT * FROM customers")
    customers = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return jsonify(customers)

@bookings_bp.route('/customers', methods=['POST'])
def create_customer():
    data = request.get_json()
    if not all(k in data for k in ['name', 'email', 'phone']):
        return jsonify({"error": "Missing required fields"}), 400
        
    conn = get_db()
    try:
        cursor = conn.execute("INSERT INTO customers (name, email, phone) VALUES (?, ?, ?)", 
                            (data['name'], data['email'], data['phone']))
        conn.commit()
        return jsonify({"customer_id": cursor.lastrowid}), 201
    except sqlite3.IntegrityError:
        conn.rollback()
        return jsonify({"error": "Email already exists"}), 409
    finally:
        conn.close()

@bookings_bp.route('/theatres', methods=['GET'])
def get_theatres():
    conn = get_db()
    cursor = conn.execute("SELECT * FROM theatres")
    theatres = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return jsonify(theatres)
