/**
 * Service API - Communication avec le backend Django
 * Gère l'authentification, les requêtes et les erreurs
 */
export interface ApiResponse<T> {
    success: boolean;
    data?: T;
    error?: string;
    message?: string;
}
export interface AuthResponse {
    access_token: string;
    refresh_token: string;
    user_id: number;
    username: string;
    email: string;
    first_name: string;
    last_name: string;
    user?: {
        id: number;
        username: string;
        email: string;
    };
}
export interface PatientResponse {
    id: number;
    user: {
        id: number;
        username: string;
        email: string;
        first_name: string;
        last_name: string;
    };
    age: number;
    created_at: string;
    updated_at: string;
}
export interface TestResult {
    id: number;
    patient: number;
    test_date: string;
    duration: number;
    gaze_time: number;
    tracking_percentage: number;
    fixation_count: number;
    avg_fixation_duration: number;
    result: 'excellent' | 'good' | 'acceptable' | 'poor';
    raw_data: Record<string, any>;
}
declare class ApiService {
    private baseUrl;
    private token;
    private refreshToken;
    private isRefreshing;
    constructor(baseUrl?: string);
    /**
     * Charge les tokens du localStorage
     */
    private loadTokens;
    /**
     * Recharge les tokens du localStorage (appelé avant chaque requête)
     */
    private reloadTokens;
    /**
     * Enregistre un nouveau patient
     */
    register(username: string, email: string, password: string, firstName: string, lastName: string, age: number): Promise<AuthResponse>;
    /**
     * Connecte un patient
     */
    login(username: string, password: string): Promise<AuthResponse>;
    /**
     * Rafraîchit le token d'accès
     */
    private refreshAccessToken;
    /**
     * Déconnecte le patient
     */
    logout(): void;
    /**
     * Récupère les données du patient connecté
     */
    getPatient(): Promise<PatientResponse>;
    /**
     * Crée un nouveau test de suivi oculaire
     */
    createTest(testData: {
        duration: number;
        gaze_time: number;
        tracking_percentage: number;
        fixation_count: number;
        avg_fixation_duration: number;
        max_fixation_duration: number;
        min_fixation_duration: number;
        gaze_stability: number;
        gaze_consistency: number;
        raw_data: Record<string, any>;
    }): Promise<TestResult>;
    /**
     * Récupère la liste des patients (pour admin)
     */
    getPatients(): Promise<any[]>;
    /**
     * Récupère tous les tests du patient
     */
    getTests(): Promise<TestResult[]>;
    /**
     * Récupère un test spécifique
     */
    getTest(testId: number): Promise<TestResult>;
    /**
     * Récupère les statistiques du patient
     */
    getStatistics(): Promise<any>;
    /**
     * Exporte un test en PDF
     */
    exportTestPDF(testId: number): Promise<Blob>;
    /**
     * Exporte tous les tests en PDF
     */
    exportAllTestsPDF(): Promise<Blob>;
    /**
     * Fait une prédiction ML sur un test
     */
    predictTest(testData: Record<string, any>): Promise<any>;
    /**
     * Effectue une requête GET
     */
    private get;
    /**
     * Effectue une requête POST
     */
    private post;
    /**
     * Effectue une requête PUT
     */
    /**
     * Construit les headers de la requête
     */
    private getHeaders;
    /**
     * Gère la réponse de l'API
     */
    private handleResponse;
    /**
     * Vérifie si l'utilisateur est authentifié
     */
    isAuthenticated(): boolean;
    /**
     * Obtient le token actuel
     */
    getToken(): string | null;
}
declare const _default: ApiService;
export default _default;
//# sourceMappingURL=api.service.d.ts.map