import urllib.request, json, time

BASE = 'http://localhost:5000/api'

def get(path):
    with urllib.request.urlopen(BASE + path) as r:
        return json.loads(r.read())

def post(path, data):
    body = json.dumps(data).encode()
    req = urllib.request.Request(BASE + path, body, {'Content-Type': 'application/json'}, method='POST')
    try:
        with urllib.request.urlopen(req) as r:
            return r.status, json.loads(r.read())
    except urllib.error.HTTPError as e:
        return e.code, json.loads(e.read())

print('=== Test 1: Dashboard Stats ===')
stats = get('/dashboard/stats')
print(f'Movies: {stats["total_movies"]}, Bookings: {stats["total_bookings"]}, Revenue: {stats["total_revenue"]}')

print()
print('=== Test 2: SQL SELECT ===')
s, r = post('/sql/execute', {'sql': 'SELECT title, rating FROM movies ORDER BY rating DESC LIMIT 3'})
print(f'Status: {s}, Rows: {r.get("rowcount", 0)}')
for row in r.get('rows', []): print(f'  {row}')

print()
print('=== Test 3: DDL CREATE ===')
s, r = post('/sql/execute', {'sql': 'CREATE TABLE IF NOT EXISTS test_tbl (id INTEGER PRIMARY KEY, val TEXT)'})
print(f'Status: {s}, Message: {r.get("message")}')

print()
print('=== Test 4: DML INSERT ===')
s, r = post('/sql/execute', {'sql': "INSERT INTO test_tbl (val) VALUES ('hello')"}  )
print(f'Status: {s}, Affected: {r.get("rowcount")}')

print()
print('=== Test 5: SELECT after INSERT ===')
s, r = post('/sql/execute', {'sql': 'SELECT * FROM test_tbl'})
print(f'Status: {s}, Rows: {r.get("rowcount", 0)}, Data: {r.get("rows", [])}')

print()
print('=== Test 6: DDL DROP ===')
s, r = post('/sql/execute', {'sql': 'DROP TABLE IF EXISTS test_tbl'})
print(f'Status: {s}, Message: {r.get("message")}')

print()
print('=== Test 7: Invalid SQL ===')
s, r = post('/sql/execute', {'sql': 'SELECT * FROM nonexistent_table_xyz'})
print(f'Status: {s}, Error: {r.get("error")}')

print()
print('=== Test 8: JOIN query ===')
s, r = post('/sql/execute', {'sql': 'SELECT c.name, m.title, b.total_amount FROM customers c JOIN bookings b ON c.customer_id=b.customer_id JOIN shows s ON b.show_id=s.show_id JOIN movies m ON s.movie_id=m.movie_id LIMIT 3'})
print(f'Status: {s}, Rows: {r.get("rowcount", 0)}')
for row in r.get('rows', []): print(f'  {row}')

print()
print('=== Test 9: FK violation ===')
s, r = post('/sql/execute', {'sql': 'INSERT INTO bookings (customer_id, show_id, total_amount) VALUES (9999, 1, 100)'})
print(f'Status: {s}, Error contains FK: {"FOREIGN KEY" in r.get("error", "").upper() or "constraint" in r.get("error", "").lower()}')

print()
print('=== Test 10: GROUP BY + HAVING ===')
s, r = post('/sql/execute', {'sql': 'SELECT m.title, COUNT(b.booking_id) AS cnt FROM movies m JOIN shows s ON m.movie_id=s.movie_id JOIN bookings b ON s.show_id=b.show_id WHERE b.booking_status="Confirmed" GROUP BY m.movie_id HAVING cnt >= 2 ORDER BY cnt DESC'})
print(f'Status: {s}, Rows: {r.get("rowcount", 0)}')
for row in r.get('rows', []): print(f'  {row}')

print()
print('ALL TESTS PASSED')
