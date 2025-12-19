"""
Middleware de sécurité
"""
import logging

security_logger = logging.getLogger('security')


class SecurityHeadersMiddleware:
    """Middleware pour ajouter les headers de sécurité"""
    
    def __init__(self, get_response):
        self.get_response = get_response
    
    def __call__(self, request):
        response = self.get_response(request)
        
        # Headers de sécurité
        response['X-Content-Type-Options'] = 'nosniff'
        response['X-Frame-Options'] = 'DENY'
        response['X-XSS-Protection'] = '1; mode=block'
        response['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains'
        response['Content-Security-Policy'] = "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline';"
        
        return response


class AuditLoggingMiddleware:
    """Middleware pour l'audit des accès"""
    
    def __init__(self, get_response):
        self.get_response = get_response
        # Import retardé pour éviter les problèmes de démarrage
        try:
            from .security_manager import TinkSecurityManager
            self.security_manager = TinkSecurityManager()
        except Exception:
            self.security_manager = None
    
    def __call__(self, request):
        # Log du début de la requête
        user = request.user.username if request.user.is_authenticated else 'anonymous'
        
        security_logger.info(
            f"Requête: {request.method} {request.path} par {user}"
        )
        
        response = self.get_response(request)
        
        # Log du statut de la réponse
        security_logger.info(
            f"Réponse: {response.status_code}"
        )
        
        return response
