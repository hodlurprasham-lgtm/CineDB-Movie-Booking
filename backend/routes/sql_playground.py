from flask import Blueprint, request, jsonify
from db import get_db, reset_db
import time
import sqlite3
import re

sql_bp = Blueprint('sql', __name__)

def strip_sql_comments(sql):
    sql = re.sub(r'--[^\n]*', '', sql)
    sql = re.sub(r'/\*.*?\*/', '', sql, flags=re.DOTALL)
    return sql.strip()

def get_first_keyword(sql):
    clean = strip_sql_comments(sql).upper()
    parts = clean.split()
    return parts[0] if parts else ''

SELECT_LIKE = {'SELECT', 'PRAGMA', 'WITH', 'EXPLAIN'}
DDL_KEYWORDS = {'CREATE', 'DROP', 'ALTER', 'RENAME'}
BLOCKED_KEYWORDS = {'ATTACH', 'DETACH'}

@sql_bp.route('/sql/execute', methods=['POST'])
def execute_sql():
    data = request.get_json() or {}
    sql = data.get('sql', '').strip()
    if not sql:
        return jsonify({"success": False, "error": "No SQL provided", "duration_ms": 0}), 400

    first_kw = get_first_keyword(sql)

    if first_kw in BLOCKED_KEYWORDS:
        return jsonify({
            "success": False,
            "error": first_kw + " is not allowed for security reasons. Only the application's educational database is accessible.",
            "duration_ms": 0
        }), 403

    conn = get_db()
    start_time = time.time()
    try:
        is_select = first_kw in SELECT_LIKE
        is_ddl = first_kw in DDL_KEYWORDS

        if is_ddl:
            conn.executescript(sql)
            duration_ms = round((time.time() - start_time) * 1000, 2)
            return jsonify({
                "success": True,
                "columns": [],
                "rows": [],
                "rowcount": -1,
                "duration_ms": duration_ms,
                "message": first_kw + " executed successfully."
            })
        elif is_select:
            cursor = conn.execute(sql)
            rows = cursor.fetchall()
            columns = [d[0] for d in cursor.description] if cursor.description else []
            result_rows = [list(row) for row in rows]
            duration_ms = round((time.time() - start_time) * 1000, 2)
            return jsonify({
                "success": True,
                "columns": columns,
                "rows": result_rows,
                "rowcount": len(result_rows),
                "duration_ms": duration_ms,
                "message": "Query returned " + str(len(result_rows)) + " row(s)."
            })
        else:
            cursor = conn.execute(sql)
            conn.commit()
            rowcount = cursor.rowcount
            duration_ms = round((time.time() - start_time) * 1000, 2)
            return jsonify({
                "success": True,
                "columns": [],
                "rows": [],
                "rowcount": rowcount,
                "duration_ms": duration_ms,
                "message": first_kw + " executed successfully. " + str(rowcount) + " row(s) affected."
            })

    except sqlite3.Error as e:
        try:
            conn.rollback()
        except Exception:
            pass
        duration_ms = round((time.time() - start_time) * 1000, 2)
        return jsonify({
            "success": False,
            "error": str(e),
            "duration_ms": duration_ms
        }), 400
    finally:
        conn.close()

@sql_bp.route('/sql/reset', methods=['POST'])
def reset_database():
    try:
        reset_db()
        return jsonify({"success": True, "message": "Database reset successfully. All seed data has been restored."})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500
