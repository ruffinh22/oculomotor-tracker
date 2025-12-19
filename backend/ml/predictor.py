"""
Module de Machine Learning pour la prédiction des tests de suivi oculaire
"""
import numpy as np
from sklearn.preprocessing import StandardScaler
from sklearn.ensemble import IsolationForest
import tensorflow as tf
from typing import Dict, List, Any
import os
from pathlib import Path

class EyeTrackingPredictor:
    """Classe principale pour les prédictions de suivi oculaire"""
    
    def __init__(self):
        self.model = None
        self.scaler = StandardScaler()
        self.anomaly_detector = IsolationForest(contamination=0.1, random_state=42)
        self.load_model()
    
    def load_model(self):
        """Charge le modèle TensorFlow"""
        model_path = Path(__file__).parent.parent / 'ml_models' / 'eye_tracking_model.h5'
        
        if model_path.exists():
            try:
                self.model = tf.keras.models.load_model(str(model_path))
            except Exception as e:
                print(f"Erreur lors du chargement du modèle: {e}")
                self.model = self._create_default_model()
        else:
            print("Modèle non trouvé, utilisation du modèle par défaut")
            self.model = self._create_default_model()
    
    def _create_default_model(self):
        """Crée un modèle par défaut"""
        model = tf.keras.Sequential([
            tf.keras.layers.Dense(64, activation='relu', input_shape=(8,)),
            tf.keras.layers.Dropout(0.3),
            tf.keras.layers.Dense(32, activation='relu'),
            tf.keras.layers.Dropout(0.2),
            tf.keras.layers.Dense(16, activation='relu'),
            tf.keras.layers.Dense(4, activation='softmax')  # 4 classes: excellent, good, acceptable, poor
        ])
        model.compile(
            optimizer='adam',
            loss='categorical_crossentropy',
            metrics=['accuracy']
        )
        return model
    
    def extract_features(self, test_data: Dict[str, Any]) -> List[float]:
        """Extrait les features du test"""
        raw_data = test_data.get('raw_data', {})
        
        # Features principales
        duration = test_data.get('duration', 0)
        gaze_time = test_data.get('gaze_time', 0)
        fixation_count = test_data.get('fixation_count', 0)
        
        # Calcule le pourcentage de suivi
        tracking_percentage = (gaze_time / duration * 100) if duration > 0 else 0
        
        # Fixations
        avg_fixation = gaze_time / fixation_count if fixation_count > 0 else 0
        
        # Statut des yeux
        eye_status = raw_data.get('eyeStatus', {})
        left_eye_open = 1 if eye_status.get('leftEyeOpen', False) else 0
        right_eye_open = 1 if eye_status.get('rightEyeOpen', False) else 0
        
        # Historique du regard
        gaze_history = raw_data.get('gazeHistory', [])
        gaze_stability = self._calculate_stability(gaze_history) if gaze_history else 0
        
        # Features: [tracking_percentage, fixation_count, avg_fixation, 
        #            left_eye_open, right_eye_open, gaze_stability, duration, gaze_time]
        features = [
            tracking_percentage,
            fixation_count,
            avg_fixation,
            left_eye_open,
            right_eye_open,
            gaze_stability,
            duration,
            gaze_time
        ]
        
        return features
    
    def _calculate_stability(self, gaze_history: List[Dict]) -> float:
        """Calcule la stabilité du regard"""
        if len(gaze_history) < 2:
            return 0.5
        
        on_target_gazes = [g for g in gaze_history if g.get('onTarget', False)]
        if len(on_target_gazes) < 2:
            return 0.5
        
        xs = [g['x'] for g in on_target_gazes]
        ys = [g['y'] for g in on_target_gazes]
        
        mean_x = np.mean(xs)
        mean_y = np.mean(ys)
        
        variance = np.mean([(x - mean_x)**2 + (y - mean_y)**2 for x, y in zip(xs, ys)])
        std_dev = np.sqrt(variance)
        
        # Normalise la stabilité (0-1, 1 = très stable)
        return max(0, 1 - (std_dev / 100))
    
    def predict(self, test_data) -> Dict[str, Any]:
        """Effectue une prédiction sur les données du test"""
        # Extrait les features
        features = self.extract_features({
            'duration': test_data.duration,
            'gaze_time': test_data.gaze_time,
            'fixation_count': test_data.fixation_count,
            'raw_data': test_data.raw_data
        })
        
        # Normalise les features
        features_array = np.array(features).reshape(1, -1)
        features_scaled = self.scaler.fit_transform(features_array)
        
        # Prédiction du modèle
        prediction = self.model.predict(features_scaled, verbose=0)
        predicted_class = np.argmax(prediction[0])
        confidence_score = float(np.max(prediction[0]))
        
        # Détection d'anomalies
        anomaly_score = float(self.anomaly_detector.decision_function(features_scaled)[0])
        anomaly_detected = self.anomaly_detector.predict(features_scaled)[0] == -1
        
        # Résultat
        result_map = ['excellent', 'good', 'acceptable', 'poor']
        result = result_map[predicted_class]
        
        # Calcul du pourcentage de suivi
        tracking_percentage = features[0]
        gaze_stability = features[5]
        gaze_consistency = self._calculate_consistency(test_data.raw_data.get('gazeHistory', []))
        
        # Évaluation clinique
        clinical_evaluation = self._generate_clinical_evaluation(
            tracking_percentage,
            gaze_stability,
            test_data.fixation_count
        )
        
        # Recommandation de suivi
        recommended_follow_up = result in ['poor', 'acceptable']
        
        return {
            'result': result,
            'confidence': confidence_score,
            'features': {
                'tracking_percentage': features[0],
                'fixation_count': features[1],
                'avg_fixation': features[2],
                'left_eye_open': features[3],
                'right_eye_open': features[4],
                'gaze_stability': features[5]
            },
            'anomaly_detected': bool(anomaly_detected),
            'anomaly_score': anomaly_score,
            'tracking_percentage': tracking_percentage,
            'gaze_stability': gaze_stability,
            'gaze_consistency': gaze_consistency,
            'clinical_evaluation': clinical_evaluation,
            'recommended_follow_up': recommended_follow_up
        }
    
    def _calculate_consistency(self, gaze_history: List[Dict]) -> float:
        """Calcule la cohérence du suivi"""
        if len(gaze_history) < 10:
            return 0.5
        
        consistency_scores = []
        window_size = 10
        
        for i in range(len(gaze_history) - window_size):
            window = gaze_history[i:i + window_size]
            on_target_count = sum(1 for g in window if g.get('onTarget', False))
            consistency_scores.append(on_target_count / window_size)
        
        return float(np.mean(consistency_scores)) if consistency_scores else 0.5
    
    def _generate_clinical_evaluation(self, tracking_percentage: float, 
                                     gaze_stability: float, 
                                     fixation_count: int) -> str:
        """Génère une évaluation clinique"""
        evaluation = []
        
        # Évaluation basée sur le pourcentage de suivi
        if tracking_percentage >= 80:
            evaluation.append('✅ Suivi oculaire excellent')
        elif tracking_percentage >= 60:
            evaluation.append('⚠️ Suivi oculaire acceptable')
        else:
            evaluation.append('⚠️ Suivi oculaire faible')
        
        # Évaluation de la stabilité
        if gaze_stability > 0.8:
            evaluation.append('✅ Regard très stable')
        elif gaze_stability > 0.6:
            evaluation.append('⚠️ Regard modérément stable')
        else:
            evaluation.append('⚠️ Regard instable')
        
        # Évaluation des fixations
        if fixation_count < 5:
            evaluation.append('✅ Nombre de fixations normal')
        else:
            evaluation.append('⚠️ Nombre élevé de fixations')
        
        return ' | '.join(evaluation)
    
    def train_model(self, X_train: np.ndarray, y_train: np.ndarray, 
                   epochs: int = 50, batch_size: int = 32):
        """Entraîne le modèle sur de nouvelles données"""
        X_scaled = self.scaler.fit_transform(X_train)
        
        self.model.fit(
            X_scaled, y_train,
            epochs=epochs,
            batch_size=batch_size,
            validation_split=0.2,
            verbose=1
        )
    
    def save_model(self, path: str):
        """Sauvegarde le modèle"""
        self.model.save(path)
        print(f"Modèle sauvegardé à {path}")
