/**
 * Application Principale - Suivi Oculaire Clinique
 * Version professionnelle refactorisée
 */
import apiService from './services/api.service';
import stateManager from './services/state.service';
import { EyeTracker } from './eyeTracker';
import { TargetDetector } from './targetDetector';
import { renderHomeScreen, renderCalibrationScreen, renderTestScreen, renderResultsScreen, renderStatisticsScreen, renderNavbar, renderNotifications, } from './components/screens';
class EyeTrackingApp {
    constructor() {
        this.eyeTracker = null;
        this.targetDetector = null;
        // private distanceEstimator: DistanceEstimator | null = null;
        // private testAnalyzer: TestAnalyzer | null = null;
        this.testActive = false;
        // Crée le container WebGazer avant l'initialisation
        this.createWebGazerContainer();
        this.init();
    }
    /**
     * Crée le container pour WebGazer
     */
    createWebGazerContainer() {
        if (!document.getElementById('webgazerVideoContainer')) {
            const container = document.createElement('div');
            container.id = 'webgazerVideoContainer';
            document.body.appendChild(container);
        }
    }
    /**
     * Initialise l'application
     */
    async init() {
        console.log('🚀 Initialisation de l\'application...');
        // Vérifie l'authentification
        if (apiService.isAuthenticated()) {
            try {
                const patient = await apiService.getPatient();
                stateManager.setPatient(patient);
                stateManager.addNotification('Connecté avec succès!', 'success');
            }
            catch (error) {
                console.error('Erreur de récupération du patient:', error);
                apiService.logout();
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
            this.targetDetector = new TargetDetector(800, 600);
            // Fonction pour forcer le repositionnement
            const enforcePosition = () => {
                const container = document.querySelector('.webgazer-container');
                if (container) {
                    // Forcer le style avec cssText (plus puissant que les propriétés individuelles)
                    const styleString = `
                        position: fixed !important;
                        bottom: 10px !important;
                        right: 10px !important;
                        top: auto !important;
                        left: auto !important;
                        width: 200px !important;
                        height: 150px !important;
                        z-index: 99998 !important;
                        border-radius: 10px !important;
                        border: 3px solid #0066cc !important;
                        box-shadow: 0 4px 15px rgba(0, 102, 204, 0.4) !important;
                        background: #000 !important;
                        overflow: hidden !important;
                        display: block !important;
                    `;
                    container.style.cssText = styleString;
                    // Supprimer les attributs de style inline qui pourraient interférer
                    container.removeAttribute('data-webgazer');
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
            // Continuous repositioning avec requestAnimationFrame pour une meilleure performance
            let isRepositioning = true;
            const reposition = () => {
                if (isRepositioning) {
                    enforcePosition();
                    requestAnimationFrame(reposition);
                }
            };
            reposition();
            // Observer pour détecter si WebGazer change les styles
            const observer = new MutationObserver(() => {
                enforcePosition();
            });
            const container = document.querySelector('.webgazer-container');
            if (container) {
                observer.observe(container, {
                    attributes: true,
                    attributeOldValue: true,
                    attributeFilter: ['style', 'data-webgazer']
                });
            }
            // Arrêter après 15 secondes (mais continuer à observer)
            setTimeout(() => {
                isRepositioning = false;
                console.log('✅ WebGazer container repositionné - monitoring actif');
            }, 15000);
            console.log('✅ Modules eye tracking initialisés');
        }
        catch (error) {
            console.error('Erreur lors de l\'initialisation:', error);
            stateManager.addNotification('Erreur: impossible d\'initialiser le eye tracker', 'error');
        }
    }
    /**
     * Configure les event listeners
     */
    setupEventListeners() {
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
        });
        document.addEventListener('click', (e) => {
            const target = e.target;
            if (target.id === 'startCalibration') {
                this.startCalibration();
            }
            else if (target.id === 'startTest') {
                this.startTest();
            }
            else if (target.id === 'stopTest') {
                this.stopTest();
            }
        });
    }
    /**
     * Gère la connexion
     */
    async handleLogin(form) {
        try {
            const usernameElement = form.querySelector('#loginUsername');
            const passwordElement = form.querySelector('#loginPassword');
            if (!usernameElement || !passwordElement) {
                stateManager.addNotification('Erreur: Éléments du formulaire non trouvés', 'error');
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
            stateManager.addNotification('Connexion réussie!', 'success');
            this.goToScreen('home-screen');
            form.reset();
        }
        catch (error) {
            stateManager.addNotification(`Erreur de connexion: ${error instanceof Error ? error.message : 'Erreur inconnue'}`, 'error');
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
                stateManager.addNotification('Erreur: Éléments du formulaire non trouvés', 'error');
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
            stateManager.addNotification('Inscription réussie! Bienvenue!', 'success');
            this.goToScreen('home-screen');
            form.reset();
        }
        catch (error) {
            stateManager.addNotification(`Erreur d'inscription: ${error instanceof Error ? error.message : 'Erreur inconnue'}`, 'error');
        }
    }
    /**
     * Démarre la calibration
     */
    async startCalibration() {
        if (!this.eyeTracker) {
            stateManager.addNotification('Eye tracker non disponible', 'error');
            return;
        }
        try {
            stateManager.addNotification('Démarrage de la calibration...', 'info');
            // La calibration est gérée par le module eyeTracker
            // Vous pouvez ajouter ici la logique spécifique
        }
        catch (error) {
            stateManager.addNotification(`Erreur de calibration: ${error instanceof Error ? error.message : 'Erreur inconnue'}`, 'error');
        }
    }
    /**
     * Démarre un test
     */
    async startTest() {
        if (!this.eyeTracker || !this.targetDetector) {
            stateManager.addNotification('Eye tracker non disponible', 'error');
            return;
        }
        try {
            stateManager.startNewTest();
            this.testActive = true;
            stateManager.addNotification('Test démarré!', 'success');
            // Lance le suivi oculaire
            // this.eyeTracker.start();
        }
        catch (error) {
            stateManager.addNotification(`Erreur du test: ${error instanceof Error ? error.message : 'Erreur inconnue'}`, 'error');
            this.testActive = false;
        }
    }
    /**
     * Arrête le test
     */
    async stopTest() {
        if (!this.testActive)
            return;
        try {
            const testData = stateManager.finishCurrentTest();
            if (testData) {
                // Soumet le test au backend
                const result = await apiService.createTest({
                    duration: testData.totalTime,
                    gaze_time: testData.gazeTime,
                    tracking_percentage: testData.trackingPercentage,
                    fixation_count: testData.fixationCount,
                    avg_fixation_duration: testData.avgFixationDuration,
                    max_fixation_duration: testData.avgFixationDuration,
                    min_fixation_duration: testData.avgFixationDuration,
                    gaze_stability: testData.gazeStability || 0.5,
                    gaze_consistency: testData.gazeConsistency || 0.5,
                    raw_data: testData.rawData,
                });
                stateManager.addTestResult(result);
                stateManager.addNotification('Test enregistré avec succès!', 'success');
                this.goToScreen('results-screen');
            }
            this.testActive = false;
        }
        catch (error) {
            stateManager.addNotification(`Erreur: ${error instanceof Error ? error.message : 'Erreur inconnue'}`, 'error');
            this.testActive = false;
        }
    }
    /**
     * Charge et affiche les résultats des tests
     */
    async loadResults() {
        try {
            stateManager.addNotification('Chargement des résultats...', 'info');
            const tests = await apiService.getTests();
            tests.forEach((test) => stateManager.addTestResult(test));
            this.goToScreen('results-screen');
        }
        catch (error) {
            stateManager.addNotification(`Erreur: ${error instanceof Error ? error.message : 'Erreur inconnue'}`, 'error');
        }
    }
    /**
     * Affiche les détails d'un test spécifique
     */
    async viewTest(testId) {
        try {
            const test = await apiService.getTest(testId);
            console.log('Détails du test:', test);
            stateManager.addNotification(`Test #${testId} chargé`, 'success');
            // Vous pouvez ajouter ici un écran de détails ou un modal
        }
        catch (error) {
            stateManager.addNotification(`Erreur: ${error instanceof Error ? error.message : 'Erreur inconnue'}`, 'error');
        }
    }
    /**
     * Exporte un test en PDF
     */
    async exportTestPDF(testId) {
        try {
            stateManager.addNotification('Génération du PDF...', 'info');
            const blob = await apiService.exportTestPDF(testId);
            this.downloadBlob(blob, `test_${testId}.pdf`);
            stateManager.addNotification('PDF téléchargé avec succès!', 'success');
        }
        catch (error) {
            stateManager.addNotification(`Erreur: ${error instanceof Error ? error.message : 'Erreur inconnue'}`, 'error');
        }
    }
    /**
     * Exporte tous les tests en PDF
     */
    async exportAllTestsPDF() {
        try {
            stateManager.addNotification('Génération du PDF complet...', 'info');
            const blob = await apiService.exportAllTestsPDF();
            this.downloadBlob(blob, 'tous_les_tests.pdf');
            stateManager.addNotification('PDF téléchargé avec succès!', 'success');
        }
        catch (error) {
            stateManager.addNotification(`Erreur: ${error instanceof Error ? error.message : 'Erreur inconnue'}`, 'error');
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
        stateManager.addNotification('Déconnecté!', 'info');
        this.goToScreen('home-screen');
    }
    /**
     * Affiche l'application
     */
    render() {
        const app = document.getElementById('app');
        if (!app)
            return;
        const state = stateManager.getState();
        let screenContent = '';
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
        app.innerHTML = `
            ${renderNavbar()}
            ${screenContent}
            ${renderNotifications()}
        `;
        // Réinitialise les event listeners après rendu
        this.setupEventListeners();
    }
}
// Lance l'application
const app = new EyeTrackingApp();
// Expose à la fenêtre globale pour les onclick HTML
window.app = app;
export default app;
//# sourceMappingURL=app-professional.js.map