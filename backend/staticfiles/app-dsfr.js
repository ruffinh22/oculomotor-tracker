/**
 * Application Principale - Suivi Oculaire Clinique
 * Version DSFR (Système de Design de l'État)
 */
import apiService from './services/api.service';
import stateManager from './services/state.service';
import { EyeTracker } from './eyeTracker';
import { TargetDetector } from './targetDetector';
import { DistanceEstimator } from './distanceEstimator';
import { TestAnalyzer } from './testAnalyzer';
import { renderHomeScreen, renderCalibrationScreen, renderTestScreen, renderResultsScreen, renderStatisticsScreen, renderNavbarContent, renderNotifications, } from './components/screens-dsfr';
class EyeTrackingApp {
    constructor() {
        this.eyeTracker = null;
        this.targetDetector = null;
        this.distanceEstimator = null;
        this.testAnalyzer = null;
        this.testActive = false;
        this.isCalibrating = false;
        // Stockage des intervals et animations
        this.testInterval = null;
        this.animationFrameId = null;
        this.init();
    }
    /**
     * Initialise l'application
     */
    async init() {
        console.log('🚀 Initialisation de l\'application DSFR...');
        // Nettoie les vieux tokens (au cas où la SECRET_KEY a changé)
        const tokenVersion = localStorage.getItem('token_version');
        const currentVersion = '2.0'; // Incrémenter quand SECRET_KEY change
        if (tokenVersion !== currentVersion) {
            console.log('🔄 Réinitialisation des tokens...');
            apiService.logout();
            localStorage.setItem('token_version', currentVersion);
        }
        // Vérifie l'authentification
        if (apiService.isAuthenticated()) {
            try {
                const patientData = await apiService.getPatient();
                // Convertir les propriétés snake_case en camelCase
                const patient = {
                    id: patientData.id,
                    username: patientData.user.username,
                    email: patientData.user.email,
                    firstName: patientData.user.first_name || '',
                    lastName: patientData.user.last_name || '',
                    age: patientData.age || 0
                };
                stateManager.setPatient(patient);
                stateManager.addNotification('✓ Connecté avec succès!', 'success');
            }
            catch (error) {
                console.error('Erreur de récupération du patient:', error);
                // Token invalide - nettoyer et laisser l'utilisateur s'identifier
                apiService.logout();
                localStorage.removeItem('token_version');
            }
        }
        // Initialise les modules eye tracking
        await this.initializeEyeTracking();
        // Configure les event listeners
        this.setupEventListeners();
        // Affiche l'écran initial
        this.render();
        // S'abonne aux changements d'état
        stateManager.subscribe(() => this.render());
    }
    /**
     * Initialise les modules de suivi oculaire
     */
    async initializeEyeTracking() {
        try {
            this.eyeTracker = new EyeTracker();
            // NE PAS initialiser WebGazer ici - on le fera lors de la calibration
            // await this.eyeTracker.init();
            this.targetDetector = new TargetDetector(800, 600);
            this.distanceEstimator = new DistanceEstimator();
            this.testAnalyzer = new TestAnalyzer();
            console.log('✅ Modules eye tracking initialisés');
        }
        catch (error) {
            console.error('Erreur lors de l\'initialisation:', error);
            stateManager.addNotification('Erreur: impossible d\'initialiser le eye tracker', 'error');
        }
    }
    /**
     * Configure les event listeners (appelé une seule fois)
     */
    setupEventListeners() {
        // Utiliser la délégation d'événements pour les formulaires
        document.addEventListener('submit', (e) => {
            if (!(e.target instanceof HTMLFormElement)) {
                return;
            }
            const form = e.target;
            if (form.id === 'loginForm') {
                e.preventDefault();
                this.handleLogin(form);
            }
            else if (form.id === 'registerForm') {
                e.preventDefault();
                this.handleRegister(form);
            }
        }, false);
    }
    /**
     * Gère la connexion
     */
    async handleLogin(form) {
        try {
            const usernameElement = form.querySelector('#loginUsername');
            const passwordElement = form.querySelector('#loginPassword');
            if (!usernameElement || !passwordElement) {
                stateManager.addNotification('✕ Erreur: Éléments du formulaire non trouvés', 'error');
                return;
            }
            const username = usernameElement.value;
            const password = passwordElement.value;
            const response = await apiService.login(username, password);
            stateManager.setPatient({
                id: response.user_id,
                username: response.username,
                email: response.email,
                firstName: response.first_name || '',
                lastName: response.last_name || '',
                age: 0,
            });
            stateManager.addNotification('✓ Connexion réussie!', 'success');
            this.goToScreen('home-screen');
            form.reset();
        }
        catch (error) {
            stateManager.addNotification(`✕ Erreur: ${error instanceof Error ? error.message : 'Erreur inconnue'}`, 'error');
        }
    }
    /**
     * Gère l'inscription
     */
    async handleRegister(form) {
        try {
            const usernameElement = form.querySelector('#regUsername');
            const emailElement = form.querySelector('#regEmail');
            const passwordElement = form.querySelector('#regPassword');
            const firstNameElement = form.querySelector('#regFirstName');
            const lastNameElement = form.querySelector('#regLastName');
            const ageElement = form.querySelector('#regAge');
            if (!usernameElement || !emailElement || !passwordElement || !firstNameElement || !lastNameElement || !ageElement) {
                stateManager.addNotification('✕ Erreur: Éléments du formulaire non trouvés', 'error');
                return;
            }
            const username = usernameElement.value;
            const email = emailElement.value;
            const password = passwordElement.value;
            const firstName = firstNameElement.value;
            const lastName = lastNameElement.value;
            const age = parseInt(ageElement.value);
            const response = await apiService.register(username, email, password, firstName, lastName, age);
            stateManager.setPatient({
                id: response.user_id,
                username: response.username,
                email: response.email,
                firstName,
                lastName,
                age,
            });
            stateManager.addNotification('✓ Inscription réussie! Bienvenue!', 'success');
            this.goToScreen('home-screen');
            form.reset();
        }
        catch (error) {
            stateManager.addNotification(`✕ Erreur: ${error instanceof Error ? error.message : 'Erreur inconnue'}`, 'error');
        }
    }
    /**
     * Démarre la calibration (publique pour être appelée depuis le HTML)
     */
    async startCalibration() {
        if (this.isCalibrating) {
            stateManager.addNotification('⚠️ Calibration déjà en cours...', 'warning');
            return;
        }
        if (!this.eyeTracker) {
            stateManager.addNotification('⚠️ Eye tracker non disponible', 'warning');
            return;
        }
        this.isCalibrating = true;
        try {
            stateManager.addNotification('📹 Veuillez autoriser l\'accès à votre caméra (haute résolution)...', 'info');
            // Demande l'accès à la caméra avec haute résolution
            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    width: { ideal: 1920 },
                    height: { ideal: 1080 },
                    facingMode: 'user'
                }
            });
            stateManager.addNotification('✓ Caméra autorisée!', 'success');
            // Initialise WebGazer
            await this.eyeTracker.init();
            // Fonction pour forcer le repositionnement
            const enforcePosition = () => {
                const container = document.querySelector('.webgazer-container');
                if (container) {
                    // Réinitialiser tous les styles
                    container.removeAttribute('style');
                    // Appliquer les nouveaux styles
                    container.style.cssText = `
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
                    const canvas = container.querySelector('canvas');
                    const video = container.querySelector('video');
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
            // Appliquer immédiatement
            enforcePosition();
            // Interval pour reforcer le positionnement
            const repositionInterval = setInterval(enforcePosition, 100);
            // Observer pour détecter si WebGazer change les styles
            const observer = new MutationObserver(enforcePosition);
            observer.observe(document.body, {
                attributes: true,
                subtree: true,
                attributeFilter: ['style', 'class']
            });
            // Arrêter après 10 secondes
            setTimeout(() => {
                clearInterval(repositionInterval);
                observer.disconnect();
                console.log('✅ WebGazer container repositionné - monitoring arrêté');
            }, 10000);
            // Masquer le point de regard de WebGazer pendant la calibration
            const gazePoint = document.getElementById('webgazerGazeDot');
            if (gazePoint) {
                gazePoint.style.display = 'none';
            }
            stateManager.addNotification('👀 Calibration en cours - Fixez les points rouges', 'info');
            // Lance l'interface de calibration
            this.runCalibrationUI();
            // NE PAS arrêter le stream - WebGazer en a besoin pour continuer le suivi!
        }
        catch (error) {
            const errorMsg = error instanceof Error ? error.message : 'Erreur inconnue';
            if (errorMsg.includes('NotAllowedError')) {
                stateManager.addNotification('✕ Accès à la caméra refusé', 'error');
            }
            else {
                stateManager.addNotification(`✕ Erreur: ${errorMsg}`, 'error');
            }
            console.error('Erreur calibration:', error);
            this.isCalibrating = false;
            // Arrêter WebGazer en cas d'erreur
            if (this.eyeTracker) {
                this.eyeTracker.stop();
            }
        }
    }
    /**
     * Interface de calibration interactive
     */
    runCalibrationUI() {
        const calibrationPoints = [
            { x: 100, y: 100 },
            { x: window.innerWidth - 100, y: 100 },
            { x: window.innerWidth / 2, y: window.innerHeight / 2 },
            { x: 100, y: window.innerHeight - 100 },
            { x: window.innerWidth - 100, y: window.innerHeight - 100 },
        ];
        let currentPointIndex = 0;
        // Afficher le point de regard pendant la calibration
        const gazePoint = document.getElementById('webgazerGazeDot');
        if (gazePoint) {
            gazePoint.style.display = 'block';
        }
        const showNextPoint = async () => {
            if (currentPointIndex >= calibrationPoints.length) {
                // Calibration complète
                if (this.eyeTracker) {
                    const success = this.eyeTracker.finalizeCalibration();
                    if (success) {
                        stateManager.setCalibrationPoints(this.eyeTracker.calibrationPoints);
                        stateManager.addNotification('✓ Calibration réussie! Vous pouvez procéder au test.', 'success');
                    }
                    else {
                        stateManager.addNotification('⚠️ Calibration incomplète. Réessayez.', 'warning');
                    }
                }
                // Nettoyer le point
                const pointElement = document.getElementById('calibration-point');
                if (pointElement) {
                    pointElement.remove();
                }
                // Masquer le point de regard après calibration
                const gaze = document.getElementById('webgazerGazeDot');
                if (gaze) {
                    gaze.style.display = 'none';
                }
                this.isCalibrating = false;
                return;
            }
            const point = calibrationPoints[currentPointIndex];
            // Créer et afficher le point
            let pointElement = document.getElementById('calibration-point');
            if (!pointElement) {
                pointElement = document.createElement('div');
                pointElement.id = 'calibration-point';
                pointElement.style.cssText = `
                    position: fixed;
                    width: 30px;
                    height: 30px;
                    background: radial-gradient(circle, #e74c3c, #c0392b);
                    border-radius: 50%;
                    border: 3px solid white;
                    box-shadow: 0 0 15px rgba(231, 76, 60, 0.9);
                    pointer-events: none;
                    z-index: 9999;
                    animation: pulse 1s ease-in-out infinite;
                `;
                // Ajouter animation CSS si elle n'existe pas
                if (!document.getElementById('calibration-style')) {
                    const style = document.createElement('style');
                    style.id = 'calibration-style';
                    style.textContent = `
                        @keyframes pulse {
                            0%, 100% { transform: scale(1); }
                            50% { transform: scale(1.2); }
                        }
                    `;
                    document.head.appendChild(style);
                }
                document.body.appendChild(pointElement);
            }
            pointElement.style.left = (point.x - 15) + 'px';
            pointElement.style.top = (point.y - 15) + 'px';
            pointElement.style.display = 'block';
            stateManager.addNotification(`Point ${currentPointIndex + 1}/5: Fixez le point rouge`, 'info');
            console.log(`Calibration point ${currentPointIndex + 1}:`, point);
            // Attendre que WebGazer détecte les yeux avant d'enregistrer
            let waitAttempts = 0;
            const maxAttempts = 50; // 5 secondes max (100ms * 50)
            const waitForGazeData = setInterval(() => {
                waitAttempts++;
                if (this.eyeTracker && this.eyeTracker.gazeData) {
                    // Nous avons des données de regard
                    clearInterval(waitForGazeData);
                    const success = this.eyeTracker.addCalibrationPoint(point.x, point.y);
                    console.log('Point enregistré:', success);
                    stateManager.addCalibrationPoint({ x: point.x, y: point.y });
                    currentPointIndex++;
                    showNextPoint();
                }
                else if (waitAttempts >= maxAttempts) {
                    // Timeout - continuer malgré tout
                    clearInterval(waitForGazeData);
                    console.warn('Timeout attente données de regard');
                    const success = this.eyeTracker?.addCalibrationPoint(point.x, point.y) ?? false;
                    console.log('Point enregistré (timeout):', success);
                    stateManager.addCalibrationPoint({ x: point.x, y: point.y });
                    currentPointIndex++;
                    showNextPoint();
                }
            }, 100);
        };
        showNextPoint();
    }
    /**
     * Démarre un test (publique pour être appelée depuis le HTML)
     */
    async startTest() {
        if (!this.eyeTracker || !this.targetDetector) {
            stateManager.addNotification('⚠️ Eye tracker non disponible', 'warning');
            return;
        }
        // Vérifier si WebGazer est initialisé et a des données
        if (!window.webgazer) {
            stateManager.addNotification('⚠️ WebGazer non initialisé', 'warning');
            return;
        }
        try {
            // Initialiser le nouvel test
            stateManager.startNewTest();
            this.testActive = true;
            // Mettre à jour l'écran IMMÉDIATEMENT
            this.render();
            // Afficher le point de regard pendant le test
            setTimeout(() => {
                const gazePoint = document.getElementById('webgazerGazeDot');
                if (gazePoint) {
                    gazePoint.style.display = 'block';
                }
            }, 100);
            // Lancer le suivi de l'œil (WebGazer est déjà init depuis la calibration)
            this.eyeTracker.startTracking();
            stateManager.addNotification('▶️ Test démarré! Regardez les cibles.', 'success');
            // Initialiser et démarrer le dessin des cibles
            this.startDrawingTargets();
            // Mettre à jour les données du test en temps réel
            const testData = stateManager.getState().currentTest;
            if (!testData || !testData.startTime) {
                throw new Error('Test data not initialized');
            }
            const testStartTime = testData.startTime;
            // Stocker l'interval pour pouvoir l'arrêter plus tard
            this.testInterval = setInterval(() => {
                if (!this.testActive) {
                    if (this.testInterval) {
                        clearInterval(this.testInterval);
                        this.testInterval = null;
                    }
                    return;
                }
                const currentTime = Date.now();
                const elapsed = (currentTime - testStartTime) / 1000;
                // Essayer de récupérer la position du regard
                const gazePos = this.eyeTracker?.getGazePosition();
                if (gazePos && this.targetDetector) {
                    // Données de gaze position capturées - pas besoin de les passer à updateTestData
                    // car elles sont traitées par targetDetector directement
                }
                else if (!gazePos) {
                    // Déboguer: WebGazer ne retourne pas de données
                    console.warn('⚠️ Gaze position null - WebGazer peut ne pas avoir de données');
                }
                // Mettre à jour les éléments HTML directement (plus rapide que le re-render)
                const state = stateManager.getState();
                const test = state.currentTest;
                const durationEl = document.getElementById('testDuration');
                if (durationEl) {
                    durationEl.textContent = elapsed.toFixed(1) + 's';
                }
                const trackingEl = document.getElementById('testTracking');
                if (trackingEl && test) {
                    trackingEl.textContent = (test.trackingPercentage || 0).toFixed(0) + '%';
                }
                const fixationsEl = document.getElementById('testFixations');
                if (fixationsEl && test) {
                    fixationsEl.textContent = (test.fixationCount || 0).toString();
                }
                // Afficher l'état des yeux
                const eyeStateEl = document.getElementById('testEyeState');
                if (eyeStateEl && this.eyeTracker) {
                    const eyeState = this.eyeTracker.getEyeState();
                    let stateText = '';
                    let stateColor = '';
                    if (eyeState === 2) {
                        stateText = '👁️👁️ Deux yeux';
                        stateColor = '#10b981'; // Vert
                    }
                    else if (eyeState === 1) {
                        stateText = '👁️ Un oeil';
                        stateColor = '#f59e0b'; // Orange
                    }
                    else {
                        stateText = '● ● Fermés';
                        stateColor = '#ef4444'; // Rouge
                    }
                    eyeStateEl.textContent = stateText;
                    eyeStateEl.style.color = stateColor;
                    eyeStateEl.style.fontWeight = 'bold';
                }
                // Afficher la stabilité du regard
                const stabilityEl = document.getElementById('testStability');
                if (stabilityEl && this.eyeTracker) {
                    const stability = this.eyeTracker.getGazeStability();
                    stabilityEl.textContent = stability.toFixed(0) + '%';
                    stabilityEl.style.color = stability > 70 ? '#10b981' : stability > 40 ? '#f59e0b' : '#ef4444';
                }
                // Afficher la confiance du suivi
                const confidenceEl = document.getElementById('testConfidence');
                if (confidenceEl && this.eyeTracker && this.eyeTracker.gazeData) {
                    const confidence = (this.eyeTracker.gazeData.confidence * 100).toFixed(0);
                    confidenceEl.textContent = confidence + '%';
                    confidenceEl.style.color = parseInt(confidence) > 80 ? '#10b981' : parseInt(confidence) > 60 ? '#f59e0b' : '#ef4444';
                }
            }, 100); // Mettre à jour tous les 100ms
        }
        catch (error) {
            console.error('Erreur au démarrage du test:', error);
            stateManager.addNotification(`✕ Erreur: ${error instanceof Error ? error.message : 'Erreur inconnue'}`, 'error');
            this.testActive = false;
        }
    }
    /**
     * Arrête le test (publique pour être appelée depuis le HTML)
     */
    async stopTest() {
        console.log('🛑 stopTest appelé - testActive:', this.testActive);
        if (!this.testActive) {
            console.warn('⚠️ Test non actif, impossible d\'arrêter');
            return;
        }
        // Marquer le test comme inactif immédiatement
        this.testActive = false;
        // Arrêter l'interval de mise à jour
        if (this.testInterval) {
            clearInterval(this.testInterval);
            this.testInterval = null;
            console.log('✓ Test interval arrêté');
        }
        // Arrêter l'animation des cibles
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
            console.log('✓ Animation frame arrêtée');
        }
        try {
            // Arrêter le suivi
            if (this.eyeTracker) {
                this.eyeTracker.stopTracking();
                console.log('✓ Eye tracker arrêté');
            }
            // Masquer le point de regard
            const gazePoint = document.getElementById('webgazerGazeDot');
            if (gazePoint) {
                gazePoint.style.display = 'none';
            }
            const testData = stateManager.finishCurrentTest();
            console.log('Test data:', testData);
            if (testData) {
                console.log('Soumission du test au backend...');
                // Soumet le test au backend
                const result = await apiService.createTest({
                    duration: testData.totalTime,
                    gaze_time: testData.gazeTime,
                    tracking_percentage: testData.trackingPercentage,
                    fixation_count: testData.fixationCount,
                    avg_fixation_duration: testData.avgFixationDuration,
                    max_fixation_duration: testData.maxFixationDuration || 0,
                    min_fixation_duration: testData.minFixationDuration || 0,
                    gaze_stability: testData.gazeStability,
                    gaze_consistency: testData.gazeConsistency,
                    raw_data: testData.rawData,
                });
                console.log('✓ Test enregistré:', result);
                stateManager.addTestResult(result);
                stateManager.addNotification('✓ Test enregistré avec succès!', 'success');
                // Naviguer vers l'écran des résultats
                this.goToScreen('results-screen');
                // Re-render après transition
                setTimeout(() => this.render(), 100);
            }
            else {
                console.warn('⚠️ Pas de données de test');
                stateManager.addNotification('⚠️ Pas de données de test', 'warning');
            }
        }
        catch (error) {
            console.error('❌ Erreur lors de l\'arrêt du test:', error);
            stateManager.addNotification(`✕ Erreur: ${error instanceof Error ? error.message : 'Erreur inconnue'}`, 'error');
        }
    }
    /**
     * Charge et affiche les résultats des tests
     */
    async loadResults() {
        try {
            stateManager.addNotification('⏳ Chargement des résultats...', 'info');
            const tests = await apiService.getTests();
            tests.forEach((test) => stateManager.addTestResult(test));
            this.goToScreen('results-screen');
        }
        catch (error) {
            stateManager.addNotification(`✕ Erreur: ${error instanceof Error ? error.message : 'Erreur inconnue'}`, 'error');
        }
    }
    /**
     * Affiche les détails d'un test spécifique
     */
    async viewTest(testId) {
        try {
            const test = await apiService.getTest(testId);
            console.log('📋 Détails du test:', test);
            stateManager.addNotification(`Test #${testId} chargé`, 'success');
            // Vous pouvez ajouter ici un écran de détails ou un modal
        }
        catch (error) {
            stateManager.addNotification(`✕ Erreur: ${error instanceof Error ? error.message : 'Erreur inconnue'}`, 'error');
        }
    }
    /**
     * Exporte un test en PDF
     */
    async exportTestPDF(testId) {
        try {
            stateManager.addNotification('⏳ Génération du PDF...', 'info');
            const blob = await apiService.exportTestPDF(testId);
            this.downloadBlob(blob, `test_${testId}.pdf`);
            stateManager.addNotification('✓ PDF téléchargé avec succès!', 'success');
        }
        catch (error) {
            stateManager.addNotification(`✕ Erreur: ${error instanceof Error ? error.message : 'Erreur inconnue'}`, 'error');
        }
    }
    /**
     * Exporte tous les tests en PDF
     */
    async exportAllTestsPDF() {
        try {
            stateManager.addNotification('⏳ Génération du PDF complet...', 'info');
            const blob = await apiService.exportAllTestsPDF();
            this.downloadBlob(blob, 'tous_les_tests.pdf');
            stateManager.addNotification('✓ PDF téléchargé avec succès!', 'success');
        }
        catch (error) {
            stateManager.addNotification(`✕ Erreur: ${error instanceof Error ? error.message : 'Erreur inconnue'}`, 'error');
        }
    }
    /**
     * Utilitaire pour télécharger un blob en tant que fichier
     */
    downloadBlob(blob, filename) {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }
    /**
     * Navigue vers un écran
     */
    goToScreen(screenName) {
        stateManager.setScreen(screenName);
    }
    /**
     * Déconnecte l'utilisateur
     */
    logout() {
        apiService.logout();
        stateManager.reset();
        stateManager.addNotification('✓ Déconnecté!', 'info');
        this.goToScreen('home-screen');
    }
    /**
     * Affiche l'application
     */
    render() {
        const app = document.getElementById('app');
        const navbarMenu = document.getElementById('navbarMenu');
        if (!app || !navbarMenu)
            return;
        const state = stateManager.getState();
        let screenContent = '';
        // Met à jour la navbar
        navbarMenu.innerHTML = renderNavbarContent();
        // Affiche l'écran approprié basé sur currentScreen
        switch (state.currentScreen) {
            case 'home-screen':
                screenContent = renderHomeScreen();
                break;
            case 'calibration-screen':
                screenContent = renderCalibrationScreen();
                break;
            case 'test-screen':
                screenContent = renderTestScreen();
                break;
            case 'results-screen':
                screenContent = renderResultsScreen();
                break;
            case 'statistics-screen':
                screenContent = renderStatisticsScreen();
                break;
            default:
                screenContent = renderHomeScreen();
        }
        // Efface complètement le contenu précédent et ajoute le nouvel écran
        app.innerHTML = screenContent;
        // Ajoute les notifications en tant qu'élément séparé
        const notificationsDiv = document.createElement('div');
        notificationsDiv.style.position = 'fixed';
        notificationsDiv.style.top = '100px';
        notificationsDiv.style.right = '20px';
        notificationsDiv.style.maxWidth = '400px';
        notificationsDiv.style.zIndex = '1000';
        notificationsDiv.innerHTML = renderNotifications();
        app.parentElement?.appendChild(notificationsDiv);
    }
    /**
     * Démarre l'animation des cibles sur le canvas
     */
    startDrawingTargets() {
        const canvas = document.getElementById('testCanvas');
        if (!canvas) {
            console.error('❌ Canvas testCanvas non trouvé');
            return;
        }
        if (!this.targetDetector) {
            console.error('❌ targetDetector non initialisé');
            return;
        }
        const ctx = canvas.getContext('2d');
        if (!ctx) {
            console.error('❌ Impossible d\'obtenir le contexte du canvas');
            return;
        }
        console.log('✅ Canvas initialisé:', {
            width: canvas.width,
            height: canvas.height,
            targetDetectorWidth: this.targetDetector.width,
            targetDetectorHeight: this.targetDetector.height
        });
        // Boucle d'animation des cibles
        const drawFrame = () => {
            if (!this.testActive) {
                this.animationFrameId = null;
                return;
            }
            // Effacer le canvas
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            // Mettre à jour la position de la cible
            this.targetDetector?.update();
            // Dessiner la cible
            this.targetDetector?.draw(ctx);
            // Continuer l'animation
            this.animationFrameId = requestAnimationFrame(drawFrame);
        };
        console.log('🎯 Démarrage du dessin des cibles...');
        // Démarrer la boucle d'animation
        this.animationFrameId = requestAnimationFrame(drawFrame);
    }
}
// Lance l'application
const app = new EyeTrackingApp();
// Expose à la fenêtre globale pour les onclick HTML
window.app = app;
export default app;
//# sourceMappingURL=app-dsfr.js.map