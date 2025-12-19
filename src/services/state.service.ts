/**
 * Service de gestion d'état global
 * Centralise et persiste l'état de l'application
 */

export interface Patient {
    id: number;
    username: string;
    email: string;
    firstName: string;
    lastName: string;
    age: number;
}

export interface TestData {
    startTime: number | null;
    endTime: number | null;
    totalTime: number;
    gazeTime: number;
    trackingPercentage: number;
    fixationCount: number;
    avgFixationDuration: number;
    maxFixationDuration?: number;
    minFixationDuration?: number;
    gazeStability: number;
    gazeConsistency: number;
    rawData: Record<string, any>;
}

export interface AppState {
    // Authentification
    isAuthenticated: boolean;
    patient: Patient | null;

    // Navigation
    currentScreen: string;

    // Calibration
    calibrationPoints: Array<{ x: number; y: number }>;
    isCalibrated: boolean;

    // Test en cours
    currentTest: TestData | null;
    testData?: Partial<TestData>; // Alias pour currentTest

    // Résultats
    testResults: any[];
    statistics: any | null;
    tests?: any[]; // Alias pour testResults
    
    // Patients
    patients: any[];
    currentPatientId: number | null;

    // Gaze data
    gazeData?: { x: number; y: number; confidence: number };

    // Notifications
    notifications: Array<{
        id: string;
        type: 'success' | 'error' | 'info' | 'warning';
        message: string;
        timestamp: number;
    }>;
}

class StateManager {
    private state: AppState;
    private subscribers: Set<(state: AppState) => void> = new Set();

    constructor() {
        this.state = this.initializeState();
        this.loadState();
    }

    /**
     * Initialise l'état par défaut
     */
    private initializeState(): AppState {
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
    private loadState(): void {
        try {
            const saved = localStorage.getItem('app_state');
            if (saved) {
                const parsed = JSON.parse(saved);
                this.state = { ...this.state, ...parsed };
            }
        } catch (error) {
            console.error('Erreur lors du chargement de l\'état:', error);
        }
    }

    /**
     * Sauvegarde l'état dans localStorage
     */
    private saveState(): void {
        try {
            localStorage.setItem('app_state', JSON.stringify(this.state));
        } catch (error) {
            console.error('Erreur lors de la sauvegarde de l\'état:', error);
        }
    }

    /**
     * S'abonne aux changements d'état
     */
    subscribe(callback: (state: AppState) => void): () => void {
        this.subscribers.add(callback);
        return () => this.subscribers.delete(callback);
    }

    /**
     * Notifie tous les abonnés
     */
    private notify(): void {
        this.saveState();
        this.subscribers.forEach((callback) => callback(this.state));
    }

    /**
     * Obtient l'état actuel
     */
    getState(): AppState {
        return {
            ...this.state,
            testData: this.state.currentTest || undefined,
            tests: this.state.testResults || [],
        };
    }

    /**
     * Définit le patient connecté
     */
    setPatient(patient: Patient | null): void {
        this.state.patient = patient;
        this.state.isAuthenticated = !!patient;
        this.notify();
    }

    /**
     * Déconnecte le patient (alias)
     */
    clearPatient(): void {
        this.setPatient(null);
    }

    /**
     * Navigue vers un écran
     */
    setScreen(screenName: string): void {
        this.state.currentScreen = screenName;
        this.notify();
    }

    /**
     * Enregistre les points de calibration
     */
    setCalibrationPoints(points: Array<{ x: number; y: number }>): void {
        this.state.calibrationPoints = points;
        this.state.isCalibrated = points.length >= 5;
        this.notify();
    }

    /**
     * Ajoute un point de calibration
     */
    addCalibrationPoint(point: { x: number; y: number }): void {
        this.state.calibrationPoints.push(point);
        this.state.isCalibrated = this.state.calibrationPoints.length >= 5;
        this.notify();
    }

    /**
     * Met à jour le nombre de points de calibration
     */
    updateCalibration(pointCount: number): void {
        this.state.calibrationPoints = Array(pointCount).fill({ x: 0, y: 0 });
        this.state.isCalibrated = pointCount >= 5;
        this.notify();
    }

    /**
     * Met à jour les données de regard (gaze data)
     */
    updateGazeData(gazeData: { x: number; y: number; confidence: number }): void {
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
    startNewTest(): void {
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
    startTest(): void {
        this.startNewTest();
    }

    /**
     * Met à jour les données du test en cours
     */
    updateCurrentTest(testData: Partial<TestData>): void {
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
    updateTestData(data: {
        totalTime?: number;
        gazeTime?: number;
        trackingPercentage?: number;
        fixationCount?: number;
        avgFixationDuration?: number;
        maxFixationDuration?: number;
        minFixationDuration?: number;
        gazeStability?: number;
        gazeConsistency?: number;
    }): void {
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
    finishCurrentTest(): TestData | null {
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
    finishTest(): TestData | null {
        return this.finishCurrentTest();
    }

    /**
     * Ajoute un test aux résultats
     */
    addTestResult(result: any): void {
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
    setStatistics(stats: any): void {
        this.state.statistics = stats;
        this.notify();
    }

    /**
     * Définit la liste des tests
     */
    setTests(tests: any): void {
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
    setPatients(patients: any): void {
        // L'API retourne {count, results, ...} donc extrait results
        const patientArray = Array.isArray(patients) ? patients : (patients.results || []);
        this.state.patients = Array.isArray(patientArray) ? patientArray : [];
        this.notify();
    }

    /**
     * Définit le patient actuellement sélectionné
     */
    setCurrentPatient(patientId: number): void {
        this.state.currentPatientId = patientId;
        this.notify();
    }

    /**
     * Ajoute une notification
     */
    addNotification(
        message: string,
        type: 'success' | 'error' | 'info' | 'warning' = 'info'
    ): string {
        const id = `notif-${Date.now()}`;
        this.state.notifications.push({
            id,
            type,
            message,
            timestamp: Date.now(),
        });

        // Supprime les notifications après 5 secondes
        setTimeout(() => {
            this.state.notifications = this.state.notifications.filter(
                (n) => n.id !== id
            );
            this.notify();
        }, 5000);

        this.notify();
        return id;
    }

    /**
     * Réinitialise l'état
     */
    reset(): void {
        this.state = this.initializeState();
        localStorage.removeItem('app_state');
        this.notify();
    }
}

export default new StateManager();
