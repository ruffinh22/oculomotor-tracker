/**
 * Service API - Communication avec le backend Django
 * Gère l'authentification, les requêtes et les erreurs
 */
class ApiService {
    constructor(baseUrl = 'http://localhost:8000') {
        this.token = null;
        this.refreshToken = null;
        this.isRefreshing = false;
        this.baseUrl = baseUrl;
        this.loadTokens();
    }
    /**
     * Charge les tokens du localStorage
     */
    loadTokens() {
        this.token = localStorage.getItem('access_token');
        this.refreshToken = localStorage.getItem('refresh_token');
    }
    /**
     * Recharge les tokens du localStorage (appelé avant chaque requête)
     */
    reloadTokens() {
        this.token = localStorage.getItem('access_token');
        this.refreshToken = localStorage.getItem('refresh_token');
        if (!this.token) {
            console.warn('⚠️ No access token in localStorage');
        }
    }
    /**
     * Enregistre un nouveau patient
     */
    async register(username, email, password, firstName, lastName, age) {
        return this.post('/api/auth/register/', {
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
    async login(username, password) {
        const response = await this.post('/api/auth/login/', {
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
    async refreshAccessToken() {
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
        }
        catch (error) {
            this.logout();
            this.isRefreshing = false;
            return false;
        }
    }
    /**
     * Déconnecte le patient
     */
    logout() {
        this.token = null;
        this.refreshToken = null;
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
    }
    /**
     * Récupère les données du patient connecté
     */
    async getPatient() {
        return this.get('/api/patients/me/');
    }
    /**
     * Crée un nouveau test de suivi oculaire
     */
    async createTest(testData) {
        return this.post('/api/tests/', testData);
    }
    /**
     * Récupère la liste des patients (pour admin)
     */
    async getPatients() {
        return this.get('/api/patients/');
    }
    /**
     * Récupère tous les tests du patient
     */
    async getTests() {
        return this.get('/api/tests/');
    }
    /**
     * Récupère un test spécifique
     */
    async getTest(testId) {
        return this.get(`/api/tests/${testId}/`);
    }
    /**
     * Récupère les statistiques du patient
     */
    async getStatistics() {
        return this.get('/api/tests/statistics/');
    }
    /**
     * Exporte un test en PDF
     */
    async exportTestPDF(testId) {
        const response = await fetch(`${this.baseUrl}/api/tests/${testId}/export_pdf/`, {
            method: 'GET',
            headers: this.getHeaders(),
        });
        if (!response.ok) {
            throw new Error('Erreur lors de l\'export PDF');
        }
        return response.blob();
    }
    /**
     * Exporte tous les tests en PDF
     */
    async exportAllTestsPDF() {
        const response = await fetch(`${this.baseUrl}/api/tests/export_all_pdf/`, {
            method: 'GET',
            headers: this.getHeaders(),
        });
        if (!response.ok) {
            throw new Error('Erreur lors de l\'export PDF');
        }
        return response.blob();
    }
    /**
     * Fait une prédiction ML sur un test
     */
    async predictTest(testData) {
        return this.post('/ml/predict/', testData);
    }
    /**
     * Effectue une requête GET
     */
    async get(endpoint) {
        const response = await fetch(`${this.baseUrl}${endpoint}`, {
            method: 'GET',
            headers: this.getHeaders(),
            credentials: 'include',
        });
        return this.handleResponse(response);
    }
    /**
     * Effectue une requête POST
     */
    async post(endpoint, data) {
        const response = await fetch(`${this.baseUrl}${endpoint}`, {
            method: 'POST',
            headers: this.getHeaders(),
            body: JSON.stringify(data),
            credentials: 'include',
        });
        return this.handleResponse(response);
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
    getHeaders() {
        // Recharge les tokens juste avant chaque requête pour s'assurer d'avoir les derniers
        this.reloadTokens();
        const headers = {
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
    async handleResponse(response) {
        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
            const errorMessage = data.detail ||
                data.error ||
                data.message ||
                `Erreur ${response.status}`;
            throw new Error(errorMessage);
        }
        return data;
    }
    /**
     * Vérifie si l'utilisateur est authentifié
     */
    isAuthenticated() {
        return !!this.token;
    }
    /**
     * Obtient le token actuel
     */
    getToken() {
        return this.token;
    }
}
export default new ApiService();
//# sourceMappingURL=api.service.js.map