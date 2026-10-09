# CineDB — Movie Booking Management System

A complete full-stack DBMS web application for demonstrating real SQL execution (DDL, DML, DQL) built for a college DBMS project.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + Vite 5 + Tailwind CSS 3 + Recharts |
| Backend | Python Flask 3 + Flask-CORS |
| Database | SQLite (file: `cinedb.sqlite` at project root) |
| Navigation | React Router v6 |
| Icons | Lucide React |

---

## Project Structure

```
DBMS PROJECT INDIVIDUAL/
├── backend/
│   ├── app.py                  # Flask entry point
│   ├── db.py                   # Schema, seed data, reset
│   ├── requirements.txt
│   └── routes/
│       ├── __init__.py
│       ├── bookings.py         # Booking/payment/shows/customers
│       ├── dashboard.py        # Stats and chart data
│       ├── movies.py           # Movie CRUD
│       ├── schema.py           # Table metadata and ER data
│       └── sql_playground.py   # Free-form SQL execution
├── frontend/
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── src/
│       ├── App.jsx
│       ├── main.jsx
│       ├── index.css
│       ├── components/
│       │   ├── Sidebar.jsx
│       │   └── ui/
│       │       ├── Badge.jsx
│       │       ├── LoadingSpinner.jsx
│       │       ├── Modal.jsx
│       │       ├── StatCard.jsx
│       │       └── Toast.jsx
│       └── pages/
│           ├── Dashboard.jsx   # Stats, charts, recent bookings
│           ├── Movies.jsx      # Movie cards + CRUD
│           ├── Booking.jsx     # 4-step booking wizard
│           ├── SqlPlayground.jsx # SQL editor (THE main feature)
│           ├── TableManager.jsx  # Browse all tables
│           ├── SchemaViz.jsx     # ER diagram
│           └── Learn.jsx         # Educational content
└── cinedb.sqlite               # Auto-created on first run
```

---

## Quick Start

### Prerequisites
- Python 3.9+
- Node.js 18+

### Step 1: Backend Setup

```bash
cd backend
pip install flask flask-cors
python app.py
```

The backend will start at `http://localhost:5000` and automatically:
- Create the SQLite database (`../cinedb.sqlite`)
- Create all 9 tables with constraints
- Seed realistic sample data (10 movies, 8 customers, 12 bookings, etc.)

### Step 2: Frontend Setup

Open a **new terminal**:

```bash
cd frontend
npm install
npm run dev
```

The frontend will start at `http://localhost:5173`

### Step 3: Open the App

Navigate to **http://localhost:5173** in your browser.

---

## Database Schema

### Tables

| Table | Key Columns | Constraints |
|-------|-------------|-------------|
| `customers` | customer_id (PK), name, email, phone | email UNIQUE, NOT NULL |
| `movies` | movie_id (PK), title, genre, language, duration_minutes, release_date, rating | duration > 0, rating 0-10 |
| `theatres` | theatre_id (PK), theatre_name, city, address | NOT NULL |
| `screens` | screen_id (PK), theatre_id (FK), screen_name, total_seats | total_seats > 0 |
| `seats` | seat_id (PK), screen_id (FK), seat_number, seat_type | seat_type IN (Standard, Premium, VIP) |
| `shows` | show_id (PK), movie_id (FK), screen_id (FK), show_date, show_time, ticket_price | ticket_price > 0 |
| `bookings` | booking_id (PK), customer_id (FK), show_id (FK), booking_date, total_amount, booking_status | status IN (Confirmed, Cancelled, Pending) |
| `booking_seats` | (booking_id, seat_id) composite PK, show_id (FK), ticket_price | UNIQUE(show_id, seat_id) — prevents double booking |
| `payments` | payment_id (PK), booking_id (FK), amount, payment_method, payment_status | method IN (Card, UPI, Cash, NetBanking) |

### Duplicate Seat Prevention
The `UNIQUE(show_id, seat_id)` constraint on `booking_seats` ensures no seat can be booked twice for the same show. When a booking is cancelled, its `booking_seats` rows are deleted (freeing the seats). `PRAGMA foreign_keys = ON` is set on every connection.

---

## Pages

| Page | Route | Description |
|------|-------|-------------|
| Dashboard | `/` | Stats, revenue chart, popular movies, recent bookings |
| Movies | `/movies` | Movie cards with search/filter, add/edit/delete |
| Booking | `/booking` | 4-step wizard: Show → Seats → Customer → Confirm |
| SQL Playground | `/sql` | **Real SQL editor** — execute DDL/DML/DQL against the live DB |
| Table Manager | `/tables` | Browse all table data with column metadata |
| Schema | `/schema` | ER diagram showing all entities and relationships |
| Learn DBMS | `/learn` | Educational content: DDL, DML, DQL, Joins, Normalization, Transactions |

---

## SQL Playground Features

- **Real SQL execution** — every query runs against `cinedb.sqlite`
- **20+ example queries** categorized as DDL / DML / DQL
- **Schema explorer** — expandable table tree with column types, PKs, FKs
- **Query history** — last 20 queries with success/failure indicators
- **Reset DB** button — drops all tables and reseeds (with confirmation)
- **Execution time** and row count displayed for every query
- Error messages show actual SQLite error text

### Security
- `ATTACH` and `DETACH` are blocked (no external DB access)
- All application CRUD endpoints use parameterized queries
- Table data browsing validates table names against allow-list

---

## SQL Query Library (20 examples)

### DDL
1. `CREATE TABLE IF NOT EXISTS demo_reviews (...)` — create a new table
2. `ALTER TABLE demo_reviews ADD COLUMN helpful_count INTEGER DEFAULT 0` — add a column
3. `CREATE INDEX IF NOT EXISTS idx_shows_date ON shows(show_date)` — create an index
4. `DROP TABLE IF EXISTS demo_reviews` — drop a table
5. SQLite TRUNCATE explanation + `DELETE FROM` equivalent

### DML
6. `INSERT INTO movies (...)` — add a new movie
7. `INSERT INTO customers (...)` — add a customer
8. `UPDATE movies SET rating = 9.1 WHERE title = 'Inception'` — update a record
9. `UPDATE bookings SET booking_status = 'Confirmed' WHERE booking_id = 1`
10. `DELETE FROM customers WHERE email = 'ravi.kumar@example.com'`

### DQL
11. `SELECT movie_id, title, genre ... FROM movies ORDER BY movie_id` — basic select
12. `SELECT ... FROM movies WHERE genre = 'Action' ORDER BY rating DESC` — WHERE filter
13. `SELECT ... FROM movies ORDER BY rating DESC` — ORDER BY
14. `SELECT COUNT(*) AS total_bookings, SUM(total_amount) AS revenue FROM bookings` — aggregates
15. `SELECT t.theatre_name, SUM(p.amount) ... GROUP BY t.theatre_name` — SUM + GROUP BY
16. `SELECT m.title, COUNT(b.booking_id) ... GROUP BY m.movie_id` — GROUP BY
17. `... HAVING booking_count >= 2` — HAVING filter
18. `SELECT c.name, m.title ... FROM customers JOIN bookings JOIN shows JOIN movies` — multi-table JOIN
19. `LEFT JOIN` — movies with no bookings
20. Most popular movies with booking count and revenue

---

## Testing Checklist

- [ ] CREATE TABLE → new table appears in Schema Explorer
- [ ] INSERT movie → appears in Movies page and SELECT query
- [ ] UPDATE movie rating → subsequent SELECT reflects change
- [ ] DELETE record → works when FK constraints allow
- [ ] Invalid SQL → readable error shown in Playground
- [ ] JOIN query → returns correct rows
- [ ] GROUP BY + aggregate → correct values
- [ ] FK violation → rejected with error
- [ ] Duplicate seat → rejected (UNIQUE constraint on booking_seats)
- [ ] Failed booking → rolls back (transaction)
- [ ] Dashboard reflects DB changes after operations
- [ ] Data persists after restarting `python app.py`
- [ ] Reset DB → restores seed data after confirmation dialog
- [ ] Cancel booking → seats freed (booking_seats rows deleted)

---

## Sample Data

- **10 movies**: Inception, The Dark Knight, Interstellar, Avengers: Endgame, Spider-Man: No Way Home, The Lion King, Joker, Parasite, Dune: Part Two, RRR
- **3 theatres**: Cinemark 1 (New York), AMC Theatre (Los Angeles), Regal Cinemas (Chicago)
- **4 screens** (84 seats total)
- **10 shows**
- **8 customers**
- **12 bookings** (11 Confirmed, 1 Cancelled)
- **12 payments**

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/dashboard/stats` | Summary statistics |
| GET | `/api/dashboard/recent-bookings` | Last 10 bookings |
| GET | `/api/dashboard/popular-movies` | Top movies by booking count |
| GET | `/api/dashboard/revenue-chart` | Revenue by movie |
| GET | `/api/movies` | List movies (supports `?search=&genre=`) |
| POST | `/api/movies` | Create movie |
| PUT | `/api/movies/<id>` | Update movie |
| DELETE | `/api/movies/<id>` | Delete movie |
| GET | `/api/shows` | List all shows |
| GET | `/api/shows/<id>/seats` | Seat map for a show |
| GET | `/api/bookings` | List bookings |
| POST | `/api/bookings` | Create booking (transactional) |
| PUT | `/api/bookings/<id>/cancel` | Cancel booking |
| GET | `/api/customers` | List customers |
| POST | `/api/customers` | Create customer |
| POST | `/api/sql/execute` | Execute raw SQL |
| POST | `/api/sql/reset` | Reset database |
| GET | `/api/schema/tables` | Table metadata |
| GET | `/api/schema/tables/<name>/data` | Paginated table data |
| GET | `/api/schema/er` | ER relationship data |
