#!/usr/bin/env python3
"""
Serveur simple pour l'application de suivi oculaire
"""
import http.server
import socketserver
import os
from pathlib import Path

PORT = 3000
STATIC_DIR = Path(__file__).parent / "public"
DIST_DIR = Path(__file__).parent / "dist"

class MyHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def translate_path(self, path):
        """Servir depuis public et dist"""
        # Essayer d'abord dans dist (fichiers compilés)
        if path.startswith("/"):
            path = path[1:]
        
        dist_file = DIST_DIR / path
        static_file = STATIC_DIR / path
        
        # Priorité à dist pour les fichiers JavaScript compilés
        if dist_file.exists() and dist_file.is_file():
            return str(dist_file)
        
        # Sinon chercher dans public
        if static_file.exists() and static_file.is_file():
            return str(static_file)
        
        # Par défaut, servir index.html
        index = STATIC_DIR / "index.html"
        if index.exists():
            return str(index)
        
        return str(static_file)
    
    def end_headers(self):
        """Ajouter les headers CORS et cache"""
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0')
        super().end_headers()

if __name__ == "__main__":
    os.chdir(str(STATIC_DIR.parent))
    
    with socketserver.TCPServer(("", PORT), MyHTTPRequestHandler) as httpd:
        print(f"🔍 Serveur de suivi oculaire clinique")
        print(f"✅ Démarré sur http://localhost:{PORT}")
        print(f"📁 Servant depuis: {STATIC_DIR}")
        print(f"📁 Avec modules de: {DIST_DIR}")
        print(f"\nAccédez à http://localhost:{PORT} dans votre navigateur\n")
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\n⛔ Serveur arrêté")
