#!/bin/bash

# Run Flutter web app
echo "Starting Manga Viewer in web mode..."
echo "The app will be available at http://localhost:8080"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

flutter run -d web-server --web-port 8080