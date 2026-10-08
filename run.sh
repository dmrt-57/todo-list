#!/usr/bin/env bash

# Modern Todo App - TaskFlow Pro Launch Script
set -e

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
cd "$DIR"

echo "=================================================="
echo "⚡ TaskFlow Pro Başlatılıyor..."
echo "📂 Dizin: $DIR"
echo "=================================================="

python3 app.py
