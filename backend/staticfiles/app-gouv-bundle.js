"use strict";
(() => {
  // src/services/state.service.ts
  var StateManager = class {
    constructor() {
      this.subscribers = /* @__PURE__ */ new Set();
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
        currentScreen: "home-screen",
        calibrationPoints: [],
        isCalibrated: false,
        currentTest: null,
        testResults: [],
        statistics: null,
        patients: [],
        currentPatientId: null,
        notifications: []
      };
    }
    /**
     * Charge l'état depuis localStorage
     */
    loadState() {
      try {
        const saved = localStorage.getItem("app_state");
        if (saved) {
          const parsed = JSON.parse(saved);
          this.state = { ...this.state, ...parsed };
        }
      } catch (error) {
        console.error("Erreur lors du chargement de l'\xE9tat:", error);
      }
    }
    /**
     * Sauvegarde l'état dans localStorage
     */
    saveState() {
      try {
        localStorage.setItem("app_state", JSON.stringify(this.state));
      } catch (error) {
        console.error("Erreur lors de la sauvegarde de l'\xE9tat:", error);
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
        testData: this.state.currentTest || void 0,
        tests: this.state.testResults || []
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
          rawData: {}
        };
      }
      const timestamp = Date.now();
      if (!this.state.currentTest.rawData) {
        this.state.currentTest.rawData = {};
      }
      this.state.currentTest.rawData[timestamp] = {
        x: gazeData.x,
        y: gazeData.y,
        confidence: gazeData.confidence
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
        rawData: {}
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
          ...testData
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
          ...data
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
        this.state.currentTest.totalTime = (this.state.currentTest.endTime - (this.state.currentTest.startTime || 0)) / 1e3;
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
      const testArray = Array.isArray(tests) ? tests : tests.results || [];
      this.state.testResults = Array.isArray(testArray) ? testArray : [];
      this.state.tests = this.state.testResults;
      this.notify();
    }
    /**
     * Définit la liste des patients
     */
    setPatients(patients) {
      const patientArray = Array.isArray(patients) ? patients : patients.results || [];
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
    addNotification(message, type = "info") {
      const id = `notif-${Date.now()}`;
      this.state.notifications.push({
        id,
        type,
        message,
        timestamp: Date.now()
      });
      setTimeout(() => {
        this.state.notifications = this.state.notifications.filter(
          (n) => n.id !== id
        );
        this.notify();
      }, 5e3);
      this.notify();
      return id;
    }
    /**
     * Réinitialise l'état
     */
    reset() {
      this.state = this.initializeState();
      localStorage.removeItem("app_state");
      this.notify();
    }
  };
  var state_service_default = new StateManager();

  // src/services/api.service.ts
  var ApiService = class {
    constructor(baseUrl = "http://localhost:8000") {
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
      this.token = localStorage.getItem("access_token");
      this.refreshToken = localStorage.getItem("refresh_token");
    }
    /**
     * Recharge les tokens du localStorage (appelé avant chaque requête)
     */
    reloadTokens() {
      this.token = localStorage.getItem("access_token");
      this.refreshToken = localStorage.getItem("refresh_token");
      if (!this.token) {
        console.warn("\u26A0\uFE0F No access token in localStorage");
      }
    }
    /**
     * Enregistre un nouveau patient
     */
    async register(username, email, password, firstName, lastName, age) {
      return this.post("/api/auth/register/", {
        username,
        email,
        password,
        first_name: firstName,
        last_name: lastName,
        age
      });
    }
    /**
     * Connecte un patient
     */
    async login(username, password) {
      const response = await this.post("/api/auth/login/", {
        username,
        password
      });
      if (response.access_token) {
        this.token = response.access_token;
        this.refreshToken = response.refresh_token;
        localStorage.setItem("access_token", response.access_token);
        localStorage.setItem("refresh_token", response.refresh_token);
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
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            refresh: this.refreshToken
          })
        });
        const data = await response.json();
        if (response.ok && data.access_token) {
          this.token = data.access_token;
          localStorage.setItem("access_token", data.access_token);
          this.isRefreshing = false;
          return true;
        }
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
    logout() {
      this.token = null;
      this.refreshToken = null;
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
    }
    /**
     * Récupère les données du patient connecté
     */
    async getPatient() {
      return this.get("/api/patients/me/");
    }
    /**
     * Crée un nouveau test de suivi oculaire
     */
    async createTest(testData) {
      return this.post("/api/tests/", testData);
    }
    /**
     * Récupère la liste des patients (pour admin)
     */
    async getPatients() {
      return this.get("/api/patients/");
    }
    /**
     * Récupère tous les tests du patient
     */
    async getTests() {
      return this.get("/api/tests/");
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
      return this.get("/api/tests/statistics/");
    }
    /**
     * Exporte un test en PDF
     */
    async exportTestPDF(testId) {
      const response = await fetch(
        `${this.baseUrl}/api/tests/${testId}/export_pdf/`,
        {
          method: "GET",
          headers: this.getHeaders()
        }
      );
      if (!response.ok) {
        throw new Error("Erreur lors de l'export PDF");
      }
      return response.blob();
    }
    /**
     * Exporte tous les tests en PDF
     */
    async exportAllTestsPDF() {
      const response = await fetch(
        `${this.baseUrl}/api/tests/export_all_pdf/`,
        {
          method: "GET",
          headers: this.getHeaders()
        }
      );
      if (!response.ok) {
        throw new Error("Erreur lors de l'export PDF");
      }
      return response.blob();
    }
    /**
     * Fait une prédiction ML sur un test
     */
    async predictTest(testData) {
      return this.post("/ml/predict/", testData);
    }
    /**
     * Effectue une requête GET
     */
    async get(endpoint) {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: "GET",
        headers: this.getHeaders(),
        credentials: "include"
      });
      return this.handleResponse(response);
    }
    /**
     * Effectue une requête POST
     */
    async post(endpoint, data) {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: "POST",
        headers: this.getHeaders(),
        body: JSON.stringify(data),
        credentials: "include"
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
      this.reloadTokens();
      const headers = {
        "Content-Type": "application/json"
      };
      if (this.token) {
        headers["Authorization"] = `Bearer ${this.token}`;
      }
      return headers;
    }
    /**
     * Gère la réponse de l'API
     */
    async handleResponse(response) {
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        const errorMessage = data.detail || data.error || data.message || `Erreur ${response.status}`;
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
  };
  var api_service_default = new ApiService();

  // src/components/screens-gouv.ts
  function renderNavbarContent() {
    const state = state_service_default.getState();
    return state.isAuthenticated ? `
        <div class="navbar-menu">
            <div class="navbar-user">
                Connect\xE9: <strong>${state.patient?.firstName} ${state.patient?.lastName}</strong>
            </div>
            <button class="logout-btn" onclick="window.app?.handleLogout?.()">
                D\xE9connexion
            </button>
        </div>
    ` : "";
  }
  function renderNavbarHeader() {
    return `
        <div class="navbar-brand">
            <div class="logo">\u{1F441}\uFE0F</div>
            <h1>SOOC</h1>
        </div>
    `;
  }
  function renderNotifications() {
    const state = state_service_default.getState();
    return state.notifications.map((notif) => {
      const alertType = notif.type === "error" ? "alert-danger" : notif.type === "success" ? "alert-success" : "alert-info";
      const icon = notif.type === "error" ? "\u2715" : notif.type === "success" ? "\u2713" : "\u2139";
      return `
        <div class="alert ${alertType} notification" data-notif-id="${notif.id}" 
             style="position: fixed; top: 20px; right: 20px; max-width: 400px; z-index: 1000;">
            <div class="alert-icon">${icon}</div>
            <div style="flex: 1;">
                <strong>${notif.message}</strong>
            </div>
            <button style="background: none; border: none; cursor: pointer; font-size: 1.2rem; 
                         opacity: 0.6; padding: 0; margin-left: 1rem;"
                onclick="document.querySelector('[data-notif-id=&quot;${notif.id}&quot;]')?.remove()">\xD7</button>
        </div>
    `;
    }).join("");
  }
  function renderPatientSelectionScreen() {
    const state = state_service_default.getState();
    const patients = state.patients || [];
    return `
        <div class="screen" id="patient-selection-screen">
            <div class="container">
                <h1 class="screen-title">S\xE9lectionner un Patient</h1>
                <p class="screen-subtitle">Choisissez le patient pour lequel effectuer le test</p>

                ${patients.length === 0 ? `
                        <div class="alert alert-info">
                            <div class="alert-icon">\u2139</div>
                            <div>Aucun patient disponible.</div>
                        </div>
                    ` : ""}

                <div class="row">
                    <div class="col-half" style="margin-bottom: 1rem;">
                        <div class="card" style="cursor: pointer; transition: all 0.3s; padding: 1.5rem; text-align: center; background: #e8f4f8; border: 2px dashed #000091;"
                             onclick="window.app?.goToScreen?.('register-screen');">
                            <div style="font-size: 2.5rem; margin-bottom: 0.5rem;">\u2795</div>
                            <div style="font-size: 1.1rem; font-weight: bold; color: #000091;">
                                Ajouter un Patient
                            </div>
                            <div style="color: #666; font-size: 0.9rem; margin-top: 0.5rem;">
                                Cr\xE9er un nouveau patient
                            </div>
                        </div>
                    </div>

                    ${patients.map(
      (patient) => `
                        <div class="col-half" style="margin-bottom: 1rem;">
                            <div class="card" style="cursor: pointer; transition: all 0.3s; padding: 1.5rem; text-align: center;"
                                 onclick="window.app?.selectPatient?.(${patient.id}); window.app?.goToScreen?.('calibration-screen');">
                                <div style="font-size: 1.5rem; font-weight: bold; color: #000091; margin-bottom: 0.5rem;">
                                    ${(patient.user?.first_name || "") + " " + (patient.user?.last_name || "") || patient.user?.username || "Patient"}
                                </div>
                                <div style="color: #666; font-size: 0.9rem;">
                                    \u{1F464} ID: ${patient.id}<br/>
                                    \u{1F382} \xC2ge: ${patient.age || "\u2014"} ans<br/>
                                    \u{1F4E7} ${patient.user?.email || "N/A"}
                                </div>
                            </div>
                        </div>
                    `
    ).join("")}
                </div>

                <div class="form-actions" style="margin-top: 2rem; display: flex; gap: 1rem; justify-content: center; flex-wrap: wrap;">
                    <button class="btn btn-secondary" onclick="window.app?.goToScreen?.('home-screen')" style="padding: 0.75rem 1.5rem; font-size: 1rem;">
                        \u2190 Retour
                    </button>
                </div>
            </div>
        </div>
    `;
  }
  function renderHomeScreen() {
    const state = state_service_default.getState();
    const isAuthenticated = state.patient?.id;
    return `
        <div class="screen" id="home-screen">
            <div class="container">
                ${isAuthenticated ? `
                        <div class="alert alert-info">
                            <div class="alert-icon">\u2139</div>
                            <div>
                                Bienvenue <strong>${state.patient?.firstName} ${state.patient?.lastName}</strong>
                            </div>
                        </div>
                    ` : ""}

                <h1 class="screen-title">Syst\xE8me de Suivi Oculaire Clinique</h1>
                <p class="screen-subtitle">R\xE9alis\xE9 pour les professionnels de sant\xE9</p>

                <div class="row">
                    ${!isAuthenticated ? `
                        <div class="col-half">
                            <div class="card">
                                <div class="card-header">
                                    <h3>Connexion</h3>
                                </div>
                                <div class="card-body">
                                    <form id="loginForm">
                                        <div class="form-group">
                                            <label for="loginUsername">Identifiant</label>
                                            <input type="text" id="loginUsername" name="username" 
                                                   placeholder="Votre identifiant" required />
                                        </div>
                                        <div class="form-group">
                                            <label for="loginPassword">Mot de passe</label>
                                            <input type="password" id="loginPassword" name="password" 
                                                   placeholder="Votre mot de passe" required />
                                        </div>
                                        <div class="form-actions">
                                            <button type="submit" class="btn btn-primary btn-block">
                                                Se connecter
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        </div>

                        <div class="col-half">
                            <div class="card">
                                <div class="card-header">
                                    <h3>Inscription</h3>
                                </div>
                                <div class="card-body">
                                    <form id="registerForm">
                                        <div class="form-group">
                                            <label for="registerUsername">Identifiant</label>
                                            <input type="text" id="registerUsername" name="username" 
                                                   placeholder="Choisir un identifiant" required />
                                        </div>
                                        <div class="form-group">
                                            <label for="registerEmail">Email</label>
                                            <input type="email" id="registerEmail" name="email" 
                                                   placeholder="votre@email.fr" required />
                                        </div>
                                        <div class="form-group">
                                            <label for="registerPassword">Mot de passe</label>
                                            <input type="password" id="registerPassword" name="password" 
                                                   placeholder="Mot de passe s\xE9curis\xE9" required />
                                        </div>
                                        <div class="form-group">
                                            <label for="registerFirstName">Pr\xE9nom</label>
                                            <input type="text" id="registerFirstName" name="firstName" 
                                                   placeholder="Votre pr\xE9nom" required />
                                        </div>
                                        <div class="form-group">
                                            <label for="registerLastName">Nom</label>
                                            <input type="text" id="registerLastName" name="lastName" 
                                                   placeholder="Votre nom" required />
                                        </div>
                                        <div class="form-group">
                                            <label for="registerAge">\xC2ge</label>
                                            <input type="number" id="registerAge" name="age" 
                                                   placeholder="Votre \xE2ge" required />
                                        </div>
                                        <div class="form-actions">
                                            <button type="submit" class="btn btn-primary btn-block">
                                                S'inscrire
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        </div>
                    ` : `
                        <div class="col-full">
                            <div class="card">
                                <div class="card-header">
                                    <h3>Menu Principal</h3>
                                </div>
                                <div class="card-body">
                                    <div class="row">
                                        <div class="col-third">
                                            <button class="btn btn-primary btn-large btn-block" 
                                                    onclick="window.app?.loadPatients?.(); window.app?.goToScreen?.('patient-selection-screen')">
                                                \u{1F4CB} Nouveau Test
                                            </button>
                                        </div>
                                        <div class="col-third">
                                            <button class="btn btn-secondary btn-large btn-block" 
                                                    onclick="window.app?.goToScreen?.('results-screen')">
                                                \u{1F4CA} R\xE9sultats
                                            </button>
                                        </div>
                                        <div class="col-third">
                                            <button class="btn btn-secondary btn-large btn-block" 
                                                    onclick="window.app?.goToScreen?.('about-screen')">
                                                \u2139\uFE0F \xC0 propos
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    `}
                </div>
            </div>
        </div>
    `;
  }
  function renderCalibrationScreen() {
    const state = state_service_default.getState();
    const calibrationPoints = state.calibrationPoints || 0;
    return `
        <div class="screen" id="calibration-screen">
            <div class="container">
                <h1 class="screen-title">Calibration du Suivi Oculaire</h1>
                <p class="screen-subtitle">Cliquez sur chaque point qui s'affiche \xE0 l'\xE9cran</p>

                <div class="card">
                    <div class="card-body">
                        <div id="testCanvas" style="
                            width: 100%;
                            height: 400px;
                            background: linear-gradient(135deg, #f6f6f6 0%, #ffffff 100%);
                            border: 2px solid #000091;
                            border-radius: 2px;
                            position: relative;
                            margin-bottom: 2rem;
                        "></div>

                        <div style="text-align: center; margin-bottom: 2rem;">
                            <p class="text-muted">
                                Points calibr\xE9s: <strong>${calibrationPoints.length}/5</strong>
                            </p>
                            <div class="spinner" style="margin: 1rem auto;"></div>
                        </div>

                        <div class="form-actions">
                            <button class="btn btn-secondary" onclick="window.app?.goToScreen?.('home-screen')">
                                \u2190 Retour
                            </button>
                            ${calibrationPoints.length < 5 ? `<button class="btn btn-primary" id="startCalibrationBtn" 
                                        onclick="window.app?.startCalibration?.()">
                                    D\xE9marrer Calibration
                                </button>` : `<button class="btn btn-primary btn-success" 
                                        onclick="window.app?.goToScreen?.('test-screen')">
                                    \u2713 Calibration Compl\xE8te - Commencer Test
                                </button>`}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
  }
  function renderTestScreen() {
    const state = state_service_default.getState();
    const testData = state.testData;
    return `
        <div class="screen" id="test-screen">
            <div class="container">
                <h1 class="screen-title">Test de Suivi Oculaire</h1>
                <p class="screen-subtitle">Regardez les cibles \xE0 l'\xE9cran - Vos mouvements oculaires sont trac\xE9s en direct</p>

                <div class="row">
                    <div class="col-full">
                        <div class="card">
                            <div class="card-header">
                                <h3>\u{1F4F9} Zone de Suivi Oculaire en Temps R\xE9el</h3>
                            </div>
                            <div class="card-body">
                                <!-- Canvas pour afficher le suivi oculaire -->
                                <canvas id="testCanvas" style="
                                    width: 100%;
                                    height: 500px;
                                    background: linear-gradient(135deg, #f6f6f6 0%, #ffffff 100%);
                                    border: 3px solid #000091;
                                    border-radius: 2px;
                                    display: block;
                                    cursor: crosshair;
                                    box-shadow: inset 0 0 10px rgba(0, 0, 145, 0.1);
                                "></canvas>
                                <div style="margin-top: 1rem; padding: 1rem; background-color: #f6f6f6; border-radius: 2px; font-size: 0.85rem;">
                                    <strong>L\xE9gende:</strong>
                                    <div style="margin-top: 0.5rem;">
                                        <span style="display: inline-block; width: 12px; height: 12px; background-color: #0a76f6; border-radius: 50%; margin-right: 0.5rem; vertical-align: middle;"></span>
                                        <span>Position actuelle du regard</span>
                                    </div>
                                    <div style="margin-top: 0.3rem;">
                                        <span style="display: inline-block; width: 20px; height: 2px; background-color: #18753c; margin-right: 0.5rem; vertical-align: middle;"></span>
                                        <span>Trajet du regard (historique)</span>
                                    </div>
                                    <div style="margin-top: 0.3rem;">
                                        <span style="display: inline-block; width: 30px; height: 30px; border: 2px solid #ff9947; border-radius: 50%; margin-right: 0.5rem; vertical-align: middle; position: relative;">
                                            <span style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); font-size: 0.7rem; font-weight: bold;">F</span>
                                        </span>
                                        <span>Fixation d\xE9tect\xE9e</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="row">
                    <div class="col-third">
                        <div class="card">
                            <div class="card-body">
                                <div style="font-size: 0.9rem; color: #666; font-weight: 600;">\u23F1\uFE0F Dur\xE9e</div>
                                <div style="font-size: 1.8rem; font-weight: bold; color: #000091; margin-top: 0.5rem;">
                                    ${formatTime(testData?.totalTime || 0)}
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="col-third">
                        <div class="card">
                            <div class="card-body">
                                <div style="font-size: 0.9rem; color: #666; font-weight: 600;">\u{1F4CA} Suivi</div>
                                <div style="font-size: 1.8rem; font-weight: bold; color: #18753c; margin-top: 0.5rem;">
                                    ${(testData?.trackingPercentage || 0).toFixed(1)}%
                                </div>
                                <div style="background-color: #f6f6f6; height: 6px; border-radius: 2px; margin-top: 0.5rem; overflow: hidden;">
                                    <div style="background-color: #18753c; height: 100%; width: ${testData?.trackingPercentage || 0}%;"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="col-third">
                        <div class="card">
                            <div class="card-body">
                                <div style="font-size: 0.9rem; color: #666; font-weight: 600;">\u{1F441}\uFE0F Fixations</div>
                                <div style="font-size: 1.8rem; font-weight: bold; color: #0a76f6; margin-top: 0.5rem;">
                                    ${testData?.fixationCount || 0}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="row">
                    <div class="col-half">
                        <div class="card">
                            <div class="card-body">
                                <div style="margin-bottom: 1.5rem;">
                                    <small style="color: #666; font-weight: 600;">Stabilit\xE9 Oculaire</small>
                                    <div style="font-size: 1.4rem; font-weight: bold; color: #000091; margin-top: 0.5rem;">
                                        ${(testData?.gazeStability || 0).toFixed(2)}
                                    </div>
                                    <div style="background-color: #f6f6f6; height: 6px; border-radius: 2px; margin-top: 0.5rem; overflow: hidden;">
                                        <div style="background-color: #000091; height: 100%; width: ${Math.min((testData?.gazeStability || 0) * 10, 100)}%;"></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="col-half">
                        <div class="card">
                            <div class="card-body">
                                <div style="margin-bottom: 1.5rem;">
                                    <small style="color: #666; font-weight: 600;">Coh\xE9rence de Regard</small>
                                    <div style="font-size: 1.4rem; font-weight: bold; color: #0a76f6; margin-top: 0.5rem;">
                                        ${(testData?.gazeConsistency || 0).toFixed(2)}
                                    </div>
                                    <div style="background-color: #f6f6f6; height: 6px; border-radius: 2px; margin-top: 0.5rem; overflow: hidden;">
                                        <div style="background-color: #0a76f6; height: 100%; width: ${Math.min((testData?.gazeConsistency || 0) * 10, 100)}%;"></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="form-actions">
                    <button class="btn btn-secondary" onclick="window.app?.goToScreen?.('home-screen')">
                        \u2190 Retour
                    </button>
                    <button class="btn btn-secondary" onclick="window.app?.startCalibration?.()">
                        \u{1F527} Recalibrer
                    </button>
                    <button class="btn btn-success btn-large" onclick="window.app?.startTest?.()">
                        \u25B6\uFE0F D\xE9marrer Test
                    </button>
                </div>

                <div id="activeTestControls" style="display: none; margin-top: 2rem;">
                    <div class="alert alert-warning">
                        <div class="alert-icon">\u23F1\uFE0F</div>
                        <div><strong>Test en cours</strong> - Suivez les cibles avec les yeux. Votre regard est enregistr\xE9 en temps r\xE9el.</div>
                    </div>
                    <div class="form-actions">
                        <button class="btn btn-danger btn-large btn-block" onclick="window.app?.stopTest?.()">
                            \u23F9\uFE0F Arr\xEAter le Test
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
  }
  function renderResultsScreen() {
    const state = state_service_default.getState();
    const tests = state.tests || [];
    const firstTest = tests.length > 0 ? tests[0] : null;
    const patientName = firstTest?.patient_name || (state.patient ? `${state.patient.firstName} ${state.patient.lastName}` : "Patient");
    return `
        <div class="screen" id="results-screen">
            <div class="container">
                <h1 class="screen-title">Historique des Tests - ${patientName}</h1>
                <p class="screen-subtitle">Consultez vos r\xE9sultats de suivi oculaire</p>

                <div class="row">
                    <div class="col-full">
                        <div class="card" style="background: linear-gradient(135deg, #f0f8fc 0%, #e8f4f8 100%); border-left: 4px solid #000091;">
                            <div class="card-header">
                                <h3>Informations du Patient</h3>
                            </div>
                            <div class="card-body">
                                <div class="row">
                                    <div class="col-third">
                                        <div>
                                            <small style="color: #666; font-weight: 600;">Nom Complet</small>
                                            <div style="font-size: 1.1rem; font-weight: bold; color: #000091; margin-top: 0.5rem;">
                                                ${patientName}
                                            </div>
                                        </div>
                                    </div>
                                    <div class="col-third">
                                        <div>
                                            <small style="color: #666; font-weight: 600;">\xC2ge</small>
                                            <div style="font-size: 1.1rem; font-weight: bold; color: #0a76f6; margin-top: 0.5rem;">
                                                ${state.patient?.age || "\u2014"} ans
                                            </div>
                                        </div>
                                    </div>
                                    <div class="col-third">
                                        <div>
                                            <small style="color: #666; font-weight: 600;">Email</small>
                                            <div style="font-size: 0.95rem; color: #555; margin-top: 0.5rem; word-break: break-all;">
                                                \u{1F4E7} ${state.patient?.email || "\u2014"}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                ${tests.length === 0 ? `
                        <div class="alert alert-info">
                            <div class="alert-icon">\u2139</div>
                            <div>Aucun test effectu\xE9 pour le moment.</div>
                        </div>
                    ` : `
                        <div class="card">
                            <table>
                                <thead>
                                    <tr>
                                        <th>Patient</th>
                                        <th>Date</th>
                                        <th>Dur\xE9e</th>
                                        <th>Suivi</th>
                                        <th>Fixations</th>
                                        <th>R\xE9sultat</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${tests.map(
      (test, idx) => {
        const testDate = test.test_date || (/* @__PURE__ */ new Date()).toISOString();
        const duration = test.duration || 0;
        const tracking = test.tracking_percentage || 0;
        const fixations = test.fixation_count || 0;
        const result = test.result || "good";
        const patientName2 = test.patient_name || "\u2014 \u2014";
        return `
                                        <tr>
                                            <td><strong>${patientName2}</strong></td>
                                            <td>${new Date(testDate).toLocaleDateString("fr-FR")}</td>
                                            <td>${formatTime(duration)}</td>
                                            <td>${tracking.toFixed(1)}%</td>
                                            <td>${fixations}</td>
                                            <td>
                                                <span class="badge badge-${result === "excellent" ? "success" : result === "good" ? "primary" : "warning"}">
                                                    ${result}
                                                </span>
                                            </td>
                                            <td>
                                                <button class="btn btn-small btn-secondary" 
                                                        onclick="window.app?.viewTest?.(${test.id || idx})">
                                                    D\xE9tails
                                                </button>
                                            </td>
                                        </tr>
                                    `;
      }
    ).join("")}
                                </tbody>
                            </table>
                        </div>
                    `}

                <div class="form-actions">
                    <button class="btn btn-secondary" onclick="window.app?.goToScreen?.('home-screen')">
                        \u2190 Retour
                    </button>
                </div>
            </div>
        </div>
    `;
  }
  function renderTestDetailScreen() {
    const state = state_service_default.getState();
    const testId = window.__selectedTestId;
    const tests = state.tests || [];
    const test = tests.find((t) => t.id === testId);
    if (!test) {
      return `
            <div class="screen" id="test-detail-screen">
                <div class="container">
                    <h1 class="screen-title">D\xE9tails du Test</h1>
                    <div class="alert alert-danger">
                        <div class="alert-icon">\u2715</div>
                        <div>Test non trouv\xE9</div>
                    </div>
                    <div class="form-actions">
                        <button class="btn btn-secondary" onclick="window.app?.goToScreen?.('results-screen')">
                            \u2190 Retour
                        </button>
                    </div>
                </div>
            </div>
        `;
    }
    const testDate = test.test_date || (/* @__PURE__ */ new Date()).toISOString();
    const duration = test.duration || 0;
    const tracking = test.tracking_percentage || 0;
    const fixations = test.fixation_count || 0;
    const result = test.result || "good";
    const gazeStability = test.gaze_stability || 0;
    const gazeConsistency = test.gaze_consistency || 0;
    const avgFixation = test.avg_fixation_duration || 0;
    const maxFixation = test.max_fixation_duration || 0;
    const minFixation = test.min_fixation_duration || 0;
    return `
        <div class="screen" id="test-detail-screen">
            <div class="container">
                <h1 class="screen-title">D\xE9tails du Test #${testId}</h1>
                <p class="screen-subtitle">Test effectu\xE9 le ${new Date(testDate).toLocaleDateString("fr-FR", { weekday: "long", year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" })}</p>

                <div class="row">
                    <div class="col-full">
                        <div class="card" style="background: linear-gradient(135deg, #f0f8fc 0%, #e8f4f8 100%); border-left: 4px solid #000091; margin-bottom: 1.5rem;">
                            <div class="card-header">
                                <h3>Informations du Patient</h3>
                            </div>
                            <div class="card-body">
                                <div class="row">
                                    <div class="col-third">
                                        <div>
                                            <small style="color: #666; font-weight: 600;">Nom Complet</small>
                                            <div style="font-size: 1.1rem; font-weight: bold; color: #000091; margin-top: 0.5rem;">
                                                ${test.patient_name || state.patient?.firstName || "\u2014"} ${state.patient?.lastName || ""}
                                            </div>
                                        </div>
                                    </div>
                                    <div class="col-third">
                                        <div>
                                            <small style="color: #666; font-weight: 600;">\xC2ge</small>
                                            <div style="font-size: 1.1rem; font-weight: bold; color: #0a76f6; margin-top: 0.5rem;">
                                                ${state.patient?.age || "\u2014"} ans
                                            </div>
                                        </div>
                                    </div>
                                    <div class="col-third">
                                        <div>
                                            <small style="color: #666; font-weight: 600;">Email</small>
                                            <div style="font-size: 0.95rem; color: #555; margin-top: 0.5rem; word-break: break-all;">
                                                \u{1F4E7} ${state.patient?.email || "\u2014"}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="row">
                    <div class="col-full">
                        <div class="card">
                            <div class="card-header">
                                <h3>Informations G\xE9n\xE9rales</h3>
                            </div>
                            <div class="card-body">
                                <div class="row">
                                    <div class="col-third">
                                        <div style="margin-bottom: 1.5rem;">
                                            <small style="color: #666; font-weight: 600;">Dur\xE9e du test</small>
                                            <div style="font-size: 1.5rem; font-weight: bold; color: #000091; margin-top: 0.5rem;">
                                                ${formatTime(duration)}
                                            </div>
                                        </div>
                                    </div>
                                    <div class="col-third">
                                        <div style="margin-bottom: 1.5rem;">
                                            <small style="color: #666; font-weight: 600;">R\xE9sultat</small>
                                            <div style="margin-top: 0.5rem;">
                                                <span class="badge badge-${result === "excellent" ? "success" : result === "good" ? "primary" : "warning"}" 
                                                      style="font-size: 1rem; padding: 0.5rem 1rem;">
                                                    ${result}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <div class="col-third">
                                        <div style="margin-bottom: 1.5rem;">
                                            <small style="color: #666; font-weight: 600;">Nombre de Fixations</small>
                                            <div style="font-size: 1.5rem; font-weight: bold; color: #0a76f6; margin-top: 0.5rem;">
                                                ${fixations}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="row">
                    <div class="col-half">
                        <div class="card">
                            <div class="card-header">
                                <h3>M\xE9triques de Suivi</h3>
                            </div>
                            <div class="card-body">
                                <div style="margin-bottom: 1.5rem;">
                                    <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
                                        <small style="color: #666; font-weight: 600;">Pourcentage de Suivi</small>
                                        <strong>${tracking.toFixed(1)}%</strong>
                                    </div>
                                    <div style="background-color: #f6f6f6; height: 8px; border-radius: 2px; overflow: hidden;">
                                        <div style="background-color: #18753c; height: 100%; width: ${tracking}%;"></div>
                                    </div>
                                </div>

                                <div style="margin-bottom: 1.5rem;">
                                    <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
                                        <small style="color: #666; font-weight: 600;">Stabilit\xE9 Oculaire</small>
                                        <strong>${gazeStability.toFixed(2)}</strong>
                                    </div>
                                    <div style="background-color: #f6f6f6; height: 8px; border-radius: 2px; overflow: hidden;">
                                        <div style="background-color: #0a76f6; height: 100%; width: ${Math.min(gazeStability * 10, 100)}%;"></div>
                                    </div>
                                </div>

                                <div>
                                    <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
                                        <small style="color: #666; font-weight: 600;">Coh\xE9rence de Regard</small>
                                        <strong>${gazeConsistency.toFixed(2)}</strong>
                                    </div>
                                    <div style="background-color: #f6f6f6; height: 8px; border-radius: 2px; overflow: hidden;">
                                        <div style="background-color: #ff9947; height: 100%; width: ${Math.min(gazeConsistency * 10, 100)}%;"></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="col-half">
                        <div class="card">
                            <div class="card-header">
                                <h3>Dur\xE9es de Fixation</h3>
                            </div>
                            <div class="card-body">
                                <div style="margin-bottom: 1.5rem;">
                                    <small style="color: #666; font-weight: 600;">Dur\xE9e Moyenne</small>
                                    <div style="font-size: 1.3rem; font-weight: bold; margin-top: 0.5rem;">
                                        ${avgFixation.toFixed(0)} ms
                                    </div>
                                </div>

                                <div style="margin-bottom: 1.5rem;">
                                    <small style="color: #666; font-weight: 600;">Dur\xE9e Maximale</small>
                                    <div style="font-size: 1.3rem; font-weight: bold; color: #ce0500; margin-top: 0.5rem;">
                                        ${maxFixation.toFixed(0)} ms
                                    </div>
                                </div>

                                <div>
                                    <small style="color: #666; font-weight: 600;">Dur\xE9e Minimale</small>
                                    <div style="font-size: 1.3rem; font-weight: bold; color: #18753c; margin-top: 0.5rem;">
                                        ${minFixation.toFixed(0)} ms
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="form-actions">
                    <button class="btn btn-secondary" onclick="window.app?.goToScreen?.('results-screen')">
                        \u2190 Retour aux r\xE9sultats
                    </button>
                </div>
            </div>
        </div>
    `;
  }
  function renderRegisterScreen() {
    return `
        <div class="screen" id="register-screen">
            <div class="container">
                <h1 class="screen-title">Cr\xE9er un Nouveau Patient</h1>
                <p class="screen-subtitle">Enregistrez les informations du nouveau patient</p>

                <div class="row">
                    <div class="col-full">
                        <div class="card">
                            <form id="registerPatientForm">
                                <div class="form-group">
                                    <label for="firstName">Pr\xE9nom *</label>
                                    <input type="text" id="firstName" name="firstName" placeholder="Jean" required />
                                </div>

                                <div class="form-group">
                                    <label for="lastName">Nom *</label>
                                    <input type="text" id="lastName" name="lastName" placeholder="Dupont" required />
                                </div>

                                <div class="form-group">
                                    <label for="email">Email *</label>
                                    <input type="email" id="email" name="email" placeholder="patient@example.com" required />
                                </div>

                                <div class="form-group">
                                    <label for="age">\xC2ge</label>
                                    <input type="number" id="age" name="age" placeholder="30" min="0" max="150" />
                                </div>

                                <div class="form-group">
                                    <label for="username">Nom d'utilisateur *</label>
                                    <input type="text" id="username" name="username" placeholder="jean_dupont" required />
                                </div>

                                <div class="form-group">
                                    <label for="password">Mot de passe *</label>
                                    <input type="password" id="password" name="password" placeholder="\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022" required />
                                </div>

                                <div class="form-actions">
                                    <button type="submit" class="btn btn-primary">
                                        \u2713 Cr\xE9er Patient
                                    </button>
                                    <button type="button" class="btn btn-secondary" onclick="window.app?.goToScreen?.('patient-selection-screen')">
                                        \u2190 Retour
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
  }
  function renderAboutScreen() {
    return `
        <div class="screen" id="about-screen">
            <div class="container">
                <h1 class="screen-title">\xC0 propos</h1>

                <div class="card">
                    <div class="card-header">
                        <h3>Syst\xE8me de Suivi Oculaire Clinique</h3>
                    </div>
                    <div class="card-body">
                        <p style="margin-bottom: 1rem;">
                            <strong>Version:</strong> 1.0.0
                        </p>
                        <p style="margin-bottom: 1rem;">
                            Le Syst\xE8me de Suivi Oculaire Clinique (SOOC) est un outil d'\xE9valuation ophtalmologique 
                            fond\xE9 sur le suivi oculaire par webcam. Il utilise la technologie WebGazer.js 
                            pour un suivi oculaire pratique et sans \xE9quipement sp\xE9cialis\xE9.
                        </p>
                        <p style="margin-bottom: 1rem;">
                            <strong>Destin\xE9 aux:</strong> Orthoptistes et professionnels de la sant\xE9 visuelle
                        </p>
                        <p style="margin-bottom: 1rem;">
                            <strong>Technologie:</strong> WebGazer.js, Django REST Framework, TypeScript
                        </p>
                        <p style="color: #666; font-size: 0.9rem;">
                            \xA9 2025 R\xE9publique Fran\xE7aise - Tous droits r\xE9serv\xE9s
                        </p>
                    </div>
                </div>

                <div class="form-actions">
                    <button class="btn btn-secondary" onclick="window.app?.goToScreen?.('home-screen')">
                        \u2190 Retour
                    </button>
                </div>
            </div>
        </div>
    `;
  }
  function formatTime(seconds) {
    if (!seconds || isNaN(seconds)) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  }
  function renderMainLayout() {
    const state = state_service_default.getState();
    return `
        <nav class="navbar">
            ${renderNavbarHeader()}
            ${renderNavbarContent()}
        </nav>
        
        <main style="flex: 1; display: flex; flex-direction: column; justify-content: center;">
            ${state.currentScreen === "home-screen" ? renderHomeScreen() : state.currentScreen === "patient-selection-screen" ? renderPatientSelectionScreen() : state.currentScreen === "register-screen" ? renderRegisterScreen() : state.currentScreen === "calibration-screen" ? renderCalibrationScreen() : state.currentScreen === "test-screen" ? renderTestScreen() : state.currentScreen === "results-screen" ? renderResultsScreen() : state.currentScreen === "test-detail-screen" ? renderTestDetailScreen() : state.currentScreen === "about-screen" ? renderAboutScreen() : renderHomeScreen()}
        </main>

        <footer style="background-color: #f6f6f6; border-top: 1px solid #ddd; padding: 1.5rem; text-align: center; font-size: 0.9rem; color: #666;">
            <p>Syst\xE8me de Suivi Oculaire Clinique - R\xE9alis\xE9 pour les professionnels de sant\xE9</p>
        </footer>

        ${renderNotifications()}
    `;
  }

  // src/app-gouv.ts
  var AppGouv = class {
    constructor() {
      this.calibrationMode = false;
      this.calibrationPoints = [];
      this.testActive = false;
      this.testStartTime = 0;
      console.log("\u{1F680} Initialisation AppGouv");
    }
    /**
     * Initialise l'application
     */
    async start() {
      console.log("\u{1F680} D\xE9marrage de l'application gouvernementale...");
      try {
        const tokenVersion = localStorage.getItem("token_version");
        const currentVersion = "2.0";
        if (tokenVersion !== currentVersion) {
          console.log("\u{1F504} R\xE9initialisation des tokens...");
          api_service_default.logout();
          localStorage.setItem("token_version", currentVersion);
        }
        console.log("\u2705 Tokens checked");
        await this.initializeEyeTracking();
        console.log("\u2705 Eye tracking initialized");
        this.setupEventListeners();
        console.log("\u2705 Event listeners setup");
        this.render();
        console.log("\u2705 Rendu initial termin\xE9");
        state_service_default.subscribe(() => {
          if (!this.testActive) {
            this.render();
          }
        });
        console.log("\u2705 App ready!");
      } catch (error) {
        console.error("\u274C Erreur lors du d\xE9marrage:", error);
        state_service_default.addNotification(
          `Erreur au d\xE9marrage: ${error instanceof Error ? error.message : "Inconnue"}`,
          "error"
        );
      }
    }
    /**
     * Initialise WebGazer pour le suivi oculaire
     */
    async initializeEyeTracking() {
      return new Promise((resolve) => {
        if (!window.webgazer) {
          console.warn("\u26A0\uFE0F WebGazer non disponible");
          resolve();
          return;
        }
        window.webgazer.setGazeListener((data) => {
          if (data) {
            state_service_default.updateGazeData({
              x: data.x,
              y: data.y,
              confidence: data.confidence
            });
          }
        }).begin().then(() => {
          console.log("\u2705 WebGazer initialized");
          const enforcePosition = () => {
            const container2 = document.querySelector(".webgazer-container");
            if (container2) {
              const styleString = `
                                position: fixed !important;
                                bottom: 10px !important;
                                right: 10px !important;
                                top: auto !important;
                                left: auto !important;
                                width: 200px !important;
                                height: 150px !important;
                                z-index: 99998 !important;
                                border-radius: 10px !important;
                                border: 3px solid #000091 !important;
                                box-shadow: 0 4px 15px rgba(0, 0, 145, 0.4) !important;
                                background: #000 !important;
                                overflow: hidden !important;
                                display: block !important;
                            `;
              container2.style.cssText = styleString;
              container2.removeAttribute("data-webgazer");
              const canvas = container2.querySelector("canvas");
              const video = container2.querySelector("video");
              if (canvas) {
                canvas.style.cssText = `
                                    width: 100% !important;
                                    height: 100% !important;
                                    display: block !important;
                                    border-radius: 8px !important;
                                    object-fit: cover !important;
                                `;
              }
              if (video) {
                video.style.cssText = `
                                    width: 100% !important;
                                    height: 100% !important;
                                    display: block !important;
                                    border-radius: 8px !important;
                                    object-fit: cover !important;
                                `;
              }
            }
          };
          enforcePosition();
          let isRepositioning = true;
          const reposition = () => {
            if (isRepositioning) {
              enforcePosition();
              requestAnimationFrame(reposition);
            }
          };
          reposition();
          const observer = new MutationObserver(() => {
            enforcePosition();
          });
          const container = document.querySelector(".webgazer-container");
          if (container) {
            observer.observe(container, {
              attributes: true,
              attributeOldValue: true,
              attributeFilter: ["style", "data-webgazer"]
            });
          }
          setTimeout(() => {
            isRepositioning = false;
            console.log("\u2705 WebGazer container repositionn\xE9 - monitoring actif");
          }, 15e3);
          resolve();
        }).catch((err) => {
          console.error("\u26A0\uFE0F WebGazer error:", err);
          resolve();
        });
      });
    }
    /**
     * Configure les event listeners
     */
    setupEventListeners() {
      document.addEventListener("submit", (e) => this.handleFormSubmit(e));
    }
    /**
     * Gère la soumission de formulaires
     */
    handleFormSubmit(e) {
      const form = e.target;
      if (form.id === "loginForm") {
        e.preventDefault();
        this.handleLogin(form);
      } else if (form.id === "registerForm") {
        e.preventDefault();
        this.handleRegister(form);
      } else if (form.id === "registerPatientForm") {
        e.preventDefault();
        this.handleRegisterPatient(form);
      }
    }
    /**
     * Gère la connexion
     */
    async handleLogin(form) {
      try {
        if (!form) {
          form = document.querySelector("#loginForm");
          if (!form) {
            state_service_default.addNotification("\u2715 Formulaire non trouv\xE9", "error");
            return;
          }
        }
        const usernameElement = form.querySelector("#loginUsername");
        const passwordElement = form.querySelector("#loginPassword");
        if (!usernameElement || !passwordElement) {
          state_service_default.addNotification("\u2715 Erreur: \xC9l\xE9ments du formulaire non trouv\xE9s", "error");
          return;
        }
        const username = usernameElement.value;
        const password = passwordElement.value;
        const response = await api_service_default.login(username, password);
        state_service_default.setPatient({
          id: response.user_id,
          username: response.username,
          email: response.email,
          firstName: response.first_name || "",
          lastName: response.last_name || "",
          age: 0
        });
        state_service_default.addNotification("\u2713 Connexion r\xE9ussie!", "success");
        this.goToScreen("home-screen");
        form.reset();
      } catch (error) {
        state_service_default.addNotification(
          `\u2715 Erreur: ${error instanceof Error ? error.message : "Erreur inconnue"}`,
          "error"
        );
      }
    }
    /**
     * Gère l'inscription
     */
    async handleRegister(form) {
      try {
        if (!form) {
          form = document.querySelector("#registerForm");
          if (!form) {
            state_service_default.addNotification("\u2715 Formulaire non trouv\xE9", "error");
            return;
          }
        }
        const usernameElement = form.querySelector("#registerUsername");
        const emailElement = form.querySelector("#registerEmail");
        const passwordElement = form.querySelector("#registerPassword");
        const firstNameElement = form.querySelector("#registerFirstName");
        const lastNameElement = form.querySelector("#registerLastName");
        const ageElement = form.querySelector("#registerAge");
        if (!usernameElement || !emailElement || !passwordElement || !firstNameElement || !lastNameElement || !ageElement) {
          state_service_default.addNotification("\u2715 Erreur: \xC9l\xE9ments du formulaire non trouv\xE9s", "error");
          return;
        }
        const response = await api_service_default.register(
          usernameElement.value,
          emailElement.value,
          passwordElement.value,
          firstNameElement.value,
          lastNameElement.value,
          parseInt(ageElement.value)
        );
        state_service_default.setPatient({
          id: response.user_id,
          username: response.username,
          email: response.email,
          firstName: response.first_name || "",
          lastName: response.last_name || "",
          age: parseInt(ageElement.value)
        });
        state_service_default.addNotification("\u2713 Inscription r\xE9ussie!", "success");
        this.goToScreen("home-screen");
        form.reset();
      } catch (error) {
        state_service_default.addNotification(
          `\u2715 Erreur: ${error instanceof Error ? error.message : "Erreur inconnue"}`,
          "error"
        );
      }
    }
    /**
     * Gère l'enregistrement d'un nouveau patient (depuis l'écran patient-selection)
     */
    async handleRegisterPatient(form) {
      try {
        if (!form) {
          form = document.querySelector("#registerPatientForm");
          if (!form) {
            state_service_default.addNotification("\u2715 Formulaire non trouv\xE9", "error");
            return;
          }
        }
        const firstNameElement = form.querySelector("#firstName");
        const lastNameElement = form.querySelector("#lastName");
        const emailElement = form.querySelector("#email");
        const ageElement = form.querySelector("#age");
        const usernameElement = form.querySelector("#username");
        const passwordElement = form.querySelector("#password");
        if (!firstNameElement || !lastNameElement || !emailElement || !usernameElement || !passwordElement) {
          state_service_default.addNotification("\u2715 Erreur: Champs obligatoires manquants", "error");
          return;
        }
        const response = await api_service_default.register(
          usernameElement.value,
          emailElement.value,
          passwordElement.value,
          firstNameElement.value,
          lastNameElement.value,
          ageElement ? parseInt(ageElement.value) || 0 : 0
        );
        state_service_default.addNotification("\u2713 Patient cr\xE9\xE9 avec succ\xE8s!", "success");
        form.reset();
        await this.loadPatients();
        this.goToScreen("patient-selection-screen");
      } catch (error) {
        state_service_default.addNotification(
          `\u2715 Erreur: ${error instanceof Error ? error.message : "Erreur inconnue"}`,
          "error"
        );
      }
    }
    /**
     * Démarre la calibration
     */
    async startCalibration() {
      console.log("\u{1F527} D\xE9marrage de la calibration...");
      this.calibrationMode = true;
      this.calibrationPoints = [];
      const canvas = document.querySelector("#testCanvas");
      if (!canvas) {
        state_service_default.addNotification("\u2715 Canvas non trouv\xE9", "error");
        return;
      }
      const calibrationPositions = [
        { x: 0.1, y: 0.1 },
        { x: 0.9, y: 0.1 },
        { x: 0.5, y: 0.5 },
        { x: 0.1, y: 0.9 },
        { x: 0.9, y: 0.9 }
      ];
      for (let i = 0; i < calibrationPositions.length; i++) {
        const pos = calibrationPositions[i];
        const x = canvas.offsetWidth * pos.x;
        const y = canvas.offsetHeight * pos.y;
        this.drawCalibrationPoint(canvas, x, y);
        await new Promise((resolve) => setTimeout(resolve, 2e3));
        state_service_default.updateCalibration(i + 1);
      }
      this.calibrationMode = false;
      state_service_default.addNotification("\u2713 Calibration termin\xE9e!", "success");
      console.log("\u2705 Calibration complete");
    }
    /**
     * Dessine un point de calibration
     */
    drawCalibrationPoint(canvas, x, y) {
      const oldPoints = canvas.querySelectorAll(".calibration-point");
      oldPoints.forEach((point2) => point2.remove());
      const point = document.createElement("div");
      point.className = "calibration-point";
      point.style.position = "absolute";
      point.style.left = x + "px";
      point.style.top = y + "px";
      point.style.width = "20px";
      point.style.height = "20px";
      point.style.borderRadius = "50%";
      point.style.backgroundColor = "#000091";
      point.style.border = "3px solid #0a76f6";
      point.style.transform = "translate(-50%, -50%)";
      point.style.boxShadow = "0 0 10px rgba(0, 0, 145, 0.5)";
      canvas.appendChild(point);
    }
    /**
     * Démarre un test
     */
    async startTest() {
      console.log("\u25B6\uFE0F D\xE9marrage du test...");
      this.testActive = true;
      this.testStartTime = Date.now();
      const controls = document.querySelector("#activeTestControls");
      if (controls) {
        controls.style.display = "block";
      }
      const buttons = document.querySelectorAll('[onclick*="startTest"]');
      buttons.forEach((btn) => btn.style.display = "none");
      state_service_default.startTest();
      const canvas = document.querySelector("#testCanvas");
      const ctx = canvas?.getContext("2d");
      const gazeTrail = [];
      const fixations = [];
      let lastSpread = 0;
      let currentFixation = null;
      const FIXATION_THRESHOLD = 50;
      const FIXATION_MIN_DURATION = 0.1;
      if (canvas && ctx) {
        canvas.width = canvas.offsetWidth;
        canvas.height = canvas.offsetHeight;
      }
      const testInterval = setInterval(() => {
        if (!this.testActive) {
          clearInterval(testInterval);
          return;
        }
        const elapsed = (Date.now() - this.testStartTime) / 1e3;
        const state = state_service_default.getState();
        let gazeData = null;
        if (state.currentTest && state.currentTest.rawData) {
          const rawDataEntries = Object.entries(state.currentTest.rawData);
          if (rawDataEntries.length > 0) {
            gazeData = rawDataEntries[rawDataEntries.length - 1][1];
            if (gazeData && canvas) {
              gazeData.x = Math.max(0, Math.min(gazeData.x, canvas.width));
              gazeData.y = Math.max(0, Math.min(gazeData.y, canvas.height));
            }
          }
        }
        if (gazeData && gazeData.x && gazeData.y) {
          gazeTrail.push({
            x: gazeData.x,
            y: gazeData.y,
            timestamp: Date.now()
          });
          if (gazeTrail.length > 300) {
            gazeTrail.shift();
          }
          if (gazeTrail.length >= 10) {
            const recentPoints = gazeTrail.slice(-10);
            const avgX = recentPoints.reduce((sum, p) => sum + p.x, 0) / recentPoints.length;
            const avgY = recentPoints.reduce((sum, p) => sum + p.y, 0) / recentPoints.length;
            const spread = recentPoints.reduce((sum, p) => sum + Math.hypot(p.x - avgX, p.y - avgY), 0) / recentPoints.length;
            lastSpread = spread;
            if (spread < FIXATION_THRESHOLD) {
              if (!currentFixation) {
                currentFixation = {
                  x: avgX,
                  y: avgY,
                  startTime: Date.now(),
                  startTrailIndex: gazeTrail.length - 1
                };
              } else {
                const distance = Math.hypot(currentFixation.x - avgX, currentFixation.y - avgY);
                if (distance < FIXATION_THRESHOLD * 2) {
                  currentFixation.x = avgX;
                  currentFixation.y = avgY;
                } else {
                  const fixationDuration = (Date.now() - currentFixation.startTime) / 1e3;
                  if (fixationDuration >= FIXATION_MIN_DURATION) {
                    fixations.push({
                      x: currentFixation.x,
                      y: currentFixation.y,
                      startTime: currentFixation.startTime,
                      endTime: Date.now(),
                      duration: fixationDuration
                    });
                  }
                  currentFixation = {
                    x: avgX,
                    y: avgY,
                    startTime: Date.now(),
                    startTrailIndex: gazeTrail.length - 1
                  };
                }
              }
            } else {
              if (currentFixation) {
                const fixationDuration = (Date.now() - currentFixation.startTime) / 1e3;
                if (fixationDuration >= FIXATION_MIN_DURATION) {
                  fixations.push({
                    x: currentFixation.x,
                    y: currentFixation.y,
                    startTime: currentFixation.startTime,
                    endTime: Date.now(),
                    duration: fixationDuration
                  });
                }
                currentFixation = null;
              }
            }
          }
        }
        const trackingPercentage = Math.min(100, gazeTrail.length / (elapsed * 30) * 100);
        const stability = gazeTrail.length > 1 ? Math.max(0, 100 - lastSpread * 3) : 0;
        const consistency = gazeTrail.length > 1 ? 100 - lastSpread * 2 : 0;
        const avgFixationDuration = fixations.length > 0 ? fixations.reduce((sum, f) => sum + f.duration, 0) / fixations.length : 0;
        const maxFixationDuration = fixations.length > 0 ? Math.max(...fixations.map((f) => f.duration)) : 0;
        const minFixationDuration = fixations.length > 0 ? Math.min(...fixations.map((f) => f.duration)) : 0;
        state_service_default.updateTestData({
          totalTime: elapsed,
          gazeTime: elapsed,
          trackingPercentage,
          fixationCount: fixations.length,
          avgFixationDuration: avgFixationDuration * 1e3,
          // en ms
          maxFixationDuration: maxFixationDuration * 1e3,
          minFixationDuration: minFixationDuration * 1e3,
          gazeStability: stability,
          gazeConsistency: Math.max(0, consistency)
        });
        if (canvas && ctx) {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.fillStyle = "rgba(246, 246, 246, 0.5)";
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          if (gazeTrail.length > 1) {
            ctx.strokeStyle = "#18753c";
            ctx.lineWidth = 2;
            ctx.lineCap = "round";
            ctx.lineJoin = "round";
            for (let i = 0; i < gazeTrail.length; i++) {
              const point = gazeTrail[i];
              const opacity = i / gazeTrail.length;
              ctx.globalAlpha = opacity * 0.6;
              if (i === 0) {
                ctx.beginPath();
                ctx.moveTo(point.x, point.y);
              } else {
                ctx.lineTo(point.x, point.y);
              }
            }
            ctx.stroke();
            ctx.globalAlpha = 1;
          }
          for (const fixation of fixations) {
            const radius = Math.max(15, Math.min(50, fixation.duration * 30));
            ctx.strokeStyle = "#ff9947";
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(fixation.x, fixation.y, radius, 0, Math.PI * 2);
            ctx.stroke();
            ctx.fillStyle = "rgba(255, 153, 71, 0.2)";
            ctx.fill();
            ctx.fillStyle = "#ff9947";
            ctx.font = "bold 14px Arial";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText("F", fixation.x, fixation.y);
            ctx.font = "bold 10px Arial";
            ctx.fillText(`${fixation.duration.toFixed(2)}s`, fixation.x, fixation.y + 15);
          }
          if (currentFixation && lastSpread < FIXATION_THRESHOLD) {
            const currentDuration = (Date.now() - currentFixation.startTime) / 1e3;
            ctx.strokeStyle = "#ff9947";
            ctx.lineWidth = 2;
            ctx.setLineDash([5, 5]);
            ctx.beginPath();
            ctx.arc(currentFixation.x, currentFixation.y, 20, 0, Math.PI * 2);
            ctx.stroke();
            ctx.setLineDash([]);
          }
          if (gazeData && gazeData.x && gazeData.y) {
            ctx.fillStyle = "#0a76f6";
            ctx.beginPath();
            ctx.arc(gazeData.x, gazeData.y, 6, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = "#000091";
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(gazeData.x, gazeData.y, 6, 0, Math.PI * 2);
            ctx.stroke();
            ctx.fillStyle = "#ffffff";
            ctx.beginPath();
            ctx.arc(gazeData.x, gazeData.y, 2, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = "#0a76f6";
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(gazeData.x - 12, gazeData.y);
            ctx.lineTo(gazeData.x + 12, gazeData.y);
            ctx.moveTo(gazeData.x, gazeData.y - 12);
            ctx.lineTo(gazeData.x, gazeData.y + 12);
            ctx.stroke();
          }
        }
      }, 16);
    }
    /**
     * Arrête le test et envoie les données
     */
    async stopTest() {
      console.log("\u23F9\uFE0F Arr\xEAt du test...");
      this.testActive = false;
      const testData = state_service_default.getState().currentTest;
      state_service_default.addNotification("\u{1F4E4} Soumission des donn\xE9es...", "info");
      try {
        const token = localStorage.getItem("access_token");
        if (!token) {
          state_service_default.addNotification("\u2715 Token expir\xE9. Veuillez vous reconnecter.", "error");
          this.goToScreen("login-screen");
          return;
        }
        const result = await api_service_default.createTest({
          patient_id: window.__selectedPatientId,
          duration: testData?.totalTime || 0,
          gaze_time: testData?.gazeTime || 0,
          tracking_percentage: testData?.trackingPercentage || 0,
          fixation_count: testData?.fixationCount || 0,
          avg_fixation_duration: testData?.avgFixationDuration || 0,
          max_fixation_duration: testData?.maxFixationDuration || 0,
          min_fixation_duration: testData?.minFixationDuration || 0,
          gaze_stability: testData?.gazeStability || 0,
          gaze_consistency: testData?.gazeConsistency || 0,
          raw_data: testData?.rawData || {}
        });
        state_service_default.addNotification("\u2713 Test enregistr\xE9 avec succ\xE8s!", "success");
        if (result) {
          state_service_default.addTestResult({
            id: result.id,
            test_date: (/* @__PURE__ */ new Date()).toISOString(),
            duration: result.duration,
            gaze_time: result.gaze_time,
            tracking_percentage: result.tracking_percentage,
            fixation_count: result.fixation_count,
            result: result.result || "good",
            avg_fixation_duration: result.avg_fixation_duration,
            max_fixation_duration: result.avg_fixation_duration,
            min_fixation_duration: result.avg_fixation_duration,
            gaze_stability: result.gaze_stability || 0.5,
            gaze_consistency: result.gaze_consistency || 0.5,
            raw_data: result.raw_data
          });
        }
        state_service_default.finishTest();
        const controls = document.querySelector("#activeTestControls");
        if (controls) {
          controls.style.display = "none";
        }
        const buttons = document.querySelectorAll('[onclick*="startTest"]');
        buttons.forEach((btn) => btn.style.display = "block");
        this.render();
        setTimeout(() => this.goToScreen("results-screen"), 1500);
      } catch (error) {
        state_service_default.addNotification(
          `\u2715 Erreur: ${error instanceof Error ? error.message : "Erreur inconnue"}`,
          "error"
        );
        this.testActive = false;
      }
    }
    /**
     * Affiche un écran spécifique
     */
    async goToScreen(screenId) {
      console.log(`\u{1F4FA} Navigation vers: ${screenId}`);
      if (screenId === "results-screen") {
        try {
          const token = localStorage.getItem("access_token");
          if (!token) {
            state_service_default.addNotification("\u2715 Token expir\xE9. Veuillez vous reconnecter.", "error");
            this.goToScreen("login-screen");
            return;
          }
          const tests = await api_service_default.getTests();
          state_service_default.setTests(tests);
        } catch (error) {
          console.error("Erreur lors du chargement des tests:", error);
          state_service_default.addNotification(
            `\u2715 Erreur: ${error instanceof Error ? error.message : "Erreur inconnue"}`,
            "error"
          );
        }
      }
      state_service_default.setScreen(screenId);
      this.render();
    }
    /**
     * Charge la liste des patients
     */
    async loadPatients() {
      try {
        const patients = await api_service_default.getPatients();
        state_service_default.setPatients(Array.isArray(patients) ? patients : patients.results || []);
      } catch (error) {
        console.error("Erreur lors du chargement des patients:", error);
        state_service_default.addNotification(
          `\u2715 Erreur: ${error instanceof Error ? error.message : "Erreur inconnue"}`,
          "error"
        );
      }
    }
    /**
     * Sélectionne un patient pour le test
     */
    selectPatient(patientId) {
      console.log(`\u{1F464} S\xE9lection du patient ${patientId}`);
      window.__selectedPatientId = patientId;
      state_service_default.setCurrentPatient(patientId);
    }
    /**
     * Récupère le patient actuellement sélectionné
     */
    handleLogout() {
      if (confirm("\xCAtes-vous s\xFBr de vouloir vous d\xE9connecter?")) {
        api_service_default.logout();
        state_service_default.clearPatient();
        state_service_default.addNotification("\u2713 D\xE9connexion r\xE9ussie", "success");
        this.goToScreen("home-screen");
      }
    }
    /**
     * Affiche les détails d'un test
     */
    viewTest(testId) {
      console.log(`\u{1F4CA} Affichage du test ${testId}`);
      window.__selectedTestId = testId;
      this.goToScreen("test-detail-screen");
    }
    /**
     * Rend l'interface
     */
    render() {
      const app = document.querySelector("#app");
      if (!app) return;
      app.innerHTML = renderMainLayout();
    }
  };
  window.app = new AppGouv();
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
      window.app?.start();
    });
  } else {
    window.app.start();
  }
})();
