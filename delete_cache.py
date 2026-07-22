import sqlite3
conn = sqlite3.connect('backend/local.db')
cursor = conn.cursor()
try:
    cursor.execute('DELETE FROM ai_summary_report')
    conn.commit()
    print("Cache cleared")
except Exception as e:
    print(f"Error: {e}")
conn.close()
