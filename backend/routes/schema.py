from flask import Blueprint, jsonify, request
from db import get_db

schema_bp = Blueprint('schema', __name__)

CORE_TABLES = [
    'customers', 'movies', 'theatres', 'screens', 'seats',
    'shows', 'bookings', 'booking_seats', 'payments'
]

def get_all_tables(conn):
    cursor = conn.execute("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name")
    return [row['name'] for row in cursor.fetchall()]

@schema_bp.route('/schema/tables', methods=['GET'])
def get_tables():
    conn = get_db()
    tables_info = []
    all_tables = get_all_tables(conn)
    for table_name in all_tables:
        try:
            cursor = conn.execute("PRAGMA table_info(" + table_name + ")")
            columns = [{"name": r['name'], "type": r['type'], "notnull": bool(r['notnull']),
                        "pk": bool(r['pk']), "default_value": r['dflt_value']} for r in cursor.fetchall()]
            cursor = conn.execute("PRAGMA foreign_key_list(" + table_name + ")")
            fks = [{"from": r['from'], "table": r['table'], "to": r['to']} for r in cursor.fetchall()]
            tables_info.append({"name": table_name, "columns": columns, "foreign_keys": fks, "is_core": table_name in CORE_TABLES})
        except Exception:
            pass
    conn.close()
    return jsonify(tables_info)

@schema_bp.route('/schema/tables/<table_name>/data', methods=['GET'])
def get_table_data(table_name):
    conn = get_db()
    all_tables = get_all_tables(conn)
    if table_name not in all_tables:
        conn.close()
        return jsonify({"error": "Table not found"}), 404

    page = int(request.args.get('page', 1))
    per_page = int(request.args.get('per_page', 20))
    offset = (page - 1) * per_page

    total = conn.execute("SELECT COUNT(*) FROM " + table_name).fetchone()[0]
    cursor = conn.execute("SELECT * FROM " + table_name + " LIMIT ? OFFSET ?", (per_page, offset))
    rows = cursor.fetchall()
    columns = [description[0] for description in cursor.description] if cursor.description else []
    conn.close()
    return jsonify({
        "columns": columns,
        "rows": [list(row) for row in rows],
        "total": total,
        "page": page,
        "per_page": per_page
    })

@schema_bp.route('/schema/er', methods=['GET'])
def get_er_data():
    conn = get_db()
    entities = []
    relationships = []
    for table_name in CORE_TABLES:
        try:
            cursor = conn.execute("PRAGMA table_info(" + table_name + ")")
            cols = [{"name": r['name'], "pk": bool(r['pk']), "type": r['type']} for r in cursor.fetchall()]
            entities.append({"name": table_name, "columns": cols})
            cursor = conn.execute("PRAGMA foreign_key_list(" + table_name + ")")
            for r in cursor.fetchall():
                relationships.append({
                    "from": table_name,
                    "from_col": r['from'],
                    "to": r['table'],
                    "to_col": r['to']
                })
        except Exception:
            pass
    conn.close()
    return jsonify({"entities": entities, "relationships": relationships})
