#!/usr/bin/env python3
import os
import sys

# Ensure the backend/ directory is on sys.path so aurabook_apps is importable
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

if __name__ == "__main__":
    os.environ.setdefault("DJANGO_SETTINGS_MODULE", "saleor.settings")

    from django.core.management import execute_from_command_line

    execute_from_command_line(sys.argv)
