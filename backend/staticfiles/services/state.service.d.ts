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
    isAuthenticated: boolean;
    patient: Patient | null;
    currentScreen: string;
    calibrationPoints: Array<{
        x: number;
        y: number;
    }>;
    isCalibrated: boolean;
    currentTest: TestData | null;
    testData?: Partial<TestData>;
    testResults: any[];
    statistics: any | null;
    tests?: any[];
    patients: any[];
    currentPatientId: number | null;
    gazeData?: {
        x: number;
        y: number;
        confidence: number;
    };
    notifications: Array<{
        id: string;
        type: 'success' | 'error' | 'info' | 'warning';
        message: string;
        timestamp: number;
    }>;
}
declare class StateManager {
    private state;
    private subscribers;
    constructor();
    /**
     * Initialise l'état par défaut
     */
    private initializeState;
    /**
     * Charge l'état depuis localStorage
     */
    private loadState;
    /**
     * Sauvegarde l'état dans localStorage
     */
    private saveState;
    /**
     * S'abonne aux changements d'état
     */
    subscribe(callback: (state: AppState) => void): () => void;
    /**
     * Notifie tous les abonnés
     */
    private notify;
    /**
     * Obtient l'état actuel
     */
    getState(): AppState;
    /**
     * Définit le patient connecté
     */
    setPatient(patient: Patient | null): void;
    /**
     * Déconnecte le patient (alias)
     */
    clearPatient(): void;
    /**
     * Navigue vers un écran
     */
    setScreen(screenName: string): void;
    /**
     * Enregistre les points de calibration
     */
    setCalibrationPoints(points: Array<{
        x: number;
        y: number;
    }>): void;
    /**
     * Ajoute un point de calibration
     */
    addCalibrationPoint(point: {
        x: number;
        y: number;
    }): void;
    /**
     * Met à jour le nombre de points de calibration
     */
    updateCalibration(pointCount: number): void;
    /**
     * Met à jour les données de regard (gaze data)
     */
    updateGazeData(gazeData: {
        x: number;
        y: number;
        confidence: number;
    }): void;
    /**
     * Démarre un nouveau test
     */
    startNewTest(): void;
    /**
     * Alias pour startNewTest (pour compatibilité)
     */
    startTest(): void;
    /**
     * Met à jour les données du test en cours
     */
    updateCurrentTest(testData: Partial<TestData>): void;
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
    }): void;
    /**
     * Termine le test en cours
     */
    finishCurrentTest(): TestData | null;
    /**
     * Alias pour finishCurrentTest (pour compatibilité)
     */
    finishTest(): TestData | null;
    /**
     * Ajoute un test aux résultats
     */
    addTestResult(result: any): void;
    /**
     * Définit les statistiques
     */
    setStatistics(stats: any): void;
    /**
     * Définit la liste des tests
     */
    setTests(tests: any): void;
    /**
     * Définit la liste des patients
     */
    setPatients(patients: any): void;
    /**
     * Définit le patient actuellement sélectionné
     */
    setCurrentPatient(patientId: number): void;
    /**
     * Ajoute une notification
     */
    addNotification(message: string, type?: 'success' | 'error' | 'info' | 'warning'): string;
    /**
     * Réinitialise l'état
     */
    reset(): void;
}
declare const _default: StateManager;
export default _default;
//# sourceMappingURL=state.service.d.ts.map