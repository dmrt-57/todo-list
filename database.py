"""
Database module for Modern Todo App.
Handles SQLite operations, connection pooling, schema migrations, and seed data.
"""

import sqlite3
import os
import contextlib
from datetime import datetime
from typing import List, Dict, Any, Optional

DB_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), "todos.db")


@contextlib.contextmanager
def get_connection():
    """Returns a SQLite connection with WAL mode, foreign keys, and guarantees closing."""
    conn = sqlite3.connect(DB_FILE, timeout=30.0)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON;")
    conn.execute("PRAGMA journal_mode = WAL;")
    try:
        yield conn
    finally:
        conn.close()


def init_db():
    """Initializes tables and seeds starter data if empty."""
    with get_connection() as conn:
        cursor = conn.cursor()
        
        # Lists table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS lists (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                icon TEXT DEFAULT '📋',
                color TEXT DEFAULT '#4f46e5',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        """)

        # Tasks table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS tasks (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                list_id INTEGER NOT NULL,
                title TEXT NOT NULL,
                notes TEXT DEFAULT '',
                priority TEXT DEFAULT 'medium',
                completed INTEGER DEFAULT 0,
                due_date TEXT DEFAULT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                completed_at TIMESTAMP DEFAULT NULL,
                FOREIGN KEY (list_id) REFERENCES lists(id) ON DELETE CASCADE
            );
        """)

        # Indexes for fast querying & search
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_tasks_list ON tasks(list_id);")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_tasks_completed ON tasks(completed);")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_tasks_title ON tasks(title);")

        conn.commit()

        # Seed initial starter data if no lists exist
        cursor.execute("SELECT COUNT(*) as count FROM lists;")
        if cursor.fetchone()["count"] == 0:
            seed_initial_data(cursor)
            conn.commit()


def seed_initial_data(cursor: sqlite3.Cursor):
    """Adds default sample lists and tasks for first-time onboarding."""
    sample_lists = [
        ("🛒 Alışveriş Listesi", "🛒", "#10b981"),
        ("💼 İş ve Projeler", "💼", "#6366f1"),
        ("🎯 Kişisel Hedefler", "🎯", "#f59e0b")
    ]
    
    list_ids = {}
    for name, icon, color in sample_lists:
        cursor.execute(
            "INSERT INTO lists (name, icon, color) VALUES (?, ?, ?);",
            (name, icon, color)
        )
        list_ids[name] = cursor.lastrowid

    # Seed sample tasks
    sample_tasks = [
        (list_ids["🛒 Alışveriş Listesi"], "Süt ve Organik Yumurta al", "Haftalık kahvaltı için", "medium", 1),
        (list_ids["🛒 Alışveriş Listesi"], "Taze filtre kahve çekirdeği", "Orta kavrulmuş tercih et", "high", 0),
        (list_ids["🛒 Alışveriş Listesi"], "Tam buğday ekmeği & avokado", "Fırından taze alınacak", "low", 0),
        
        (list_ids["💼 İş ve Projeler"], "Todo List uygulamasını GitHub'a yükle", "git remote add origin ve git push", "high", 0),
        (list_ids["💼 İş ve Projeler"], "README.md dokümantasyonunu hazırla", "Kurulum ve kullanım adımlarını ekle", "medium", 1),
        (list_ids["💼 İş ve Projeler"], "Veritabanı yedekleme planı oluştur", "SQLite dosyasını düzenli yedekle", "low", 0),

        (list_ids["🎯 Kişisel Hedefler"], "Günde en az 30 sayfa kitap oku", "Atomik Alışkanlıklar", "medium", 1),
        (list_ids["🎯 Kişisel Hedefler"], "10.000 adım akşam yürüyüşü yap", "Sahil parkuru rotası", "high", 0),
    ]

    for list_id, title, notes, priority, completed in sample_tasks:
        completed_at = datetime.utcnow().isoformat() if completed else None
        cursor.execute(
            """INSERT INTO tasks (list_id, title, notes, priority, completed, completed_at)
               VALUES (?, ?, ?, ?, ?, ?);""",
            (list_id, title, notes, priority, completed, completed_at)
        )


def get_lists() -> List[Dict[str, Any]]:
    """Returns all lists with total, completed, and pending task counts."""
    with get_connection() as conn:
        cursor = conn.cursor()
        query = """
            SELECT 
                l.id, l.name, l.icon, l.color, l.created_at,
                COUNT(t.id) as total_tasks,
                SUM(CASE WHEN t.completed = 1 THEN 1 ELSE 0 END) as completed_tasks,
                SUM(CASE WHEN t.completed = 0 THEN 1 ELSE 0 END) as pending_tasks
            FROM lists l
            LEFT JOIN tasks t ON l.id = t.list_id
            GROUP BY l.id
            ORDER BY l.id ASC;
        """
        cursor.execute(query)
        rows = cursor.fetchall()
        return [dict(row) for row in rows]


def get_list_by_id(list_id: int) -> Optional[Dict[str, Any]]:
    """Retrieves a single list by ID."""
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM lists WHERE id = ?;", (list_id,))
        row = cursor.fetchone()
        return dict(row) if row else None


def create_list(name: str, icon: str = "📋", color: str = "#4f46e5") -> Dict[str, Any]:
    """Creates a new list/category."""
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute(
            "INSERT INTO lists (name, icon, color) VALUES (?, ?, ?);",
            (name.strip(), icon.strip() or "📋", color.strip() or "#4f46e5")
        )
        conn.commit()
        list_id = cursor.lastrowid
        return get_list_by_id(list_id)


def update_list(list_id: int, name: str, icon: str, color: str) -> Optional[Dict[str, Any]]:
    """Updates an existing list."""
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute(
            "UPDATE lists SET name = ?, icon = ?, color = ? WHERE id = ?;",
            (name.strip(), icon.strip(), color.strip(), list_id)
        )
        conn.commit()
        return get_list_by_id(list_id)


def delete_list(list_id: int) -> bool:
    """Deletes a list and all associated tasks."""
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("DELETE FROM lists WHERE id = ?;", (list_id,))
        conn.commit()
        return cursor.rowcount > 0


def get_tasks(
    list_id: Optional[int] = None,
    search: Optional[str] = None,
    status: Optional[str] = None,
    priority: Optional[str] = None
) -> List[Dict[str, Any]]:
    """Returns tasks filtered by list, search term, completion status, or priority."""
    with get_connection() as conn:
        cursor = conn.cursor()
        query = """
            SELECT 
                t.id, t.list_id, t.title, t.notes, t.priority,
                t.completed, t.due_date, t.created_at, t.completed_at,
                l.name as list_name, l.icon as list_icon, l.color as list_color
            FROM tasks t
            JOIN lists l ON t.list_id = l.id
            WHERE 1=1
        """
        params: List[Any] = []

        if list_id is not None:
            query += " AND t.list_id = ?"
            params.append(list_id)

        if search:
            query += " AND (t.title LIKE ? OR t.notes LIKE ? OR l.name LIKE ?)"
            search_param = f"%{search.strip()}%"
            params.extend([search_param, search_param, search_param])

        if status == "completed":
            query += " AND t.completed = 1"
        elif status == "pending":
            query += " AND t.completed = 0"

        if priority in ("low", "medium", "high"):
            query += " AND t.priority = ?"
            params.append(priority)

        # Sort: pending first, then high priority, then newest
        query += """
            ORDER BY 
                t.completed ASC,
                CASE t.priority 
                    WHEN 'high' THEN 1 
                    WHEN 'medium' THEN 2 
                    WHEN 'low' THEN 3 
                    ELSE 4 
                END ASC,
                t.id DESC;
        """

        cursor.execute(query, params)
        rows = cursor.fetchall()
        return [dict(row) for row in rows]


def get_task_by_id(task_id: int) -> Optional[Dict[str, Any]]:
    """Retrieves a single task by ID."""
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT t.*, l.name as list_name, l.icon as list_icon, l.color as list_color
            FROM tasks t
            JOIN lists l ON t.list_id = l.id
            WHERE t.id = ?;
        """, (task_id,))
        row = cursor.fetchone()
        return dict(row) if row else None


def create_task(
    list_id: int,
    title: str,
    notes: str = "",
    priority: str = "medium",
    due_date: Optional[str] = None
) -> Optional[Dict[str, Any]]:
    """Creates a new task in a specified list."""
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute(
            """INSERT INTO tasks (list_id, title, notes, priority, due_date)
               VALUES (?, ?, ?, ?, ?);""",
            (list_id, title.strip(), (notes or "").strip(), priority or "medium", due_date)
        )
        conn.commit()
        task_id = cursor.lastrowid
        return get_task_by_id(task_id)


def update_task(
    task_id: int,
    title: str,
    notes: str = "",
    priority: str = "medium",
    due_date: Optional[str] = None,
    completed: Optional[int] = None
) -> Optional[Dict[str, Any]]:
    """Updates a task."""
    current = get_task_by_id(task_id)
    if not current:
        return None

    new_completed = completed if completed is not None else current["completed"]
    completed_at = datetime.utcnow().isoformat() if new_completed and not current["completed"] else (
        None if not new_completed else current["completed_at"]
    )

    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            UPDATE tasks
            SET title = ?, notes = ?, priority = ?, due_date = ?, completed = ?, completed_at = ?
            WHERE id = ?;
        """, (title.strip(), (notes or "").strip(), priority, due_date, new_completed, completed_at, task_id))
        conn.commit()
        return get_task_by_id(task_id)


def toggle_task(task_id: int) -> Optional[Dict[str, Any]]:
    """Toggles completion status of a task."""
    current = get_task_by_id(task_id)
    if not current:
        return None

    new_completed = 0 if current["completed"] == 1 else 1
    completed_at = datetime.utcnow().isoformat() if new_completed == 1 else None

    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute(
            "UPDATE tasks SET completed = ?, completed_at = ? WHERE id = ?;",
            (new_completed, completed_at, task_id)
        )
        conn.commit()
        return get_task_by_id(task_id)


def delete_task(task_id: int) -> bool:
    """Deletes a task by ID."""
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("DELETE FROM tasks WHERE id = ?;", (task_id,))
        conn.commit()
        return cursor.rowcount > 0


def get_stats() -> Dict[str, Any]:
    """Returns application wide summary statistics."""
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT 
                COUNT(*) as total_tasks,
                SUM(CASE WHEN completed = 1 THEN 1 ELSE 0 END) as completed_tasks,
                SUM(CASE WHEN completed = 0 THEN 1 ELSE 0 END) as pending_tasks,
                SUM(CASE WHEN priority = 'high' AND completed = 0 THEN 1 ELSE 0 END) as high_priority_pending
            FROM tasks;
        """)
        row = cursor.fetchone()
        
        cursor.execute("SELECT COUNT(*) as total_lists FROM lists;")
        list_count = cursor.fetchone()["total_lists"]

        total = row["total_tasks"] or 0
        completed = row["completed_tasks"] or 0
        pending = row["pending_tasks"] or 0
        rate = round((completed / total * 100), 1) if total > 0 else 0

        return {
            "total_tasks": total,
            "completed_tasks": completed,
            "pending_tasks": pending,
            "high_priority_pending": row["high_priority_pending"] or 0,
            "total_lists": list_count,
            "completion_rate": rate
        }
