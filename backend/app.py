
"""
Ponto de entrada alternativo da API Agenda Life.

A aplicação principal fica em main.py.
O Render continua utilizando uvicorn main:app.
"""

from main import app

__all__ = ["app"]
