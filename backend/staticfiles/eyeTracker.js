/**
 * Module de suivi oculaire professionnel avec WebGazer
 * Haute précision avec filtres Kalman et lissage avancé
 */
// Filtre Kalman simple pour lissage des données
class KalmanFilter {
    constructor(initialValue, processNoise = 0.01, measurementNoise = 4) {
        this.x = initialValue;
        this.p = 1;
        this.q = processNoise;
        this.r = measurementNoise;
        this.k = 0;
    }
    update(measurement) {
        // Prédiction
        this.p = this.p + this.q;
        // Mise à jour
        this.k = this.p / (this.p + this.r);
        this.x = this.x + this.k * (measurement - this.x);
        this.p = (1 - this.k) * this.p;
        return this.x;
    }
}
export class EyeTracker {
    constructor() {
        this.isCalibrated = false;
        this.gazeData = null;
        this.previousGazeData = null;
        this.calibrationPoints = [];
        this.isTracking = false;
        this.eyeOpenThreshold = 0.3;
        // Filtres Kalman pour lissage
        this.kalmanX = new KalmanFilter(0);
        this.kalmanY = new KalmanFilter(0);
        // Historique pour calculs avancés
        this.gazeHistory = [];
        this.maxHistorySize = 50;
        // Détection des yeux
        this.leftEyeOpenCount = 0;
        this.rightEyeOpenCount = 0;
        this.eyeStateBuffer = 5;
    }
    /**
     * Initialise WebGazer avec affichage de la vidéo
     */
    async init() {
        return new Promise((resolve, reject) => {
            console.log('🚀 Initialisation de WebGazer...');
            console.log('📹 Vérification de la disponibilité de la caméra...');
            // Vérifier la disponibilité de la caméra d'abord
            navigator.mediaDevices
                .enumerateDevices()
                .then(devices => {
                const cameras = devices.filter(device => device.kind === 'videoinput');
                console.log(`📷 Caméras détectées: ${cameras.length}`);
                cameras.forEach((camera, idx) => {
                    console.log(`  ${idx + 1}. ${camera.label || 'Caméra sans label'}`);
                });
                if (cameras.length === 0) {
                    console.error('❌ Aucune caméra trouvée');
                    reject(new Error('Caméra non trouvée'));
                    return;
                }
                console.log('✅ Caméra détectée');
                // Vérifier que WebGazer est chargé
                if (!window.webgazer) {
                    console.error('❌ WebGazer non chargé');
                    reject(new Error('WebGazer non chargé'));
                    return;
                }
                console.log('✅ WebGazer détecté');
                // Initialiser WebGazer
                console.log('🔄 Configuration du tracker TFFacemesh...');
                // Configurer le container pour WebGazer
                const container = document.getElementById('webgazerVideoContainer');
                if (container) {
                    console.log('✅ Container WebGazer trouvé');
                }
                window.webgazer
                    .setRegression('ridge')
                    .setTracker('TFFacemesh')
                    .begin()
                    .then(() => {
                    console.log('✅ WebGazer.begin() complété');
                    // Force le container WebGazer à utiliser le nôtre
                    const webgazerContainer = document.querySelector('.webgazer-container');
                    if (webgazerContainer && container) {
                        console.log('📦 Déplacement du container WebGazer...');
                        container.appendChild(webgazerContainer);
                    }
                    // Afficher la vidéo de la caméra
                    this.showWebcamVideo();
                    this.setupGazeListener();
                    // Attendre que les données de regard arrivent
                    let attempts = 0;
                    const maxAttempts = 100; // 10 secondes (100ms * 100)
                    console.log(`⏳ Attente des données de regard (max ${maxAttempts * 100}ms)...`);
                    const waitForData = setInterval(() => {
                        attempts++;
                        if (this.gazeData) {
                            clearInterval(waitForData);
                            console.log(`✅ Données de regard reçues après ${attempts * 100}ms`);
                            resolve();
                        }
                        else if (attempts % 10 === 0) {
                            console.log(`  ... en attente (${attempts * 100}ms écoulées)`);
                        }
                        if (attempts >= maxAttempts) {
                            clearInterval(waitForData);
                            console.warn('⚠️ Timeout attente données de regard - continuant malgré tout');
                            resolve(); // Continuer de toute manière
                        }
                    }, 100);
                })
                    .catch((error) => {
                    console.error('❌ Erreur WebGazer:', error);
                    reject(error);
                });
            })
                .catch((error) => {
                console.error('❌ Erreur accès caméra:', error);
                reject(error);
            });
        });
    }
    /**
     * Affiche la vidéo de la caméra
     */
    showWebcamVideo() {
        console.log('📹 Initialisation du container vidéo...');
        const container = document.getElementById('webgazerVideoContainer');
        if (!container) {
            console.error('❌ Container #webgazerVideoContainer non trouvé dans le DOM');
            return;
        }
        // Fonction pour appliquer les styles
        const applyStyles = () => {
            // Style le container principal
            container.style.cssText = `
                display: block !important;
                position: fixed !important;
                bottom: 10px !important;
                right: 10px !important;
                top: auto !important;
                left: auto !important;
                width: 200px !important;
                height: 150px !important;
                border-radius: 10px !important;
                border: 3px solid #10b981 !important;
                z-index: 99998 !important;
                box-shadow: 0 4px 15px rgba(16, 185, 129, 0.4) !important;
                background: #000 !important;
                overflow: hidden !important;
            `;
            // Style le container WebGazer s'il existe
            const webgazerContainer = document.querySelector('.webgazer-container');
            if (webgazerContainer) {
                webgazerContainer.style.cssText = `
                    position: fixed !important;
                    bottom: 10px !important;
                    right: 10px !important;
                    top: auto !important;
                    left: auto !important;
                    width: 200px !important;
                    height: 150px !important;
                    z-index: 99998 !important;
                    border-radius: 10px !important;
                    border: 3px solid #10b981 !important;
                    box-shadow: 0 4px 15px rgba(16, 185, 129, 0.4) !important;
                    background: #000 !important;
                    overflow: hidden !important;
                    display: block !important;
                `;
                // Style les éléments internes
                const canvas = webgazerContainer.querySelector('canvas');
                const video = webgazerContainer.querySelector('video');
                if (canvas) {
                    canvas.style.cssText = `
                        width: 100% !important;
                        height: 100% !important;
                        display: block !important;
                        border-radius: 8px !important;
                        object-fit: cover !important;
                    `;
                }
                if (video) {
                    video.style.cssText = `
                        width: 100% !important;
                        height: 100% !important;
                        display: block !important;
                        border-radius: 8px !important;
                        object-fit: cover !important;
                    `;
                }
            }
        };
        // Applique les styles immédiatement
        applyStyles();
        console.log('✅ Conteneur vidéo stylisé (1ère fois)');
        // Réapplique les styles régulièrement
        const styleInterval = setInterval(() => {
            applyStyles();
        }, 200); // Recheck tous les 200ms
        // Observer pour capturer les changements DOM
        const observer = new MutationObserver(() => {
            applyStyles();
        });
        observer.observe(container, {
            attributes: true,
            childList: true,
            subtree: true,
        });
        // Arrêter après 5 secondes
        setTimeout(() => {
            clearInterval(styleInterval);
            observer.disconnect();
            console.log('✅ Repositionnement WebGazer finalisé');
        }, 5000);
    }
    /**
     * Masque la vidéo de la caméra
     */
    hideWebcamVideo() {
        const container = document.getElementById('webgazerVideoContainer');
        if (container) {
            container.style.display = 'none';
        }
    } /**
     * Configure l'écouteur de regard avec filtrage avancé
     */
    setupGazeListener() {
        console.log('🔧 Configuration du listener de regard...');
        window.webgazer.setGazeListener((data, elapsedTime) => {
            // Log très détaillé pour diagnostic
            if (data == null) {
                console.warn('⚠️ data null reçue');
                return;
            }
            // Log les données brutes reçues (une fois tous les 50 appels pour ne pas flooder)
            if (Math.random() < 0.02) {
                console.log('📊 Données WebGazer brutes:', {
                    x: data.x?.toFixed(0),
                    y: data.y?.toFixed(0),
                    left: data.left ? {
                        x: data.left.x?.toFixed(1),
                        y: data.left.y?.toFixed(1),
                        area: data.left.area?.toFixed(3),
                        confidence: data.left.confidence?.toFixed(2)
                    } : null,
                    right: data.right ? {
                        x: data.right.x?.toFixed(1),
                        y: data.right.y?.toFixed(1),
                        area: data.right.area?.toFixed(3),
                        confidence: data.right.confidence?.toFixed(2)
                    } : null,
                });
            }
            // Appliquer le filtre Kalman pour lissage
            const smoothedX = this.kalmanX.update(data.x);
            const smoothedY = this.kalmanY.update(data.y);
            // Détecter l'état des yeux (ouvert/fermé)
            const leftEyeOpen = this.isEyeOpen(data.left);
            const rightEyeOpen = this.isEyeOpen(data.right);
            // Mettre à jour les compteurs d'état des yeux
            if (leftEyeOpen)
                this.leftEyeOpenCount++;
            else
                this.leftEyeOpenCount = Math.max(0, this.leftEyeOpenCount - 1);
            if (rightEyeOpen)
                this.rightEyeOpenCount++;
            else
                this.rightEyeOpenCount = Math.max(0, this.rightEyeOpenCount - 1);
            // Calculer la confiance basée sur la qualité des données
            const confidence = this.calculateConfidence(data);
            this.previousGazeData = this.gazeData;
            this.gazeData = {
                x: smoothedX,
                y: smoothedY,
                timestamp: elapsedTime,
                leftEye: data.left
                    ? {
                        x: data.left.x,
                        y: data.left.y,
                        open: leftEyeOpen,
                        confidence: data.left.confidence || 0.8,
                    }
                    : null,
                rightEye: data.right
                    ? {
                        x: data.right.x,
                        y: data.right.y,
                        open: rightEyeOpen,
                        confidence: data.right.confidence || 0.8,
                    }
                    : null,
                confidence: confidence,
            };
            // Ajouter à l'historique
            this.gazeHistory.push({
                x: smoothedX,
                y: smoothedY,
                timestamp: Date.now(),
            });
            if (this.gazeHistory.length > this.maxHistorySize) {
                this.gazeHistory.shift();
            }
            if (typeof window.onGazeUpdate === 'function') {
                window.onGazeUpdate(this.gazeData);
            }
        });
    }
    /**
     * Détermine si un oeil est ouvert avec détection améliorée
     */
    isEyeOpen(eye) {
        if (!eye)
            return false;
        // Si nous avons une confiance explicite de WebGazer, l'utiliser
        if (eye.confidence !== undefined) {
            // Confiance > 0.5 généralement = oeil ouvert
            return eye.confidence > 0.3;
        }
        // Si nous avons une aire (area), l'utiliser
        if (eye.area !== undefined) {
            // Un œil fermé a généralement une area très petite
            // Un œil ouvert a une area > 0.15
            return eye.area > 0.15;
        }
        // Si nous avons des coordonnées valides, c'est probablement ouvert
        if (eye.x !== undefined && eye.y !== undefined && eye.x !== null && eye.y !== null) {
            // Des coordonnées (0, 0) suggèrent un œil fermé
            if (eye.x === 0 && eye.y === 0) {
                return false;
            }
            // Des coordonnées valides = oeil ouvert
            return true;
        }
        // Par défaut, considérer comme ouvert si on a les données
        return eye.x !== undefined || eye.y !== undefined;
    }
    /**
     * Calcule la confiance du suivi oculaire
     */
    calculateConfidence(data) {
        let confidence = 0.8; // Confiance de base
        // Améliorer la confiance si les deux yeux sont ouverts
        if (data.left?.open && data.right?.open) {
            confidence += 0.1;
        }
        // Ajouter la confiance basée sur la stabilité
        if (this.previousGazeData) {
            const dx = Math.abs(data.x - this.previousGazeData.x);
            const dy = Math.abs(data.y - this.previousGazeData.y);
            const distance = Math.sqrt(dx * dx + dy * dy);
            // Si le mouvement est très faible, augmenter la confiance
            if (distance < 5) {
                confidence += 0.05;
            }
        }
        return Math.min(1, confidence);
    }
    /**
     * Détermine si les yeux sont ouverts
     */
    areEyesOpen() {
        if (!this.gazeData)
            return false;
        const leftOpen = this.gazeData.leftEye?.open ?? false;
        const rightOpen = this.gazeData.rightEye?.open ?? false;
        return leftOpen || rightOpen;
    }
    /**
     * Retourne l'état des yeux (0: fermés, 1: un œil, 2: deux yeux)
     */
    /**
     * Retourne l'état des yeux (0: fermés, 1: un œil, 2: deux yeux)
     * Méthode améliorée basée sur les données actuelles
     */
    getEyeState() {
        if (!this.gazeData)
            return 0;
        // Si WebGazer envoie des données de regard précises, les yeux sont ouverts
        // Le tracking percentage > 0 signifie que les yeux sont détectés
        // et que WebGazer a une position du regard fiable
        // Vérification 1: Confiance > 0.5 signifie yeux détectés et ouverts
        const hasGoodTracking = this.gazeData.confidence > 0.5;
        if (hasGoodTracking) {
            // Si on a bon tracking, vérifier les deux yeux
            const leftOpen = this.gazeData.leftEye?.open ?? false;
            const rightOpen = this.gazeData.rightEye?.open ?? false;
            if (leftOpen && rightOpen)
                return 2;
            if (leftOpen || rightOpen)
                return 1;
            // Si on a bon tracking mais pas d'info sur les yeux, les deux sont probablement ouverts
            return 2;
        }
        // Fallback: Vérifier les compteurs si on n'a pas bon tracking
        const leftOpen = this.leftEyeOpenCount >= this.eyeStateBuffer;
        const rightOpen = this.rightEyeOpenCount >= this.eyeStateBuffer;
        if (leftOpen && rightOpen)
            return 2;
        if (leftOpen || rightOpen)
            return 1;
        return 0;
    }
    /**
     * Obtient la position actuelle du regard
     */
    getGazePosition() {
        if (!this.gazeData)
            return null;
        return {
            x: this.gazeData.x,
            y: this.gazeData.y,
        };
    }
    /**
     * Calcule la stabilité du regard (variance)
     */
    getGazeStability() {
        if (this.gazeHistory.length < 5)
            return 0;
        // Calculer la moyenne
        const meanX = this.gazeHistory.reduce((sum, g) => sum + g.x, 0) / this.gazeHistory.length;
        const meanY = this.gazeHistory.reduce((sum, g) => sum + g.y, 0) / this.gazeHistory.length;
        // Calculer la variance
        const varianceX = this.gazeHistory.reduce((sum, g) => sum + Math.pow(g.x - meanX, 2), 0) / this.gazeHistory.length;
        const varianceY = this.gazeHistory.reduce((sum, g) => sum + Math.pow(g.y - meanY, 2), 0) / this.gazeHistory.length;
        const stdDev = Math.sqrt((varianceX + varianceY) / 2);
        // Retourner une score d'stabilité (0-100, 100 = très stable)
        return Math.max(0, 100 - stdDev);
    }
    /**
     * Ajoute un point de calibration
     */
    addCalibrationPoint(x, y) {
        if (!this.gazeData) {
            console.warn('Pas de données de regard disponibles - attente de WebGazer...');
            return false;
        }
        // Vérifier que les données du regard sont valides
        if (this.gazeData.x < 0 || this.gazeData.y < 0 ||
            this.gazeData.x > window.innerWidth || this.gazeData.y > window.innerHeight) {
            console.warn('Données de regard invalides');
            return false;
        }
        this.calibrationPoints.push({
            screenX: x,
            screenY: y,
            gazeX: this.gazeData.x,
            gazeY: this.gazeData.y,
        });
        console.log(`✓ Point de calibration ajouté: (${x}, ${y}) -> (${this.gazeData.x.toFixed(0)}, ${this.gazeData.y.toFixed(0)})`);
        return true;
    }
    /**
     * Finalise la calibration
     */
    finalizeCalibration() {
        if (this.calibrationPoints.length < 5) {
            console.warn('Calibration incomplète');
            return false;
        }
        this.isCalibrated = true;
        console.log('✅ Calibration finalisée avec succès');
        return true;
    }
    /**
     * Démarre le suivi du regard
     */
    startTracking() {
        this.isTracking = true;
    }
    /**
     * Arrête le suivi du regard
     */
    stopTracking() {
        this.isTracking = false;
        this.hideWebcamVideo();
    }
    /**
     * Arrête WebGazer
     */
    stop() {
        this.hideWebcamVideo();
        window.webgazer.end();
        this.isTracking = false;
    }
}
//# sourceMappingURL=eyeTracker.js.map