/**
 * Application de Suivi Oculaire Clinique - Style Gouvernemental
 * Intégration WebGazer + Django Backend avec design DSFR
 */
declare global {
    interface Window {
        app: AppGouv | undefined;
    }
}
declare class AppGouv {
    private calibrationMode;
    private calibrationPoints;
    private testActive;
    private testStartTime;
    constructor();
    /**
     * Initialise l'application
     */
    start(): Promise<void>;
    /**
     * Initialise WebGazer pour le suivi oculaire
     */
    private initializeEyeTracking;
    /**
     * Configure les event listeners
     */
    private setupEventListeners;
    /**
     * Gère la soumission de formulaires
     */
    private handleFormSubmit;
    /**
     * Gère la connexion
     */
    handleLogin(form?: HTMLFormElement): Promise<void>;
    /**
     * Gère l'inscription
     */
    handleRegister(form?: HTMLFormElement): Promise<void>;
    /**
     * Gère l'enregistrement d'un nouveau patient (depuis l'écran patient-selection)
     */
    handleRegisterPatient(form?: HTMLFormElement): Promise<void>;
    /**
     * Démarre la calibration
     */
    startCalibration(): Promise<void>;
    /**
     * Dessine un point de calibration
     */
    private drawCalibrationPoint;
    /**
     * Démarre un test
     */
    startTest(): Promise<void>;
    /**
     * Arrête le test et envoie les données
     */
    stopTest(): Promise<void>;
    /**
     * Affiche un écran spécifique
     */
    goToScreen(screenId: string): Promise<void>;
    /**
     * Charge la liste des patients
     */
    loadPatients(): Promise<void>;
    /**
     * Sélectionne un patient pour le test
     */
    selectPatient(patientId: number): void;
    /**
     * Récupère le patient actuellement sélectionné
     */
    handleLogout(): void;
    /**
     * Affiche les détails d'un test
     */
    viewTest(testId: number): void;
    /**
     * Rend l'interface
     */
    render(): void;
}
export {};
//# sourceMappingURL=app-gouv.d.ts.map