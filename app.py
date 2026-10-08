"""
Modern Todo List Application Server.
Pure Python standard library implementation with zero external dependencies.
Features SQLite persistence, RESTful API, and static asset serving.
"""

import http.server
import json
import os
import sys
import urllib.parse
from http import HTTPStatus
import database

import socket

DEFAULT_PORT = int(os.environ.get("PORT", 8000))
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
STATIC_DIR = os.path.join(BASE_DIR, "static")
TEMPLATES_DIR = os.path.join(BASE_DIR, "templates")

def get_free_port(start_port=DEFAULT_PORT, max_attempts=15):
    for port in range(start_port, start_port + max_attempts):
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
            try:
                s.bind(("", port))
                return port
            except OSError:
                continue
    return start_port

MIME_TYPES = {
    ".html": "text/html; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".js": "application/javascript; charset=utf-8",
    ".json": "application/json; charset=utf-8",
    ".svg": "image/svg+xml",
    ".png": "image/png",
    ".ico": "image/x-icon",
}


class TodoRequestHandler(http.server.SimpleHTTPRequestHandler):
    """Handles REST API and static template file serving."""
    protocol_version = "HTTP/1.1"

    def end_headers(self):
        # Enable CORS and standard caching headers for API
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, Authorization")
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(HTTPStatus.NO_CONTENT)
        self.end_headers()

    def send_json(self, data, status=HTTPStatus.OK):
        body = json.dumps(data, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)
        self.wfile.flush()

    def send_error_json(self, message, status=HTTPStatus.BAD_REQUEST):
        self.send_json({"error": message}, status=status)

    def parse_json_body(self):
        try:
            content_length = int(self.headers.get("Content-Length", 0))
            if content_length == 0:
                return {}
            raw_body = self.rfile.read(content_length).decode("utf-8")
            return json.loads(raw_body)
        except Exception as e:
            sys.stderr.write(f"JSON Ayrıştırma Hatası: {e}\n")
            return {}

    def do_GET(self):
        try:
            self._handle_get()
        except Exception as e:
            sys.stderr.write(f"GET Hatası: {e}\n")
            self.send_error_json(f"Sunucu hatası: {str(e)}", HTTPStatus.INTERNAL_SERVER_ERROR)

    def _handle_get(self):
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path
        query = urllib.parse.parse_qs(parsed.query)

        # API Routes
        if path == "/api/lists":
            lists = database.get_lists()
            self.send_json(lists)
            return

        if path.startswith("/api/lists/") and path.count("/") == 3:
            try:
                list_id = int(path.split("/")[-1])
                lst = database.get_list_by_id(list_id)
                if lst:
                    self.send_json(lst)
                else:
                    self.send_error_json("Liste bulunamadı", HTTPStatus.NOT_FOUND)
            except ValueError:
                self.send_error_json("Geçersiz liste ID", HTTPStatus.BAD_REQUEST)
            return

        if path == "/api/tasks":
            list_id = query.get("list_id", [None])[0]
            search = query.get("search", [None])[0]
            status = query.get("status", [None])[0]
            priority = query.get("priority", [None])[0]

            list_id_int = int(list_id) if list_id and list_id.isdigit() else None
            tasks = database.get_tasks(
                list_id=list_id_int,
                search=search,
                status=status,
                priority=priority
            )
            self.send_json(tasks)
            return

        if path == "/api/stats":
            stats = database.get_stats()
            self.send_json(stats)
            return

        # Serve Frontend
        if path in ("/", "/index.html"):
            index_path = os.path.join(TEMPLATES_DIR, "index.html")
            self.serve_file(index_path, "text/html; charset=utf-8")
            return

        # Serve Static Files
        if path.startswith("/static/"):
            rel_path = path[len("/static/"):]
            file_path = os.path.join(STATIC_DIR, rel_path)
            # Prevent directory traversal
            if os.path.commonpath([STATIC_DIR, os.path.abspath(file_path)]) == STATIC_DIR:
                if os.path.isfile(file_path):
                    _, ext = os.path.splitext(file_path)
                    content_type = MIME_TYPES.get(ext.lower(), "application/octet-stream")
                    self.serve_file(file_path, content_type)
                    return

        # Not found fallback
        self.send_error_json("Sayfa bulunamadı", HTTPStatus.NOT_FOUND)

    def do_POST(self):
        try:
            self._handle_post()
        except Exception as e:
            sys.stderr.write(f"POST Hatası: {e}\n")
            self.send_error_json(f"Sunucu hatası: {str(e)}", HTTPStatus.INTERNAL_SERVER_ERROR)

    def _handle_post(self):
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path

        # Create List
        if path == "/api/lists":
            data = self.parse_json_body()
            name = data.get("name", "").strip()
            icon = data.get("icon", "📋").strip()
            color = data.get("color", "#4f46e5").strip()

            if not name:
                self.send_error_json("Liste adı boş olamaz")
                return

            new_list = database.create_list(name, icon, color)
            self.send_json(new_list, HTTPStatus.CREATED)
            return

        # Create Task
        if path == "/api/tasks":
            data = self.parse_json_body()
            title = data.get("title", "").strip()
            list_id = data.get("list_id")
            notes = data.get("notes", "")
            priority = data.get("priority", "medium")
            due_date = data.get("due_date", None)

            if not title:
                self.send_error_json("Görev başlığı boş olamaz")
                return

            # Gracefully handle list_id
            if list_id is not None and str(list_id).isdigit():
                list_id = int(list_id)
                target_list = database.get_list_by_id(list_id)
            else:
                target_list = None

            # Fallback if list not found or invalid
            if not target_list:
                lists = database.get_lists()
                if lists:
                    list_id = lists[0]["id"]
                else:
                    created_l = database.create_list("Genel Liste", "📋", "#6366f1")
                    list_id = created_l["id"]

            new_task = database.create_task(
                list_id=list_id,
                title=title,
                notes=notes,
                priority=priority,
                due_date=due_date
            )
            self.send_json(new_task, HTTPStatus.CREATED)
            return

        # Toggle Task
        if path.startswith("/api/tasks/") and path.endswith("/toggle"):
            parts = path.split("/")
            try:
                task_id = int(parts[3])
                task = database.toggle_task(task_id)
                if task:
                    self.send_json(task)
                else:
                    self.send_error_json("Görev bulunamadı", HTTPStatus.NOT_FOUND)
            except (ValueError, IndexError):
                self.send_error_json("Geçersiz görev ID")
            return

        self.send_error_json("Endpoint bulunamadı", HTTPStatus.NOT_FOUND)

    def do_PUT(self):
        try:
            self._handle_put()
        except Exception as e:
            sys.stderr.write(f"PUT Hatası: {e}\n")
            self.send_error_json(f"Sunucu hatası: {str(e)}", HTTPStatus.INTERNAL_SERVER_ERROR)

    def _handle_put(self):
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path

        # Update List
        if path.startswith("/api/lists/"):
            try:
                list_id = int(path.split("/")[-1])
                data = self.parse_json_body()
                name = data.get("name", "").strip()
                icon = data.get("icon", "📋").strip()
                color = data.get("color", "#4f46e5").strip()

                if not name:
                    self.send_error_json("Liste adı boş olamaz")
                    return

                updated = database.update_list(list_id, name, icon, color)
                if updated:
                    self.send_json(updated)
                else:
                    self.send_error_json("Liste bulunamadı", HTTPStatus.NOT_FOUND)
            except ValueError:
                self.send_error_json("Geçersiz liste ID")
            return

        # Update Task
        if path.startswith("/api/tasks/"):
            try:
                task_id = int(path.split("/")[-1])
                data = self.parse_json_body()
                title = data.get("title", "").strip()
                notes = data.get("notes", "")
                priority = data.get("priority", "medium")
                due_date = data.get("due_date", None)
                completed = data.get("completed", None)

                if not title:
                    self.send_error_json("Görev başlığı boş olamaz")
                    return

                updated = database.update_task(
                    task_id=task_id,
                    title=title,
                    notes=notes,
                    priority=priority,
                    due_date=due_date,
                    completed=completed
                )
                if updated:
                    self.send_json(updated)
                else:
                    self.send_error_json("Görev bulunamadı", HTTPStatus.NOT_FOUND)
            except ValueError:
                self.send_error_json("Geçersiz görev ID")
            return

        self.send_error_json("Endpoint bulunamadı", HTTPStatus.NOT_FOUND)

    def do_DELETE(self):
        try:
            self._handle_delete()
        except Exception as e:
            sys.stderr.write(f"DELETE Hatası: {e}\n")
            self.send_error_json(f"Sunucu hatası: {str(e)}", HTTPStatus.INTERNAL_SERVER_ERROR)

    def _handle_delete(self):
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path

        # Delete List
        if path.startswith("/api/lists/"):
            try:
                list_id = int(path.split("/")[-1])
                success = database.delete_list(list_id)
                if success:
                    self.send_json({"success": True, "message": "Liste başarıyla silindi"})
                else:
                    self.send_error_json("Liste bulunamadı", HTTPStatus.NOT_FOUND)
            except ValueError:
                self.send_error_json("Geçersiz liste ID")
            return

        # Delete Task
        if path.startswith("/api/tasks/"):
            try:
                task_id = int(path.split("/")[-1])
                success = database.delete_task(task_id)
                if success:
                    self.send_json({"success": True, "message": "Görev başarıyla silindi"})
                else:
                    self.send_error_json("Görev bulunamadı", HTTPStatus.NOT_FOUND)
            except ValueError:
                self.send_error_json("Geçersiz görev ID")
            return

        self.send_error_json("Endpoint bulunamadı", HTTPStatus.NOT_FOUND)

    def serve_file(self, file_path, content_type):
        try:
            with open(file_path, "rb") as f:
                content = f.read()
            self.send_response(HTTPStatus.OK)
            self.send_header("Content-Type", content_type)
            self.send_header("Content-Length", str(len(content)))
            self.end_headers()
            self.wfile.write(content)
            self.wfile.flush()
        except Exception as e:
            self.send_error_json(f"Dosya okuma hatası: {str(e)}", HTTPStatus.INTERNAL_SERVER_ERROR)

    def log_message(self, format, *args):
        """Clean concise server console logging."""
        sys.stderr.write(f"[{self.log_date_time_string()}] {format % args}\n")


def start_server():
    database.init_db()
    port = get_free_port()
    server_address = ("", port)
    httpd = http.server.ThreadingHTTPServer(server_address, TodoRequestHandler)
    print("\n" + "=" * 60)
    print("🚀 MODERN TODO LIST UYGULAMASI ÇALIŞIYOR")
    print("=" * 60)
    print(f"👉 Yerel Adres: http://localhost:{port}")
    print(f"👉 Veritabanı:  {database.DB_FILE}")
    print("👉 Çıkış için:   Ctrl + C")
    print("=" * 60 + "\n")
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\n🛑 Sunucu durduruldu.")
        httpd.server_close()


if __name__ == "__main__":
    start_server()
