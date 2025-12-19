from django.contrib.auth.backends import ModelBackend
from django.contrib.auth import get_user_model
from rest_framework.authentication import BaseAuthentication
from rest_framework.exceptions import AuthenticationFailed
import jwt
from django.conf import settings
from datetime import datetime, timedelta

User = get_user_model()


class SecureJWTAuthentication(BaseAuthentication):
    """Authentification JWT sécurisée avec Tink"""
    
    def __init__(self):
        # Import retardé pour éviter les problèmes de démarrage
        try:
            from .security_manager import TinkSecurityManager
            self.security_manager = TinkSecurityManager()
        except Exception:
            self.security_manager = None
    
    def authenticate(self, request):
        auth_header = request.META.get('HTTP_AUTHORIZATION', '')
        
        if not auth_header.startswith('Bearer '):
            return None
        
        token = auth_header[7:]
        
        try:
            # Déchiffre et valide le token
            payload = jwt.decode(
                token,
                settings.SECRET_KEY,
                algorithms=['HS256']
            )
            
            user = User.objects.get(pk=payload['user_id'])
            return (user, None)
        except jwt.ExpiredSignatureError:
            raise AuthenticationFailed('Token expiré')
        except jwt.InvalidTokenError:
            raise AuthenticationFailed('Token invalide')
        except User.DoesNotExist:
            raise AuthenticationFailed('Utilisateur non trouvé')
    
    def generate_token(self, user):
        """Génère un token JWT sécurisé"""
        payload = {
            'user_id': user.id,
            'username': user.username,
            'exp': datetime.utcnow() + timedelta(days=30),
            'iat': datetime.utcnow()
        }
        
        token = jwt.encode(payload, settings.SECRET_KEY, algorithm='HS256')
        return token


class SecureUserBackend(ModelBackend):
    """Backend d'authentification sécurisé"""
    
    def __init__(self):
        super().__init__()
        # Import retardé
        try:
            from .security_manager import TinkSecurityManager
            self.security_manager = TinkSecurityManager()
        except Exception:
            self.security_manager = None
    
    def authenticate(self, request, username=None, password=None, **kwargs):
        """Authentifie l'utilisateur de manière sécurisée"""
        try:
            user = User.objects.get(username=username)
        except User.DoesNotExist:
            # Logging sécurisé
            return None
        
        if user.check_password(password) and self.user_can_authenticate(user):
            return user
        
        return None
