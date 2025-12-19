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
        return { ...this.state };
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
     * Met à jour les données du test avec les données de regard
     */
    updateTestData(gazeData) {
        if (this.state.currentTest) {
            // Mettre à jour le temps total du test
            const elapsed = (gazeData.timestamp - (this.state.currentTest.startTime || 0)) / 1000;
            this.state.currentTest.totalTime = elapsed;
            // Enregistrer les données brutes
            if (!this.state.currentTest.rawData) {
                this.state.currentTest.rawData = {};
            }
            this.state.currentTest.rawData[gazeData.timestamp] = {
                x: gazeData.gazeX,
                y: gazeData.gazeY,
            };
            // Calculer le nombre de fixations
            // Une fixation est un groupe de points de regard proches
            const rawArray = Object.values(this.state.currentTest.rawData);
            if (rawArray.length > 0) {
                let fixationCount = 0;
                let lastFixationX = rawArray[0].x;
                let lastFixationY = rawArray[0].y;
                const fixationThreshold = 100; // pixels
                for (let i = 1; i < rawArray.length; i++) {
                    const dx = rawArray[i].x - lastFixationX;
                    const dy = rawArray[i].y - lastFixationY;
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    if (distance > fixationThreshold) {
                        fixationCount++;
                        lastFixationX = rawArray[i].x;
                        lastFixationY = rawArray[i].y;
                    }
                }
                this.state.currentTest.fixationCount = Math.max(1, fixationCount);
            }
            // Simuler des calculs de tracking
            this.state.currentTest.trackingPercentage = Math.min(100, (Object.keys(this.state.currentTest.rawData).length / (elapsed * 10)) * 100);
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
     * Ajoute un test aux résultats
     */
    addTestResult(result) {
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
