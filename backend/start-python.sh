#!/bin/bash
gunicorn --workers=2 --threads=2 --timeout=120 --bind=0.0.0.0:$PORT app:app 