/**
 * Service de gestion d'état global
 * Centralise et persiste l'état de l'application
 */
class StateManager {
    constructor() {
        this.subscribers = new Set();
        this.state = this.initializeState();
        this.loadState();
    }
    /**
     * Initialise l'état par défaut
     */
    initializeState() {
        return {
            isAuthenticated: false,
            patient: null,
            currentScreen: 'home-screen',
            calibrationPoints: [],
            isCalibrated: false,
            currentTest: null,
            testResults: [],
            statistics: null,
            patients: [],
            currentPatientId: null,
            notifications: [],
        };
    }
    /**
     * Charge l'état depuis localStorage
     */
    loadState() {
        try {
            const saved = localStorage.getItem('app_state');
            if (saved) {
                const parsed = JSON.parse(saved);
                this.state = { ...this.state, ...parsed };
            }
        }
        catch (error) {
            console.error('Erreur lors du chargement de l\'état:', error);
        }
    }
    /**
     * Sauvegarde l'état dans localStorage
     */
    saveState() {
        try {
            localStorage.setItem('app_state', JSON.stringify(this.state));
        }
        catch (error) {
            console.error('Erreur lors de la sauvegarde de l\'état:', error);
        }
    }
    /**
     * S'abonne aux changements d'état
     */
    subscribe(callback) {
        this.subscribers.add(callback);
        return () => this.subscribers.delete(callback);
    }
    /**
     * Notifie tous les abonnés
     */
    notify() {
        this.saveState();
        this.subscribers.forEach((callback) => callback(this.state));
    }
    /**
     * Obtient l'état actuel
     */
    getState() {
        return {
            ...this.state,
            testData: this.state.currentTest || undefined,
            tests: this.state.testResults || [],
        };
    }
    /**
     * Définit le patient connecté
     */
    setPatient(patient) {
        this.state.patient = patient;
        this.state.isAuthenticated = !!patient;
        this.notify();
    }
    /**
     * Déconnecte le patient (alias)
     */
    clearPatient() {
        this.setPatient(null);
    }
    /**
     * Navigue vers un écran
     */
    setScreen(screenName) {
        this.state.currentScreen = screenName;
        this.notify();
    }
    /**
     * Enregistre les points de calibration
     */
    setCalibrationPoints(points) {
        this.state.calibrationPoints = points;
        this.state.isCalibrated = points.length >= 5;
        this.notify();
    }
    /**
     * Ajoute un point de calibration
     */
    addCalibrationPoint(point) {
        this.state.calibrationPoints.push(point);
        this.state.isCalibrated = this.state.calibrationPoints.length >= 5;
        this.notify();
    }
    /**
     * Met à jour le nombre de points de calibration
     */
    updateCalibration(pointCount) {
        this.state.calibrationPoints = Array(pointCount).fill({ x: 0, y: 0 });
        this.state.isCalibrated = pointCount >= 5;
        this.notify();
    }
    /**
     * Met à jour les données de regard (gaze data)
     */
    updateGazeData(gazeData) {
        // Stocke les données de regard brutes pour analyse
        if (!this.state.currentTest) {
            this.state.currentTest = {
                startTime: null,
                endTime: null,
                totalTime: 0,
                gazeTime: 0,
                trackingPercentage: 0,
                fixationCount: 0,
                avgFixationDuration: 0,
                gazeStability: 0,
                gazeConsistency: 0,
                rawData: {},
            };
        }
        const timestamp = Date.now();
        if (!this.state.currentTest.rawData) {
            this.state.currentTest.rawData = {};
        }
        this.state.currentTest.rawData[timestamp] = {
            x: gazeData.x,
            y: gazeData.y,
            confidence: gazeData.confidence,
        };
    }
    /**
     * Démarre un nouveau test
     */
    startNewTest() {
        this.state.currentTest = {
            startTime: Date.now(),
            endTime: null,
            totalTime: 0,
            gazeTime: 0,
            trackingPercentage: 0,
            fixationCount: 0,
            avgFixationDuration: 0,
            gazeStability: 0,
            gazeConsistency: 0,
            rawData: {},
        };
        this.notify();
    }
    /**
     * Alias pour startNewTest (pour compatibilité)
     */
    startTest() {
        this.startNewTest();
    }
    /**
     * Met à jour les données du test en cours
     */
    updateCurrentTest(testData) {
        if (this.state.currentTest) {
            this.state.currentTest = {
                ...this.state.currentTest,
                ...testData,
            };
            this.notify();
        }
    }
    /**
     * Met à jour les données du test avec l'interface simplifiée
     */
    updateTestData(data) {
        if (this.state.currentTest) {
            this.state.currentTest = {
                ...this.state.currentTest,
                ...data,
            };
            this.notify();
        }
    }
    /**
     * Termine le test en cours
     */
    finishCurrentTest() {
        if (this.state.currentTest) {
            this.state.currentTest.endTime = Date.now();
            this.state.currentTest.totalTime =
                (this.state.currentTest.endTime -
                    (this.state.currentTest.startTime || 0)) /
                    1000;
            const test = this.state.currentTest;
            this.state.currentTest = null;
            this.notify();
            return test;
        }
        return null;
    }
    /**
     * Alias pour finishCurrentTest (pour compatibilité)
     */
    finishTest() {
        return this.finishCurrentTest();
    }
    /**
     * Ajoute un test aux résultats
     */
    addTestResult(result) {
        // S'assure que testResults est un array
        if (!Array.isArray(this.state.testResults)) {
            this.state.testResults = [];
        }
        this.state.testResults.unshift(result);
        this.notify();
    }
    /**
     * Définit les statistiques
     */
    setStatistics(stats) {
        this.state.statistics = stats;
        this.notify();
    }
    /**
     * Définit la liste des tests
     */
    setTests(tests) {
        // L'API retourne {count, results, ...} donc extrait results
        const testArray = Array.isArray(tests) ? tests : (tests.results || []);
        // S'assure que c'est toujours un array
        this.state.testResults = Array.isArray(testArray) ? testArray : [];
        this.state.tests = this.state.testResults;
        this.notify();
    }
    /**
     * Définit la liste des patients
     */
    setPatients(patients) {
        // L'API retourne {count, results, ...} donc extrait results
        const patientArray = Array.isArray(patients) ? patients : (patients.results || []);
        this.state.patients = Array.isArray(patientArray) ? patientArray : [];
        this.notify();
    }
    /**
     * Définit le patient actuellement sélectionné
     */
    setCurrentPatient(patientId) {
        this.state.currentPatientId = patientId;
        this.notify();
    }
    /**
     * Ajoute une notification
     */
    addNotification(message, type = 'info') {
        const id = `notif-${Date.now()}`;
        this.state.notifications.push({
            id,
            type,
            message,
            timestamp: Date.now(),
        });
        // Supprime les notifications après 5 secondes
        setTimeout(() => {
            this.state.notifications = this.state.notifications.filter((n) => n.id !== id);
            this.notify();
        }, 5000);
        this.notify();
        return id;
    }
    /**
     * Réinitialise l'état
     */
    reset() {
        this.state = this.initializeState();
        localStorage.removeItem('app_state');
        this.notify();
    }
}
export default new StateManager();
//# sourceMappingURL=state.service.js.map