/**
 * Application Principale - Suivi Oculaire Clinique
 * Version professionnelle refactorisée
 */
declare class EyeTrackingApp {
    private eyeTracker;
    private targetDetector;
    private testActive;
    constructor();
    /**
     * Crée le container pour WebGazer
     */
    private createWebGazerContainer;
    /**
     * Initialise l'application
     */
    private init;
    /**
     * Initialise les modules de suivi oculaire
     */
    private initializeEyeTracking;
    /**
     * Configure les event listeners
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
     * Démarre la calibration
     */
    private startCalibration;
    /**
     * Démarre un test
     */
    private startTest;
    /**
     * Arrête le test
     */
    private stopTest;
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
}
declare const app: EyeTrackingApp;
export default app;
//# sourceMappingURL=app-professional.d.ts.map