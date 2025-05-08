import sqlite3
import datetime

DATABASE_NAME = 'cctv_detections.db'

def init_db():
    conn = sqlite3.connect(DATABASE_NAME)
    cursor = conn.cursor()

    # Table for detection logs
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS detection_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
            detected_heads INTEGER NOT NULL
        )
    ''')

    # Table for real-time stats (could be a single row table or handled differently)
    # For simplicity, we can use a table that stores the last known count.
    # Alternatively, this could be managed in memory and periodically flushed or not stored if only live view is needed.
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS real_time_stats (
            id INTEGER PRIMARY KEY CHECK (id = 1), -- Ensures only one row
            last_updated DATETIME,
            current_heads INTEGER
        )
    ''')
    # Initialize the single row for real_time_stats if it doesn't exist
    cursor.execute("INSERT OR IGNORE INTO real_time_stats (id, last_updated, current_heads) VALUES (1, ?, 0)", (datetime.datetime.now(),))

    conn.commit()
    conn.close()

def log_detection(detected_heads):
    conn = sqlite3.connect(DATABASE_NAME)
    cursor = conn.cursor()
    timestamp = datetime.datetime.now()
    cursor.execute("INSERT INTO detection_logs (timestamp, detected_heads) VALUES (?, ?)", (timestamp, detected_heads))
    conn.commit()
    conn.close()

def update_real_time_stats(current_heads):
    conn = sqlite3.connect(DATABASE_NAME)
    cursor = conn.cursor()
    timestamp = datetime.datetime.now()
    # Using INSERT OR REPLACE to ensure the row with id=1 is updated or created
    cursor.execute("INSERT OR REPLACE INTO real_time_stats (id, last_updated, current_heads) VALUES (1, ?, ?)", 
                   (timestamp, current_heads))
    conn.commit()
    conn.close()

def get_real_time_stats():
    conn = sqlite3.connect(DATABASE_NAME)
    cursor = conn.cursor()
    cursor.execute("SELECT current_heads, last_updated FROM real_time_stats WHERE id = 1")
    row = cursor.fetchone()
    conn.close()
    if row:
        return {"current_heads": row[0], "last_updated": row[1]}
    return {"current_heads": 0, "last_updated": None} # Default if table is somehow empty

def get_detection_history(limit=100, offset=0):
    conn = sqlite3.connect(DATABASE_NAME)
    conn.row_factory = sqlite3.Row # To access columns by name
    cursor = conn.cursor()
    cursor.execute("SELECT timestamp, detected_heads FROM detection_logs ORDER BY timestamp DESC LIMIT ? OFFSET ?", (limit, offset))
    rows = cursor.fetchall()
    conn.close()
    return [dict(row) for row in rows]

if __name__ == '__main__':
    print("Initializing database...")
    init_db()
    print("Database initialized.")
    # Example usage:
    # log_detection(5)
    # update_real_time_stats(3)
    # print(get_real_time_stats())
    # print(get_detection_history(limit=5)) 