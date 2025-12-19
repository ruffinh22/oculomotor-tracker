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

class ApiService {
    private baseUrl: string;
    private token: string | null = null;
    private refreshToken: string | null = null;
    private isRefreshing: boolean = false;

    constructor(baseUrl: string = 'http://localhost:8000') {
        this.baseUrl = baseUrl;
        this.loadTokens();
    }

    /**
     * Charge les tokens du localStorage
     */
    private loadTokens(): void {
        this.token = localStorage.getItem('access_token');
        this.refreshToken = localStorage.getItem('refresh_token');
    }

    /**
     * Recharge les tokens du localStorage (appelé avant chaque requête)
     */
    private reloadTokens(): void {
        this.token = localStorage.getItem('access_token');
        this.refreshToken = localStorage.getItem('refresh_token');
        if (!this.token) {
            console.warn('⚠️ No access token in localStorage');
        }
    }

    /**
     * Enregistre un nouveau patient
     */
    async register(
        username: string,
        email: string,
        password: string,
        firstName: string,
        lastName: string,
        age: number
    ): Promise<AuthResponse> {
        return this.post<AuthResponse>('/api/auth/register/', {
            username,
            email,
            password,
            first_name: firstName,
            last_name: lastName,
            age,
        });
    }

    /**
     * Connecte un patient
     */
    async login(username: string, password: string): Promise<AuthResponse> {
        const response = await this.post<AuthResponse>('/api/auth/login/', {
            username,
            password,
        });

        if (response.access_token) {
            this.token = response.access_token;
            this.refreshToken = response.refresh_token;
            localStorage.setItem('access_token', response.access_token);
            localStorage.setItem('refresh_token', response.refresh_token);
        }

        return response;
    }

    /**
     * Rafraîchit le token d'accès
     */
    private async refreshAccessToken(): Promise<boolean> {
        if (this.isRefreshing || !this.refreshToken) {
            return false;
        }

        this.isRefreshing = true;

        try {
            const response = await fetch(`${this.baseUrl}/api/auth/refresh/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    refresh: this.refreshToken,
                }),
            });

            const data = await response.json();

            if (response.ok && data.access_token) {
                this.token = data.access_token;
                localStorage.setItem('access_token', data.access_token);
                this.isRefreshing = false;
                return true;
            }

            // Le refresh token est également expiré
            this.logout();
            this.isRefreshing = false;
            return false;
        } catch (error) {
            this.logout();
            this.isRefreshing = false;
            return false;
        }
    }

    /**
     * Déconnecte le patient
     */
    logout(): void {
        this.token = null;
        this.refreshToken = null;
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
    }

    /**
     * Récupère les données du patient connecté
     */
    async getPatient(): Promise<PatientResponse> {
        return this.get<PatientResponse>('/api/patients/me/');
    }

    /**
     * Crée un nouveau test de suivi oculaire
     */
    async createTest(testData: {
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
    }): Promise<TestResult> {
        return this.post<TestResult>('/api/tests/', testData);
    }

    /**
     * Récupère la liste des patients (pour admin)
     */
    async getPatients(): Promise<any[]> {
        return this.get<any[]>('/api/patients/');
    }

    /**
     * Récupère tous les tests du patient
     */
    async getTests(): Promise<TestResult[]> {
        return this.get<TestResult[]>('/api/tests/');
    }

    /**
     * Récupère un test spécifique
     */
    async getTest(testId: number): Promise<TestResult> {
        return this.get<TestResult>(`/api/tests/${testId}/`);
    }

    /**
     * Récupère les statistiques du patient
     */
    async getStatistics(): Promise<any> {
        return this.get('/api/tests/statistics/');
    }

    /**
     * Exporte un test en PDF
     */
    async exportTestPDF(testId: number): Promise<Blob> {
        const response = await fetch(
            `${this.baseUrl}/api/tests/${testId}/export_pdf/`,
            {
                method: 'GET',
                headers: this.getHeaders(),
            }
        );

        if (!response.ok) {
            throw new Error('Erreur lors de l\'export PDF');
        }

        return response.blob();
    }

    /**
     * Exporte tous les tests en PDF
     */
    async exportAllTestsPDF(): Promise<Blob> {
        const response = await fetch(
            `${this.baseUrl}/api/tests/export_all_pdf/`,
            {
                method: 'GET',
                headers: this.getHeaders(),
            }
        );

        if (!response.ok) {
            throw new Error('Erreur lors de l\'export PDF');
        }

        return response.blob();
    }

    /**
     * Fait une prédiction ML sur un test
     */
    async predictTest(testData: Record<string, any>): Promise<any> {
        return this.post('/ml/predict/', testData);
    }

    /**
     * Effectue une requête GET
     */
    private async get<T = any>(endpoint: string): Promise<T> {
        const response = await fetch(`${this.baseUrl}${endpoint}`, {
            method: 'GET',
            headers: this.getHeaders(),
            credentials: 'include',
        });

        return this.handleResponse<T>(response);
    }

    /**
     * Effectue une requête POST
     */
    private async post<T = any>(endpoint: string, data: any): Promise<T> {
        const response = await fetch(`${this.baseUrl}${endpoint}`, {
            method: 'POST',
            headers: this.getHeaders(),
            body: JSON.stringify(data),
            credentials: 'include',
        });

        return this.handleResponse<T>(response);
    }

    /**
     * Effectue une requête PUT
     */
    // private async put<T = any>(endpoint: string, data: any): Promise<T> {
    //     const response = await fetch(`${this.baseUrl}${endpoint}`, {
    //         method: 'PUT',
    //         headers: this.getHeaders(),
    //         body: JSON.stringify(data),
    //     });

    //     return this.handleResponse<T>(response);
    // }

    /**
     * Construit les headers de la requête
     */
    private getHeaders(): Record<string, string> {
        // Recharge les tokens juste avant chaque requête pour s'assurer d'avoir les derniers
        this.reloadTokens();

        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
        };

        if (this.token) {
            headers['Authorization'] = `Bearer ${this.token}`;
        }

        return headers;
    }

    /**
     * Gère la réponse de l'API
     */
    private async handleResponse<T>(response: Response): Promise<T> {
        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
            const errorMessage =
                data.detail ||
                data.error ||
                data.message ||
                `Erreur ${response.status}`;
            throw new Error(errorMessage);
        }

        return data as T;
    }

    /**
     * Vérifie si l'utilisateur est authentifié
     */
    isAuthenticated(): boolean {
        return !!this.token;
    }

    /**
     * Obtient le token actuel
     */
    getToken(): string | null {
        return this.token;
    }
}

export default new ApiService();
