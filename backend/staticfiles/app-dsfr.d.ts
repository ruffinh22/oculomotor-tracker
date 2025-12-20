/**
 * Application Principale - Suivi Oculaire Clinique
 * Version DSFR (Système de Design de l'État)
 */
declare class EyeTrackingApp {
    private eyeTracker;
    private targetDetector;
    private distanceEstimator;
    private testAnalyzer;
    private testActive;
    private isCalibrating;
    private testInterval;
    private animationFrameId;
    constructor();
    /**
     * Initialise l'application
     */
    private init;
    /**
     * Initialise les modules de suivi oculaire
     */
    private initializeEyeTracking;
    /**
     * Configure les event listeners (appelé une seule fois)
     */
    private setupEventListeners;
    /**
     * Gère la connexion
     */
    private handleLogin;
    /**
     * Gère l'inscription
     */
    private handleRegister;
    /**
     * Démarre la calibration (publique pour être appelée depuis le HTML)
     */
    startCalibration(): Promise<void>;
    /**
     * Interface de calibration interactive
     */
    private runCalibrationUI;
    /**
     * Démarre un test (publique pour être appelée depuis le HTML)
     */
    startTest(): Promise<void>;
    /**
     * Arrête le test (publique pour être appelée depuis le HTML)
     */
    stopTest(): Promise<void>;
    /**
     * Charge et affiche les résultats des tests
     */
    loadResults(): Promise<void>;
    /**
     * Affiche les détails d'un test spécifique
     */
    viewTest(testId: number): Promise<void>;
    /**
     * Exporte un test en PDF
     */
    exportTestPDF(testId: number): Promise<void>;
    /**
     * Exporte tous les tests en PDF
     */
    exportAllTestsPDF(): Promise<void>;
    /**
     * Utilitaire pour télécharger un blob en tant que fichier
     */
    private downloadBlob;
    /**
     * Navigue vers un écran
     */
    goToScreen(screenName: string): void;
    /**
     * Déconnecte l'utilisateur
     */
    logout(): void;
    /**
     * Affiche l'application
     */
    private render;
    /**
     * Démarre l'animation des cibles sur le canvas
     */
    private startDrawingTargets;
}
declare const app: EyeTrackingApp;
export default app;
//# sourceMappingURL=app-dsfr.d.ts.map