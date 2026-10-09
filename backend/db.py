import sqlite3
import os

DB_PATH = os.environ.get('DATABASE_PATH', os.path.join(os.path.dirname(__file__), '..', 'cinedb.sqlite'))

def get_db():
    conn = sqlite3.connect(
        DB_PATH,
        detect_types=sqlite3.PARSE_DECLTYPES
    )
    conn.row_factory = sqlite3.Row
    conn.execute('PRAGMA foreign_keys = ON')
    return conn

def init_db():
    conn = get_db()
    with conn:
        conn.executescript("""
        CREATE TABLE IF NOT EXISTS customers (
            customer_id INTEGER PRIMARY KEY AUTOINCREMENT,
            name        TEXT NOT NULL,
            email       TEXT NOT NULL UNIQUE,
            phone       TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS movies (
            movie_id         INTEGER PRIMARY KEY AUTOINCREMENT,
            title            TEXT NOT NULL,
            genre            TEXT NOT NULL,
            language         TEXT NOT NULL DEFAULT 'English',
            duration_minutes INTEGER NOT NULL CHECK(duration_minutes > 0),
            release_date     TEXT NOT NULL,
            rating           REAL NOT NULL DEFAULT 0 CHECK(rating >= 0 AND rating <= 10),
            description      TEXT,
            poster_color     TEXT DEFAULT '#e50914'
        );

        CREATE TABLE IF NOT EXISTS theatres (
            theatre_id   INTEGER PRIMARY KEY AUTOINCREMENT,
            theatre_name TEXT NOT NULL,
            city         TEXT NOT NULL,
            address      TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS screens (
            screen_id    INTEGER PRIMARY KEY AUTOINCREMENT,
            theatre_id   INTEGER NOT NULL REFERENCES theatres(theatre_id) ON DELETE CASCADE,
            screen_name  TEXT NOT NULL,
            total_seats  INTEGER NOT NULL CHECK(total_seats > 0)
        );

        CREATE TABLE IF NOT EXISTS seats (
            seat_id     INTEGER PRIMARY KEY AUTOINCREMENT,
            screen_id   INTEGER NOT NULL REFERENCES screens(screen_id) ON DELETE CASCADE,
            seat_number TEXT NOT NULL,
            seat_type   TEXT NOT NULL DEFAULT 'Standard' CHECK(seat_type IN ('Standard','Premium','VIP'))
        );

        CREATE TABLE IF NOT EXISTS shows (
            show_id      INTEGER PRIMARY KEY AUTOINCREMENT,
            movie_id     INTEGER NOT NULL REFERENCES movies(movie_id) ON DELETE CASCADE,
            screen_id    INTEGER NOT NULL REFERENCES screens(screen_id) ON DELETE CASCADE,
            show_date    TEXT NOT NULL,
            show_time    TEXT NOT NULL,
            ticket_price REAL NOT NULL CHECK(ticket_price > 0)
        );

        CREATE TABLE IF NOT EXISTS bookings (
            booking_id     INTEGER PRIMARY KEY AUTOINCREMENT,
            customer_id    INTEGER NOT NULL REFERENCES customers(customer_id),
            show_id        INTEGER NOT NULL REFERENCES shows(show_id),
            booking_date   TEXT NOT NULL DEFAULT (date('now')),
            total_amount   REAL NOT NULL CHECK(total_amount >= 0),
            booking_status TEXT NOT NULL DEFAULT 'Confirmed' CHECK(booking_status IN ('Confirmed','Cancelled','Pending'))
        );

        CREATE TABLE IF NOT EXISTS booking_seats (
            booking_id   INTEGER NOT NULL REFERENCES bookings(booking_id) ON DELETE CASCADE,
            seat_id      INTEGER NOT NULL REFERENCES seats(seat_id),
            show_id      INTEGER NOT NULL REFERENCES shows(show_id),
            ticket_price REAL NOT NULL CHECK(ticket_price > 0),
            PRIMARY KEY (booking_id, seat_id),
            UNIQUE(show_id, seat_id)
        );

        CREATE TABLE IF NOT EXISTS payments (
            payment_id     INTEGER PRIMARY KEY AUTOINCREMENT,
            booking_id     INTEGER NOT NULL REFERENCES bookings(booking_id) ON DELETE CASCADE,
            amount         REAL NOT NULL CHECK(amount > 0),
            payment_method TEXT NOT NULL DEFAULT 'Card' CHECK(payment_method IN ('Card','UPI','Cash','NetBanking')),
            payment_status TEXT NOT NULL DEFAULT 'Success' CHECK(payment_status IN ('Success','Pending','Failed')),
            payment_date   TEXT NOT NULL DEFAULT (datetime('now'))
        );

        CREATE INDEX IF NOT EXISTS idx_shows_movie ON shows(movie_id);
        CREATE INDEX IF NOT EXISTS idx_bookings_customer ON bookings(customer_id);
        CREATE INDEX IF NOT EXISTS idx_bookings_show ON bookings(show_id);
        """)

    cursor = conn.execute("SELECT COUNT(*) FROM movies")
    count = cursor.fetchone()[0]
    if count == 0:
        seed_db(conn)
    conn.close()

def seed_db(conn):
    # Seed data: 8 movies, 3 theatres, 4 screens, 20+ seats per screen, 10 shows, 8 customers, 12 bookings with booking_seats, 10 payments.
    conn.executescript("""
        INSERT INTO movies (title, genre, language, duration_minutes, release_date, rating, description, poster_color) VALUES 
        ('Inception', 'Sci-Fi', 'English', 148, '2010-07-16', 8.8, 'A thief who steals corporate secrets through the use of dream-sharing technology.', '#000000'),
        ('The Dark Knight', 'Action', 'English', 152, '2008-07-18', 9.0, 'When the menace known as the Joker wreaks havoc and chaos on the people of Gotham.', '#1a1a1a'),
        ('Interstellar', 'Sci-Fi', 'English', 169, '2014-11-07', 8.6, 'A team of explorers travel through a wormhole in space in an attempt to ensure humanity''s survival.', '#2b2b2b'),
        ('Avengers: Endgame', 'Action', 'English', 181, '2019-04-26', 8.4, 'After the devastating events of Infinity War, the universe is in ruins.', '#4a148c'),
        ('Spider-Man: No Way Home', 'Action', 'English', 148, '2021-12-17', 8.3, 'With Spider-Man''s identity now revealed, Peter asks Doctor Strange for help.', '#b71c1c'),
        ('The Lion King', 'Animation', 'English', 118, '2019-07-19', 6.8, 'After the murder of his father, a young lion prince flees his kingdom only to learn the true meaning of responsibility and bravery.', '#f57f17'),
        ('Joker', 'Drama', 'English', 122, '2019-10-04', 8.4, 'In Gotham City, mentally troubled comedian Arthur Fleck is disregarded and mistreated by society.', '#1b5e20'),
        ('Parasite', 'Thriller', 'Korean', 132, '2019-05-30', 8.5, 'Greed and class discrimination threaten the newly formed symbiotic relationship between the wealthy Park family and the destitute Kim clan.', '#3e2723'),
        ('Dune: Part Two', 'Sci-Fi', 'English', 166, '2024-03-01', 8.8, 'Paul Atreides unites with Chani and the Fremen while on a warpath of revenge.', '#d2b48c'),
        ('RRR', 'Action', 'Telugu', 187, '2022-03-24', 7.8, 'A fictitious story about two legendary revolutionaries and their journey away from home.', '#8b0000');

        INSERT INTO theatres (theatre_name, city, address) VALUES
        ('Cinemark 1', 'New York', '123 Broadway St'),
        ('AMC Theatre', 'Los Angeles', '456 Hollywood Blvd'),
        ('Regal Cinemas', 'Chicago', '789 State St');

        INSERT INTO screens (theatre_id, screen_name, total_seats) VALUES
        (1, 'Screen A', 20),
        (1, 'Screen B', 20),
        (2, 'IMAX 1', 24),
        (3, 'Standard 1', 20);

        INSERT INTO customers (name, email, phone) VALUES
        ('Alice Smith', 'alice@example.com', '1234567890'),
        ('Bob Jones', 'bob@example.com', '0987654321'),
        ('Charlie Brown', 'charlie@example.com', '1122334455'),
        ('David Lee', 'david@example.com', '2233445566'),
        ('Eve Davis', 'eve@example.com', '3344556677'),
        ('Frank Wright', 'frank@example.com', '4455667788'),
        ('Grace Hopper', 'grace@example.com', '5566778899'),
        ('Hank Green', 'hank@example.com', '6677889900');
    """)

    # Insert seats for screens
    for screen_id, seats in [(1, 20), (2, 20), (3, 24), (4, 20)]:
        for i in range(1, seats + 1):
            row = (i - 1) // 10
            col = (i - 1) % 10 + 1
            seat_number = f"{chr(65 + row)}{col}"
            seat_type = 'Premium' if row > 0 else 'Standard'
            conn.execute("INSERT INTO seats (screen_id, seat_number, seat_type) VALUES (?, ?, ?)", (screen_id, seat_number, seat_type))
            
    conn.executescript("""
        INSERT INTO shows (movie_id, screen_id, show_date, show_time, ticket_price) VALUES
        (1, 1, '2023-11-01', '10:00', 15.0),
        (2, 2, '2023-11-01', '13:00', 18.0),
        (3, 3, '2023-11-01', '16:00', 20.0),
        (4, 4, '2023-11-01', '19:00', 12.0),
        (5, 1, '2023-11-02', '10:00', 15.0),
        (6, 2, '2023-11-02', '13:00', 18.0),
        (7, 3, '2023-11-02', '16:00', 20.0),
        (8, 4, '2023-11-02', '19:00', 12.0),
        (1, 3, '2023-11-03', '21:00', 25.0),
        (2, 1, '2023-11-03', '22:00', 15.0);
        
        INSERT INTO bookings (customer_id, show_id, booking_date, total_amount, booking_status) VALUES
        (1, 1, '2023-10-25', 30.0, 'Confirmed'),
        (2, 1, '2023-10-25', 15.0, 'Confirmed'),
        (3, 2, '2023-10-26', 36.0, 'Confirmed'),
        (4, 3, '2023-10-26', 40.0, 'Confirmed'),
        (5, 4, '2023-10-27', 24.0, 'Confirmed'),
        (6, 5, '2023-10-27', 15.0, 'Confirmed'),
        (7, 6, '2023-10-28', 18.0, 'Confirmed'),
        (8, 7, '2023-10-28', 40.0, 'Confirmed'),
        (1, 8, '2023-10-29', 12.0, 'Confirmed'),
        (2, 9, '2023-10-29', 50.0, 'Confirmed'),
        (3, 10, '2023-10-30', 30.0, 'Confirmed'),
        (4, 1, '2023-10-30', 15.0, 'Cancelled');
        
        INSERT INTO booking_seats (booking_id, seat_id, show_id, ticket_price) VALUES
        (1, 1, 1, 15.0), (1, 2, 1, 15.0),
        (2, 3, 1, 15.0),
        (3, 21, 2, 18.0), (3, 22, 2, 18.0),
        (4, 41, 3, 20.0), (4, 42, 3, 20.0),
        (5, 65, 4, 12.0), (5, 66, 4, 12.0),
        (6, 4, 5, 15.0),
        (7, 25, 6, 18.0),
        (8, 45, 7, 20.0), (8, 46, 7, 20.0),
        (9, 68, 8, 12.0),
        (10, 50, 9, 25.0), (10, 51, 9, 25.0),
        (11, 8, 10, 15.0), (11, 9, 10, 15.0);

        INSERT INTO payments (booking_id, amount, payment_method, payment_status, payment_date) VALUES
        (1, 30.0, 'Card', 'Success', '2023-10-25 10:00:00'),
        (2, 15.0, 'UPI', 'Success', '2023-10-25 11:00:00'),
        (3, 36.0, 'NetBanking', 'Success', '2023-10-26 12:00:00'),
        (4, 40.0, 'Card', 'Success', '2023-10-26 13:00:00'),
        (5, 24.0, 'Cash', 'Success', '2023-10-27 14:00:00'),
        (6, 15.0, 'Card', 'Success', '2023-10-27 15:00:00'),
        (7, 18.0, 'UPI', 'Success', '2023-10-28 16:00:00'),
        (8, 40.0, 'NetBanking', 'Success', '2023-10-28 17:00:00'),
        (9, 12.0, 'Card', 'Success', '2023-10-29 18:00:00'),
        (10, 50.0, 'UPI', 'Success', '2023-10-29 19:00:00'),
        (11, 30.0, 'Card', 'Success', '2023-10-30 20:00:00'),
        (12, 15.0, 'Card', 'Failed', '2023-10-30 21:00:00');
    """)

def reset_db():
    conn = get_db()
    with conn:
        conn.executescript("""
            PRAGMA foreign_keys = OFF;
            DROP TABLE IF EXISTS payments;
            DROP TABLE IF EXISTS booking_seats;
            DROP TABLE IF EXISTS bookings;
            DROP TABLE IF EXISTS shows;
            DROP TABLE IF EXISTS seats;
            DROP TABLE IF EXISTS screens;
            DROP TABLE IF EXISTS theatres;
            DROP TABLE IF EXISTS movies;
            DROP TABLE IF EXISTS customers;
            PRAGMA foreign_keys = ON;
        """)
    conn.close()
    init_db()

