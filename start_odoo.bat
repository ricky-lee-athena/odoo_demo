@echo off
echo Starting Odoo 19...
echo.
echo Make sure PostgreSQL Docker container is running!
echo.

odoo-venv\Scripts\python.exe odoo19\odoo-bin -c odoo19.conf -d odoo19

pause
