"""
Module de sécurité avec Tink
Gère le chiffrement et la signature des données sensibles
"""
import tink
from tink import aead, daead
import os
from pathlib import Path
import json
from typing import Any, Dict


class TinkSecurityManager:
    """Gestionnaire de sécurité utilisant Tink"""
    
    def __init__(self):
        # Initialise Tink
        try:
            tink.experimental_enable_insecure_keyset_access()
        except AttributeError:
            # Version plus récente de Tink
            os.environ['TINK_ALLOW_INSECURE_KEYSET_ACCESS'] = '1'
        
        self.keyset_path = Path(__file__).parent.parent / 'keys'
        self.keyset_path.mkdir(exist_ok=True)
        
        self.aead_keyset_file = self.keyset_path / 'aead_keyset.json'
        self.daead_keyset_file = self.keyset_path / 'daead_keyset.json'
        
        # Initialise les clés
        self._init_aead_keyset()
        self._init_daead_keyset()
    
    def _init_aead_keyset(self):
        """Initialise la clé AEAD (chiffrement symétrique)"""
        if not self.aead_keyset_file.exists():
            # Crée une nouvelle clé
            keyset_handle = tink.new_keyset_handle(aead.aead_key_templates.AES256_GCM)
            
            # Sauvegarde la clé de manière sécurisée
            with open(self.aead_keyset_file, 'w') as f:
                keyset_json = tink.json_keyset_io.JsonKeysetWriter(
                    self.aead_keyset_file
                ).write(keyset_handle)
        
        # Charge la clé existante
        with open(self.aead_keyset_file, 'r') as f:
            self.aead_handle = tink.json_keyset_io.JsonKeysetReader(
                f.read()
            ).read()
    
    def _init_daead_keyset(self):
        """Initialise la clé DAEAD (chiffrement déterministe)"""
        if not self.daead_keyset_file.exists():
            # Crée une nouvelle clé
            keyset_handle = tink.new_keyset_handle(
                daead.deterministic_aead_key_templates.AES256_SIV
            )
            
            # Sauvegarde la clé
            with open(self.daead_keyset_file, 'w') as f:
                keyset_json = tink.json_keyset_io.JsonKeysetWriter(
                    self.daead_keyset_file
                ).write(keyset_handle)
        
        # Charge la clé existante
        with open(self.daead_keyset_file, 'r') as f:
            self.daead_handle = tink.json_keyset_io.JsonKeysetReader(
                f.read()
            ).read()
    
    def encrypt_data(self, data: Dict[str, Any], associated_data: str = "") -> str:
        """
        Chiffre les données avec AEAD
        
        Args:
            data: Les données à chiffrer
            associated_data: Données associées (optionnel)
        
        Returns:
            Les données chiffrées encodées en base64
        """
        try:
            cipher = self.aead_handle.primitive(aead.Aead)
            plaintext = json.dumps(data).encode('utf-8')
            
            ciphertext = cipher.encrypt(
                plaintext,
                associated_data.encode('utf-8') if associated_data else b""
            )
            
            import base64
            return base64.b64encode(ciphertext).decode('utf-8')
        except Exception as e:
            raise ValueError(f"Erreur de chiffrement: {str(e)}")
    
    def decrypt_data(self, encrypted_data: str, associated_data: str = "") -> Dict[str, Any]:
        """
        Déchiffre les données avec AEAD
        
        Args:
            encrypted_data: Les données chiffrées (base64)
            associated_data: Données associées
        
        Returns:
            Les données déchiffrées
        """
        try:
            cipher = self.aead_handle.primitive(aead.Aead)
            
            import base64
            ciphertext = base64.b64decode(encrypted_data)
            
            plaintext = cipher.decrypt(
                ciphertext,
                associated_data.encode('utf-8') if associated_data else b""
            )
            
            return json.loads(plaintext.decode('utf-8'))
        except Exception as e:
            raise ValueError(f"Erreur de déchiffrement: {str(e)}")
    
    def encrypt_deterministic(self, data: str) -> str:
        """
        Chiffre les données de manière déterministe
        Utile pour les identifiants ou les emails
        
        Args:
            data: Les données à chiffrer
        
        Returns:
            Les données chiffrées (même sortie pour même entrée)
        """
        try:
            cipher = self.daead_handle.primitive(daead.DeterministicAead)
            plaintext = data.encode('utf-8')
            
            ciphertext = cipher.encrypt_deterministically(plaintext, b"")
            
            import base64
            return base64.b64encode(ciphertext).decode('utf-8')
        except Exception as e:
            raise ValueError(f"Erreur de chiffrement déterministe: {str(e)}")
    
    def decrypt_deterministic(self, encrypted_data: str) -> str:
        """
        Déchiffre les données chiffrées de manière déterministe
        
        Args:
            encrypted_data: Les données chiffrées (base64)
        
        Returns:
            Les données déchiffrées
        """
        try:
            cipher = self.daead_handle.primitive(daead.DeterministicAead)
            
            import base64
            ciphertext = base64.b64decode(encrypted_data)
            
            plaintext = cipher.decrypt_deterministically(ciphertext, b"")
            
            return plaintext.decode('utf-8')
        except Exception as e:
            raise ValueError(f"Erreur de déchiffrement déterministe: {str(e)}")
    
    def hash_data(self, data: str) -> str:
        """Hash les données avec SHA256"""
        import hashlib
        return hashlib.sha256(data.encode('utf-8')).hexdigest()


class SecureDataField:
    """Descripteur pour les champs de données sensibles"""
    
    def __init__(self):
        self.security_manager = TinkSecurityManager()
        self.data = {}
    
    def __get__(self, obj, objtype=None):
        if obj is None:
            return self
        return self.data.get(id(obj), None)
    
    def __set__(self, obj, value):
        if isinstance(value, dict):
            encrypted = self.security_manager.encrypt_data(value)
            self.data[id(obj)] = encrypted
        else:
            raise ValueError("Seules les données JSON sont acceptées")
