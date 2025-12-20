"use strict";
(() => {
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

  // src/eyeTracker.ts
  var KalmanFilter = class {
    // Gain Kalman
    constructor(initialValue, processNoise = 0.01, measurementNoise = 4) {
      this.x = initialValue;
      this.p = 1;
      this.q = processNoise;
      this.r = measurementNoise;
      this.k = 0;
    }
    update(measurement) {
      this.p = this.p + this.q;
      this.k = this.p / (this.p + this.r);
      this.x = this.x + this.k * (measurement - this.x);
      this.p = (1 - this.k) * this.p;
      return this.x;
    }
  };
  var EyeTracker = class {
    constructor() {
      this.isCalibrated = false;
      this.gazeData = null;
      this.previousGazeData = null;
      this.calibrationPoints = [];
      this.isTracking = false;
      this.eyeOpenThreshold = 0.3;
      // Filtres Kalman pour lissage
      this.kalmanX = new KalmanFilter(0);
      this.kalmanY = new KalmanFilter(0);
      // Historique pour calculs avancés
      this.gazeHistory = [];
      this.maxHistorySize = 50;
      // Détection des yeux
      this.leftEyeOpenCount = 0;
      this.rightEyeOpenCount = 0;
      this.eyeStateBuffer = 5;
    }
    /**
     * Initialise WebGazer avec affichage de la vidéo
     */
    async init() {
      return new Promise((resolve, reject) => {
        console.log("\u{1F680} Initialisation de WebGazer...");
        console.log("\u{1F4F9} V\xE9rification de la disponibilit\xE9 de la cam\xE9ra...");
        navigator.mediaDevices.enumerateDevices().then((devices) => {
          const cameras = devices.filter((device) => device.kind === "videoinput");
          console.log(`\u{1F4F7} Cam\xE9ras d\xE9tect\xE9es: ${cameras.length}`);
          cameras.forEach((camera, idx) => {
            console.log(`  ${idx + 1}. ${camera.label || "Cam\xE9ra sans label"}`);
          });
          if (cameras.length === 0) {
            console.error("\u274C Aucune cam\xE9ra trouv\xE9e");
            reject(new Error("Cam\xE9ra non trouv\xE9e"));
            return;
          }
          console.log("\u2705 Cam\xE9ra d\xE9tect\xE9e");
          if (!window.webgazer) {
            console.error("\u274C WebGazer non charg\xE9");
            reject(new Error("WebGazer non charg\xE9"));
            return;
          }
          console.log("\u2705 WebGazer d\xE9tect\xE9");
          console.log("\u{1F504} Configuration du tracker TFFacemesh...");
          const container = document.getElementById("webgazerVideoContainer");
          if (container) {
            console.log("\u2705 Container WebGazer trouv\xE9");
          }
          window.webgazer.setRegression("ridge").setTracker("TFFacemesh").begin().then(() => {
            console.log("\u2705 WebGazer.begin() compl\xE9t\xE9");
            const webgazerContainer = document.querySelector(".webgazer-container");
            if (webgazerContainer && container) {
              console.log("\u{1F4E6} D\xE9placement du container WebGazer...");
              container.appendChild(webgazerContainer);
            }
            this.showWebcamVideo();
            this.setupGazeListener();
            let attempts = 0;
            const maxAttempts = 100;
            console.log(`\u23F3 Attente des donn\xE9es de regard (max ${maxAttempts * 100}ms)...`);
            const waitForData = setInterval(() => {
              attempts++;
              if (this.gazeData) {
                clearInterval(waitForData);
                console.log(`\u2705 Donn\xE9es de regard re\xE7ues apr\xE8s ${attempts * 100}ms`);
                resolve();
              } else if (attempts % 10 === 0) {
                console.log(`  ... en attente (${attempts * 100}ms \xE9coul\xE9es)`);
              }
              if (attempts >= maxAttempts) {
                clearInterval(waitForData);
                console.warn("\u26A0\uFE0F Timeout attente donn\xE9es de regard - continuant malgr\xE9 tout");
                resolve();
              }
            }, 100);
          }).catch((error) => {
            console.error("\u274C Erreur WebGazer:", error);
            reject(error);
          });
        }).catch((error) => {
          console.error("\u274C Erreur acc\xE8s cam\xE9ra:", error);
          reject(error);
        });
      });
    }
    /**
     * Affiche la vidéo de la caméra
     */
    showWebcamVideo() {
      console.log("\u{1F4F9} Initialisation du container vid\xE9o...");
      const container = document.getElementById("webgazerVideoContainer");
      if (!container) {
        console.error("\u274C Container #webgazerVideoContainer non trouv\xE9 dans le DOM");
        return;
      }
      const applyStyles = () => {
        container.style.cssText = `
                display: block !important;
                position: fixed !important;
                bottom: 10px !important;
                right: 10px !important;
                top: auto !important;
                left: auto !important;
                width: 200px !important;
                height: 150px !important;
                border-radius: 10px !important;
                border: 3px solid #10b981 !important;
                z-index: 99998 !important;
                box-shadow: 0 4px 15px rgba(16, 185, 129, 0.4) !important;
                background: #000 !important;
                overflow: hidden !important;
            `;
        const webgazerContainer = document.querySelector(".webgazer-container");
        if (webgazerContainer) {
          webgazerContainer.style.cssText = `
                    position: fixed !important;
                    bottom: 10px !important;
                    right: 10px !important;
                    top: auto !important;
                    left: auto !important;
                    width: 200px !important;
                    height: 150px !important;
                    z-index: 99998 !important;
                    border-radius: 10px !important;
                    border: 3px solid #10b981 !important;
                    box-shadow: 0 4px 15px rgba(16, 185, 129, 0.4) !important;
                    background: #000 !important;
                    overflow: hidden !important;
                    display: block !important;
                `;
          const canvas = webgazerContainer.querySelector("canvas");
          const video = webgazerContainer.querySelector("video");
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
      applyStyles();
      console.log("\u2705 Conteneur vid\xE9o stylis\xE9 (1\xE8re fois)");
      const styleInterval = setInterval(() => {
        applyStyles();
      }, 200);
      const observer = new MutationObserver(() => {
        applyStyles();
      });
      observer.observe(container, {
        attributes: true,
        style: true,
        childList: true,
        subtree: true
      });
      setTimeout(() => {
        clearInterval(styleInterval);
        observer.disconnect();
        console.log("\u2705 Repositionnement WebGazer finalis\xE9");
      }, 5e3);
    }
    /**
     * Masque la vidéo de la caméra
     */
    hideWebcamVideo() {
      const container = document.getElementById("webgazerVideoContainer");
      if (container) {
        container.style.display = "none";
      }
    }
    /**
    * Configure l'écouteur de regard avec filtrage avancé
    */
    setupGazeListener() {
      console.log("\u{1F527} Configuration du listener de regard...");
      window.webgazer.setGazeListener((data, elapsedTime) => {
        if (data == null) {
          console.warn("\u26A0\uFE0F data null re\xE7ue");
          return;
        }
        if (Math.random() < 0.02) {
          console.log("\u{1F4CA} Donn\xE9es WebGazer brutes:", {
            x: data.x?.toFixed(0),
            y: data.y?.toFixed(0),
            left: data.left ? {
              x: data.left.x?.toFixed(1),
              y: data.left.y?.toFixed(1),
              area: data.left.area?.toFixed(3),
              confidence: data.left.confidence?.toFixed(2)
            } : null,
            right: data.right ? {
              x: data.right.x?.toFixed(1),
              y: data.right.y?.toFixed(1),
              area: data.right.area?.toFixed(3),
              confidence: data.right.confidence?.toFixed(2)
            } : null
          });
        }
        const smoothedX = this.kalmanX.update(data.x);
        const smoothedY = this.kalmanY.update(data.y);
        const leftEyeOpen = this.isEyeOpen(data.left);
        const rightEyeOpen = this.isEyeOpen(data.right);
        if (leftEyeOpen) this.leftEyeOpenCount++;
        else this.leftEyeOpenCount = Math.max(0, this.leftEyeOpenCount - 1);
        if (rightEyeOpen) this.rightEyeOpenCount++;
        else this.rightEyeOpenCount = Math.max(0, this.rightEyeOpenCount - 1);
        const confidence = this.calculateConfidence(data);
        this.previousGazeData = this.gazeData;
        this.gazeData = {
          x: smoothedX,
          y: smoothedY,
          timestamp: elapsedTime,
          leftEye: data.left ? {
            x: data.left.x,
            y: data.left.y,
            open: leftEyeOpen,
            confidence: data.left.confidence || 0.8
          } : null,
          rightEye: data.right ? {
            x: data.right.x,
            y: data.right.y,
            open: rightEyeOpen,
            confidence: data.right.confidence || 0.8
          } : null,
          confidence
        };
        this.gazeHistory.push({
          x: smoothedX,
          y: smoothedY,
          timestamp: Date.now()
        });
        if (this.gazeHistory.length > this.maxHistorySize) {
          this.gazeHistory.shift();
        }
        if (typeof window.onGazeUpdate === "function") {
          window.onGazeUpdate(this.gazeData);
        }
      });
    }
    /**
     * Détermine si un oeil est ouvert avec détection améliorée
     */
    isEyeOpen(eye) {
      if (!eye) return false;
      if (eye.confidence !== void 0) {
        return eye.confidence > 0.3;
      }
      if (eye.area !== void 0) {
        return eye.area > 0.15;
      }
      if (eye.x !== void 0 && eye.y !== void 0 && eye.x !== null && eye.y !== null) {
        if (eye.x === 0 && eye.y === 0) {
          return false;
        }
        return true;
      }
      return eye.x !== void 0 || eye.y !== void 0;
    }
    /**
     * Calcule la confiance du suivi oculaire
     */
    calculateConfidence(data) {
      let confidence = 0.8;
      if (data.left?.open && data.right?.open) {
        confidence += 0.1;
      }
      if (this.previousGazeData) {
        const dx = Math.abs(data.x - this.previousGazeData.x);
        const dy = Math.abs(data.y - this.previousGazeData.y);
        const distance = Math.sqrt(dx * dx + dy * dy);
        if (distance < 5) {
          confidence += 0.05;
        }
      }
      return Math.min(1, confidence);
    }
    /**
     * Détermine si les yeux sont ouverts
     */
    areEyesOpen() {
      if (!this.gazeData) return false;
      const leftOpen = this.gazeData.leftEye?.open ?? false;
      const rightOpen = this.gazeData.rightEye?.open ?? false;
      return leftOpen || rightOpen;
    }
    /**
     * Retourne l'état des yeux (0: fermés, 1: un œil, 2: deux yeux)
     */
    /**
     * Retourne l'état des yeux (0: fermés, 1: un œil, 2: deux yeux)
     * Méthode améliorée basée sur les données actuelles
     */
    getEyeState() {
      if (!this.gazeData) return 0;
      const hasGoodTracking = this.gazeData.confidence > 0.5;
      if (hasGoodTracking) {
        const leftOpen2 = this.gazeData.leftEye?.open ?? false;
        const rightOpen2 = this.gazeData.rightEye?.open ?? false;
        if (leftOpen2 && rightOpen2) return 2;
        if (leftOpen2 || rightOpen2) return 1;
        return 2;
      }
      const leftOpen = this.leftEyeOpenCount >= this.eyeStateBuffer;
      const rightOpen = this.rightEyeOpenCount >= this.eyeStateBuffer;
      if (leftOpen && rightOpen) return 2;
      if (leftOpen || rightOpen) return 1;
      return 0;
    }
    /**
     * Obtient la position actuelle du regard
     */
    getGazePosition() {
      if (!this.gazeData) return null;
      return {
        x: this.gazeData.x,
        y: this.gazeData.y
      };
    }
    /**
     * Calcule la stabilité du regard (variance)
     */
    getGazeStability() {
      if (this.gazeHistory.length < 5) return 0;
      const meanX = this.gazeHistory.reduce((sum, g) => sum + g.x, 0) / this.gazeHistory.length;
      const meanY = this.gazeHistory.reduce((sum, g) => sum + g.y, 0) / this.gazeHistory.length;
      const varianceX = this.gazeHistory.reduce((sum, g) => sum + Math.pow(g.x - meanX, 2), 0) / this.gazeHistory.length;
      const varianceY = this.gazeHistory.reduce((sum, g) => sum + Math.pow(g.y - meanY, 2), 0) / this.gazeHistory.length;
      const stdDev = Math.sqrt((varianceX + varianceY) / 2);
      return Math.max(0, 100 - stdDev);
    }
    /**
     * Ajoute un point de calibration
     */
    addCalibrationPoint(x, y) {
      if (!this.gazeData) {
        console.warn("Pas de donn\xE9es de regard disponibles - attente de WebGazer...");
        return false;
      }
      if (this.gazeData.x < 0 || this.gazeData.y < 0 || this.gazeData.x > window.innerWidth || this.gazeData.y > window.innerHeight) {
        console.warn("Donn\xE9es de regard invalides");
        return false;
      }
      this.calibrationPoints.push({
        screenX: x,
        screenY: y,
        gazeX: this.gazeData.x,
        gazeY: this.gazeData.y
      });
      console.log(`\u2713 Point de calibration ajout\xE9: (${x}, ${y}) -> (${this.gazeData.x.toFixed(0)}, ${this.gazeData.y.toFixed(0)})`);
      return true;
    }
    /**
     * Finalise la calibration
     */
    finalizeCalibration() {
      if (this.calibrationPoints.length < 5) {
        console.warn("Calibration incompl\xE8te");
        return false;
      }
      this.isCalibrated = true;
      console.log("\u2705 Calibration finalis\xE9e avec succ\xE8s");
      return true;
    }
    /**
     * Démarre le suivi du regard
     */
    startTracking() {
      this.isTracking = true;
    }
    /**
     * Arrête le suivi du regard
     */
    stopTracking() {
      this.isTracking = false;
      this.hideWebcamVideo();
    }
    /**
     * Arrête WebGazer
     */
    stop() {
      this.hideWebcamVideo();
      window.webgazer.end();
      this.isTracking = false;
    }
  };

  // src/targetDetector.ts
  var TargetDetector = class {
    constructor(canvasWidth, canvasHeight) {
      this.targetRadius = 30;
      this.vx = 5;
      this.vy = 5;
      this.gazeOnTarget = false;
      this.gazeStartTime = null;
      this.totalGazeTime = 0;
      this.gazeToleranceRadius = 60;
      this.fixations = [];
      this.currentFixation = null;
      this.gazeHistory = [];
      this.canvasWidth = canvasWidth;
      this.canvasHeight = canvasHeight;
      this.targetX = canvasWidth / 2;
      this.targetY = canvasHeight / 2;
      this.minX = this.targetRadius;
      this.maxX = canvasWidth - this.targetRadius;
      this.minY = this.targetRadius;
      this.maxY = canvasHeight - this.targetRadius;
    }
    /**
     * Met à jour la position de la cible
     */
    update() {
      this.targetX += this.vx;
      this.targetY += this.vy;
      if (this.targetX <= this.minX || this.targetX >= this.maxX) {
        this.vx *= -1;
      }
      if (this.targetY <= this.minY || this.targetY >= this.maxY) {
        this.vy *= -1;
      }
      this.targetX = Math.max(this.minX, Math.min(this.maxX, this.targetX));
      this.targetY = Math.max(this.minY, Math.min(this.maxY, this.targetY));
    }
    /**
     * Analyse le regard par rapport à la cible
     */
    updateGaze(gazePoint, eyesOpen, timestamp) {
      if (!gazePoint) {
        this.gazeOnTarget = false;
        return;
      }
      const distance = this.getDistance(
        gazePoint.x,
        gazePoint.y,
        this.targetX,
        this.targetY
      );
      const wasOnTarget = this.gazeOnTarget;
      this.gazeOnTarget = distance < this.gazeToleranceRadius && eyesOpen;
      if (this.gazeOnTarget && !wasOnTarget && eyesOpen) {
        this.gazeStartTime = timestamp;
        this.currentFixation = {
          startTime: timestamp,
          startX: this.targetX,
          startY: this.targetY,
          gazePoints: []
        };
      }
      if (this.gazeOnTarget && this.currentFixation) {
        const fixationDuration = timestamp - (this.gazeStartTime || 0);
        this.totalGazeTime = fixationDuration;
        this.currentFixation.gazePoints.push({
          x: gazePoint.x,
          y: gazePoint.y,
          timestamp
        });
      }
      if (!this.gazeOnTarget && wasOnTarget && this.currentFixation) {
        this.currentFixation.endTime = timestamp;
        this.currentFixation.duration = timestamp - this.currentFixation.startTime;
        this.fixations.push(this.currentFixation);
        this.currentFixation = null;
        this.gazeStartTime = null;
      }
      this.gazeHistory.push({
        x: gazePoint.x,
        y: gazePoint.y,
        targetX: this.targetX,
        targetY: this.targetY,
        onTarget: this.gazeOnTarget,
        timestamp
      });
      if (this.gazeHistory.length > 1e3) {
        this.gazeHistory.shift();
      }
    }
    /**
     * Calcule la distance euclidienne
     */
    getDistance(x1, y1, x2, y2) {
      return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
    }
    /**
     * Dessine la cible sur le canvas
     */
    draw(ctx) {
      ctx.fillStyle = "rgba(255, 100, 0, 0.8)";
      ctx.beginPath();
      ctx.arc(this.targetX, this.targetY, this.targetRadius, 0, Math.PI * 2);
      ctx.fill();
      if (this.gazeOnTarget) {
        ctx.strokeStyle = "rgba(0, 255, 0, 0.5)";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(
          this.targetX,
          this.targetY,
          this.gazeToleranceRadius,
          0,
          Math.PI * 2
        );
        ctx.stroke();
      }
      ctx.fillStyle = "white";
      ctx.beginPath();
      ctx.arc(
        this.targetX,
        this.targetY,
        this.targetRadius / 3,
        0,
        Math.PI * 2
      );
      ctx.fill();
    }
    /**
     * Obtient le statut du suivi
     */
    getStatus() {
      return {
        targetPosition: {
          x: this.targetX,
          y: this.targetY
        },
        gazeOnTarget: this.gazeOnTarget,
        totalGazeTime: this.totalGazeTime,
        fixationCount: this.fixations.length,
        gazeHistory: this.gazeHistory
      };
    }
    /**
     * Réinitialise la détection
     */
    reset() {
      this.gazeOnTarget = false;
      this.gazeStartTime = null;
      this.totalGazeTime = 0;
      this.fixations = [];
      this.currentFixation = null;
      this.gazeHistory = [];
      this.targetX = this.canvasWidth / 2 + (Math.random() - 0.5) * 200;
      this.targetY = this.canvasHeight / 2 + (Math.random() - 0.5) * 200;
    }
  };

  // src/components/screens.ts
  function renderNotifications() {
    const state = state_service_default.getState();
    return state.notifications.map(
      (notif) => `
        <div class="notification notification-${notif.type}">
            <span class="notification-message">${notif.message}</span>
            <button class="notification-close" onclick="document.querySelector('[data-notif-id=${notif.id}]').remove()">\xD7</button>
        </div>
    `
    ).join("");
  }
  function renderNavbar() {
    const state = state_service_default.getState();
    return `
        <div class="navbar-menu" id="navbarMenu">
            ${state.isAuthenticated ? `
                <span class="navbar-user">Connect\xE9 en tant que ${state.patient?.firstName}</span>
                <button class="btn btn-secondary" onclick="app.logout()">D\xE9connexion</button>
            ` : ""}
        </div>
    `;
  }
  function renderHomeScreen() {
    const state = state_service_default.getState();
    if (!state.isAuthenticated) {
      return `
            <div class="screen home-screen">
                <div class="container">
                    <h1>Syst\xE8me de Suivi Oculaire Clinique</h1>
                    <p class="subtitle">Pr\xE9cision et fiabilit\xE9 pour l'orthoptie</p>
                    
                    <div class="auth-forms">
                        <div class="form-container">
                            <h2>Connexion</h2>
                            <form id="loginForm">
                                <input type="text" placeholder="Nom d'utilisateur" id="loginUsername" required />
                                <input type="password" placeholder="Mot de passe" id="loginPassword" required />
                                <button type="submit" class="btn btn-primary">Se connecter</button>
                            </form>
                        </div>

                        <div class="form-container">
                            <h2>Inscription</h2>
                            <form id="registerForm">
                                <input type="text" placeholder="Nom d'utilisateur" id="regUsername" required />
                                <input type="email" placeholder="Email" id="regEmail" required />
                                <input type="password" placeholder="Mot de passe" id="regPassword" required />
                                <input type="text" placeholder="Pr\xE9nom" id="regFirstName" required />
                                <input type="text" placeholder="Nom" id="regLastName" required />
                                <input type="number" placeholder="\xC2ge" id="regAge" required />
                                <button type="submit" class="btn btn-primary">S'inscrire</button>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
    return `
        <div class="screen home-screen authenticated">
            <div class="container">
                <h1>Bienvenue, ${state.patient?.firstName} ${state.patient?.lastName}</h1>
                <p class="subtitle">S\xE9lectionnez une action</p>

                <div class="actions-grid">
                    <div class="action-card" onclick="app.goToScreen('calibration-screen')">
                        <h3>\u{1F3AF} Nouvelle Calibration</h3>
                        <p>Calibrer l'eye tracker pour une pr\xE9cision optimale</p>
                    </div>

                    <div class="action-card" onclick="app.goToScreen('test-screen')">
                        <h3>\u{1F50D} Nouveau Test</h3>
                        <p>Effectuer un test de suivi oculaire</p>
                    </div>

                    <div class="action-card" onclick="app.goToScreen('results-screen')">
                        <h3>\u{1F4CA} Mes R\xE9sultats</h3>
                        <p>Consulter les tests pr\xE9c\xE9dents</p>
                    </div>

                    <div class="action-card" onclick="app.goToScreen('statistics-screen')">
                        <h3>\u{1F4C8} Statistiques</h3>
                        <p>Analyse des tendances</p>
                    </div>
                </div>
            </div>
        </div>
    `;
  }
  function renderCalibrationScreen() {
    const state = state_service_default.getState();
    const calibrated = state.isCalibrated;
    return `
        <div class="screen calibration-screen">
            <div class="container">
                <h2>Calibration de l'Eye Tracker</h2>
                
                <div class="calibration-instructions">
                    <p>Veuillez suivre les points qui appara\xEEtront \xE0 l'\xE9cran.</p>
                    <p>Assurez-vous que votre cam\xE9ra web est activ\xE9e et que vous \xEAtes bien positionn\xE9.</p>
                </div>

                <div id="calibrationContainer" class="calibration-container">
                    <canvas id="calibrationCanvas" width="800" height="600"></canvas>
                </div>

                <div class="calibration-status">
                    <p>Points calibr\xE9s: ${state.calibrationPoints.length}/5</p>
                    ${calibrated ? '<p class="success">\u2713 Calibration r\xE9ussie!</p>' : ""}
                </div>

                <div class="button-group">
                    <button class="btn btn-primary" id="startCalibration">D\xE9marrer la calibration</button>
                    ${calibrated ? `<button class="btn btn-success" onclick="app.goToScreen('test-screen')">Continuer vers le test</button>` : ""}
                    <button class="btn btn-secondary" onclick="app.goToScreen('home-screen')">Retour</button>
                </div>
            </div>
        </div>
    `;
  }
  function renderTestScreen() {
    const state = state_service_default.getState();
    const testActive = !!state.currentTest;
    return `
        <div class="screen test-screen">
            <div class="container">
                <h2>Test de Suivi Oculaire</h2>

                <div id="testContainer" class="test-container">
                    <canvas id="testCanvas" width="1024" height="768"></canvas>
                </div>

                ${testActive ? `
                    <div class="test-stats">
                        <div class="stat">
                            <label>Dur\xE9e:</label>
                            <span id="testDuration">0s</span>
                        </div>
                        <div class="stat">
                            <label>Pourcentage de suivi:</label>
                            <span id="testTracking">0%</span>
                        </div>
                        <div class="stat">
                            <label>Fixations:</label>
                            <span id="testFixations">0</span>
                        </div>
                    </div>
                ` : ""}

                <div class="button-group">
                    ${!testActive ? '<button class="btn btn-primary" id="startTest">D\xE9marrer le test</button>' : '<button class="btn btn-danger" id="stopTest">Arr\xEAter le test</button>'}
                    <button class="btn btn-secondary" onclick="app.goToScreen('home-screen')">Retour</button>
                </div>
            </div>
        </div>
    `;
  }
  function renderResultsScreen() {
    const state = state_service_default.getState();
    return `
        <div class="screen results-screen">
            <div class="container">
                <div class="results-header">
                    <div class="results-title-section">
                        <h2>\u{1F4CA} Mes R\xE9sultats de Tests</h2>
                        <p class="results-subtitle">Historique complet de vos tests de suivi oculaire</p>
                    </div>
                    <div class="results-stats-summary">
                        <div class="stat-box">
                            <span class="stat-number">${state.testResults.length}</span>
                            <span class="stat-label">Tests</span>
                        </div>
                        <div class="stat-box">
                            <span class="stat-number">${state.testResults.length > 0 ? (state.testResults.reduce((sum, t) => sum + t.tracking_percentage, 0) / state.testResults.length).toFixed(1) : 0}%</span>
                            <span class="stat-label">Suivi moyen</span>
                        </div>
                    </div>
                </div>

                ${state.testResults.length === 0 ? `
                    <div class="empty-state">
                        <div class="empty-icon">\u{1F4ED}</div>
                        <h3>Aucun test disponible</h3>
                        <p>Commencez par effectuer un test pour voir vos r\xE9sultats ici</p>
                        <button class="btn btn-primary" onclick="app.goToScreen('test-screen')">Nouveau Test</button>
                    </div>
                ` : `
                    <div class="results-filters">
                        <div class="filter-group">
                            <label>Trier par:</label>
                            <select id="sortResults">
                                <option value="recent">Plus r\xE9cents d'abord</option>
                                <option value="oldest">Plus anciens d'abord</option>
                                <option value="best">Meilleur r\xE9sultat</option>
                                <option value="worst">Moins bon r\xE9sultat</option>
                            </select>
                        </div>
                    </div>

                    <div class="results-list">
                        ${state.testResults.sort((a, b) => new Date(b.test_date).getTime() - new Date(a.test_date).getTime()).map((result, index) => {
      const date = new Date(result.test_date);
      const timeAgo = getTimeAgo(date);
      return `
                            <div class="result-card result-${result.result}" data-result-id="${result.id}">
                                <div class="result-card-inner">
                                    <div class="result-visual">
                                        <div class="result-icon result-${result.result}">
                                            ${getResultIcon(result.result)}
                                        </div>
                                    </div>
                                    
                                    <div class="result-content">
                                        <div class="result-header">
                                            <h3>Test #${index + 1} - ${state.patient?.firstName} ${state.patient?.lastName}</h3>
                                            <span class="result-badge result-${result.result}">${result.result.toUpperCase()}</span>
                                        </div>
                                        
                                        <div class="result-time">
                                            <span class="time-date">${date.toLocaleDateString("fr-FR")}</span>
                                            <span class="time-ago">${timeAgo}</span>
                                        </div>
                                        
                                        <div class="result-metrics">
                                            <div class="metric">
                                                <span class="metric-icon">\u23F1\uFE0F</span>
                                                <div class="metric-content">
                                                    <span class="metric-label">Dur\xE9e</span>
                                                    <span class="metric-value">${result.duration.toFixed(1)}s</span>
                                                </div>
                                            </div>
                                            <div class="metric">
                                                <span class="metric-icon">\u{1F441}\uFE0F</span>
                                                <div class="metric-content">
                                                    <span class="metric-label">Suivi</span>
                                                    <span class="metric-value">${result.tracking_percentage.toFixed(1)}%</span>
                                                </div>
                                            </div>
                                            <div class="metric">
                                                <span class="metric-icon">\u{1F440}</span>
                                                <div class="metric-content">
                                                    <span class="metric-label">Regard</span>
                                                    <span class="metric-value">${result.gaze_time.toFixed(1)}s</span>
                                                </div>
                                            </div>
                                            <div class="metric">
                                                <span class="metric-icon">\u{1F4CD}</span>
                                                <div class="metric-content">
                                                    <span class="metric-label">Fixations</span>
                                                    <span class="metric-value">${result.fixation_count}</span>
                                                </div>
                                            </div>
                                        </div>
                                        
                                        <div class="result-progress">
                                            <div class="progress-bar">
                                                <div class="progress-fill" style="width: ${result.tracking_percentage}%"></div>
                                            </div>
                                            <span class="progress-label">Pr\xE9cision du suivi</span>
                                        </div>
                                    </div>
                                    
                                    <div class="result-actions">
                                        <button class="btn btn-sm btn-primary" onclick="app.viewTest(${result.id})">D\xE9tails</button>
                                        <button class="btn btn-sm btn-secondary" onclick="app.exportTestPDF(${result.id})">\u{1F4E5} PDF</button>
                                    </div>
                                </div>
                            </div>
                        `;
    }).join("")}
                    </div>

                    <div class="results-footer">
                        <button class="btn btn-lg btn-primary" onclick="app.exportAllTestsPDF()">\u{1F4E5} Exporter tous les r\xE9sultats</button>
                        <button class="btn btn-lg btn-secondary" onclick="app.goToScreen('statistics-screen')">\u{1F4C8} Voir les statistiques</button>
                    </div>
                `}

                <div class="button-group">
                    <button class="btn btn-secondary" onclick="app.goToScreen('home-screen')">\u2190 Retour</button>
                </div>
            </div>
        </div>
    `;
  }
  function getResultIcon(result) {
    switch (result) {
      case "excellent":
        return "\u2B50";
      case "good":
        return "\u2713";
      case "acceptable":
        return "\u26A0\uFE0F";
      case "poor":
        return "\u2717";
      default:
        return "?";
    }
  }
  function getTimeAgo(date) {
    const now = /* @__PURE__ */ new Date();
    const diff = now.getTime() - date.getTime();
    const seconds = Math.floor(diff / 1e3);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    if (days > 0) return `il y a ${days} jour${days > 1 ? "s" : ""}`;
    if (hours > 0) return `il y a ${hours}h`;
    if (minutes > 0) return `il y a ${minutes}min`;
    return "\xE0 l'instant";
  }
  function renderStatisticsScreen() {
    const state = state_service_default.getState();
    const stats = state.statistics;
    return `
        <div class="screen statistics-screen">
            <div class="container">
                <h2>Statistiques</h2>

                ${!stats ? "<p>Aucune statistique disponible.</p>" : `
                    <div class="statistics-grid">
                        <div class="stat-card">
                            <h3>Tests effectu\xE9s</h3>
                            <p class="stat-value">${stats.total_tests || 0}</p>
                        </div>

                        <div class="stat-card">
                            <h3>Suivi moyen</h3>
                            <p class="stat-value">${(stats.avg_tracking || 0).toFixed(1)}%</p>
                        </div>

                        <div class="stat-card">
                            <h3>Meilleur r\xE9sultat</h3>
                            <p class="stat-value">${stats.best_result || "-"}</p>
                        </div>

                        <div class="stat-card">
                            <h3>Stabilit\xE9 moyenne</h3>
                            <p class="stat-value">${(stats.avg_stability || 0).toFixed(2)}</p>
                        </div>
                    </div>
                `}

                <div class="button-group">
                    <button class="btn btn-secondary" onclick="app.goToScreen('home-screen')">Retour</button>
                </div>
            </div>
        </div>
    `;
  }

  // src/app-professional.ts
  var EyeTrackingApp = class {
    constructor() {
      this.eyeTracker = null;
      this.targetDetector = null;
      // private distanceEstimator: DistanceEstimator | null = null;
      // private testAnalyzer: TestAnalyzer | null = null;
      this.testActive = false;
      this.createWebGazerContainer();
      this.init();
    }
    /**
     * Crée le container pour WebGazer
     */
    createWebGazerContainer() {
      if (!document.getElementById("webgazerVideoContainer")) {
        const container = document.createElement("div");
        container.id = "webgazerVideoContainer";
        document.body.appendChild(container);
      }
    }
    /**
     * Initialise l'application
     */
    async init() {
      console.log("\u{1F680} Initialisation de l'application...");
      if (api_service_default.isAuthenticated()) {
        try {
          const patient = await api_service_default.getPatient();
          state_service_default.setPatient(patient);
          state_service_default.addNotification("Connect\xE9 avec succ\xE8s!", "success");
        } catch (error) {
          console.error("Erreur de r\xE9cup\xE9ration du patient:", error);
          api_service_default.logout();
        }
      }
      await this.initializeEyeTracking();
      this.setupEventListeners();
      this.render();
      state_service_default.subscribe(() => this.render());
    }
    /**
     * Initialise les modules de suivi oculaire
     */
    async initializeEyeTracking() {
      try {
        this.eyeTracker = new EyeTracker();
        this.targetDetector = new TargetDetector(800, 600);
        await this.eyeTracker.initialize();
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
                        border: 3px solid #0066cc !important;
                        box-shadow: 0 4px 15px rgba(0, 102, 204, 0.4) !important;
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
        console.log("\u2705 Modules eye tracking initialis\xE9s");
      } catch (error) {
        console.error("Erreur lors de l'initialisation:", error);
        state_service_default.addNotification(
          "Erreur: impossible d'initialiser le eye tracker",
          "error"
        );
      }
    }
    /**
     * Configure les event listeners
     */
    setupEventListeners() {
      document.addEventListener("submit", (e) => {
        if (!(e.target instanceof HTMLFormElement)) {
          return;
        }
        const form = e.target;
        if (form.id === "loginForm") {
          e.preventDefault();
          this.handleLogin(form);
        } else if (form.id === "registerForm") {
          e.preventDefault();
          this.handleRegister(form);
        }
      });
      document.addEventListener("click", (e) => {
        const target = e.target;
        if (target.id === "startCalibration") {
          this.startCalibration();
        } else if (target.id === "startTest") {
          this.startTest();
        } else if (target.id === "stopTest") {
          this.stopTest();
        }
      });
    }
    /**
     * Gère la connexion
     */
    async handleLogin(form) {
      try {
        const usernameElement = form.querySelector("#loginUsername");
        const passwordElement = form.querySelector("#loginPassword");
        if (!usernameElement || !passwordElement) {
          state_service_default.addNotification("Erreur: \xC9l\xE9ments du formulaire non trouv\xE9s", "error");
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
        state_service_default.addNotification("Connexion r\xE9ussie!", "success");
        this.goToScreen("home-screen");
        form.reset();
      } catch (error) {
        state_service_default.addNotification(
          `Erreur de connexion: ${error instanceof Error ? error.message : "Erreur inconnue"}`,
          "error"
        );
      }
    }
    /**
     * Gère l'inscription
     */
    async handleRegister(form) {
      try {
        const usernameElement = form.querySelector("#regUsername");
        const emailElement = form.querySelector("#regEmail");
        const passwordElement = form.querySelector("#regPassword");
        const firstNameElement = form.querySelector("#regFirstName");
        const lastNameElement = form.querySelector("#regLastName");
        const ageElement = form.querySelector("#regAge");
        if (!usernameElement || !emailElement || !passwordElement || !firstNameElement || !lastNameElement || !ageElement) {
          state_service_default.addNotification("Erreur: \xC9l\xE9ments du formulaire non trouv\xE9s", "error");
          return;
        }
        const username = usernameElement.value;
        const email = emailElement.value;
        const password = passwordElement.value;
        const firstName = firstNameElement.value;
        const lastName = lastNameElement.value;
        const age = parseInt(ageElement.value);
        const response = await api_service_default.register(
          username,
          email,
          password,
          firstName,
          lastName,
          age
        );
        state_service_default.setPatient({
          id: response.user_id,
          username: response.username,
          email: response.email,
          firstName,
          lastName,
          age
        });
        state_service_default.addNotification(
          "Inscription r\xE9ussie! Bienvenue!",
          "success"
        );
        this.goToScreen("home-screen");
        form.reset();
      } catch (error) {
        state_service_default.addNotification(
          `Erreur d'inscription: ${error instanceof Error ? error.message : "Erreur inconnue"}`,
          "error"
        );
      }
    }
    /**
     * Démarre la calibration
     */
    async startCalibration() {
      if (!this.eyeTracker) {
        state_service_default.addNotification("Eye tracker non disponible", "error");
        return;
      }
      try {
        state_service_default.addNotification("D\xE9marrage de la calibration...", "info");
      } catch (error) {
        state_service_default.addNotification(
          `Erreur de calibration: ${error instanceof Error ? error.message : "Erreur inconnue"}`,
          "error"
        );
      }
    }
    /**
     * Démarre un test
     */
    async startTest() {
      if (!this.eyeTracker || !this.targetDetector) {
        state_service_default.addNotification("Eye tracker non disponible", "error");
        return;
      }
      try {
        state_service_default.startNewTest();
        this.testActive = true;
        state_service_default.addNotification("Test d\xE9marr\xE9!", "success");
      } catch (error) {
        state_service_default.addNotification(
          `Erreur du test: ${error instanceof Error ? error.message : "Erreur inconnue"}`,
          "error"
        );
        this.testActive = false;
      }
    }
    /**
     * Arrête le test
     */
    async stopTest() {
      if (!this.testActive) return;
      try {
        const testData = state_service_default.finishCurrentTest();
        if (testData) {
          const result = await api_service_default.createTest({
            patient_id: window.__selectedPatientId,
            duration: testData.totalTime,
            gaze_time: testData.gazeTime,
            tracking_percentage: testData.trackingPercentage,
            fixation_count: testData.fixationCount,
            avg_fixation_duration: testData.avgFixationDuration,
            max_fixation_duration: testData.avgFixationDuration,
            min_fixation_duration: testData.avgFixationDuration,
            gaze_stability: testData.gazeStability || 0.5,
            gaze_consistency: testData.gazeConsistency || 0.5,
            raw_data: testData.rawData
          });
          state_service_default.addTestResult(result);
          state_service_default.addNotification("Test enregistr\xE9 avec succ\xE8s!", "success");
          this.goToScreen("results-screen");
        }
        this.testActive = false;
      } catch (error) {
        state_service_default.addNotification(
          `Erreur: ${error instanceof Error ? error.message : "Erreur inconnue"}`,
          "error"
        );
        this.testActive = false;
      }
    }
    /**
     * Charge et affiche les résultats des tests
     */
    async loadResults() {
      try {
        state_service_default.addNotification("Chargement des r\xE9sultats...", "info");
        const tests = await api_service_default.getTests();
        tests.forEach((test) => state_service_default.addTestResult(test));
        this.goToScreen("results-screen");
      } catch (error) {
        state_service_default.addNotification(
          `Erreur: ${error instanceof Error ? error.message : "Erreur inconnue"}`,
          "error"
        );
      }
    }
    /**
     * Affiche les détails d'un test spécifique
     */
    async viewTest(testId) {
      try {
        const test = await api_service_default.getTest(testId);
        console.log("D\xE9tails du test:", test);
        state_service_default.addNotification(`Test #${testId} charg\xE9`, "success");
      } catch (error) {
        state_service_default.addNotification(
          `Erreur: ${error instanceof Error ? error.message : "Erreur inconnue"}`,
          "error"
        );
      }
    }
    /**
     * Exporte un test en PDF
     */
    async exportTestPDF(testId) {
      try {
        state_service_default.addNotification("G\xE9n\xE9ration du PDF...", "info");
        const blob = await api_service_default.exportTestPDF(testId);
        this.downloadBlob(blob, `test_${testId}.pdf`);
        state_service_default.addNotification("PDF t\xE9l\xE9charg\xE9 avec succ\xE8s!", "success");
      } catch (error) {
        state_service_default.addNotification(
          `Erreur: ${error instanceof Error ? error.message : "Erreur inconnue"}`,
          "error"
        );
      }
    }
    /**
     * Exporte tous les tests en PDF
     */
    async exportAllTestsPDF() {
      try {
        state_service_default.addNotification("G\xE9n\xE9ration du PDF complet...", "info");
        const blob = await api_service_default.exportAllTestsPDF();
        this.downloadBlob(blob, "tous_les_tests.pdf");
        state_service_default.addNotification("PDF t\xE9l\xE9charg\xE9 avec succ\xE8s!", "success");
      } catch (error) {
        state_service_default.addNotification(
          `Erreur: ${error instanceof Error ? error.message : "Erreur inconnue"}`,
          "error"
        );
      }
    }
    /**
     * Utilitaire pour télécharger un blob en tant que fichier
     */
    downloadBlob(blob, filename) {
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
    /**
     * Navigue vers un écran
     */
    goToScreen(screenName) {
      state_service_default.setScreen(screenName);
    }
    /**
     * Déconnecte l'utilisateur
     */
    logout() {
      api_service_default.logout();
      state_service_default.reset();
      state_service_default.addNotification("D\xE9connect\xE9!", "info");
      this.goToScreen("home-screen");
    }
    /**
     * Affiche l'application
     */
    render() {
      const app2 = document.getElementById("app");
      if (!app2) return;
      const state = state_service_default.getState();
      let screenContent = "";
      switch (state.currentScreen) {
        case "home-screen":
          screenContent = renderHomeScreen();
          break;
        case "calibration-screen":
          screenContent = renderCalibrationScreen();
          break;
        case "test-screen":
          screenContent = renderTestScreen();
          break;
        case "results-screen":
          screenContent = renderResultsScreen();
          break;
        case "statistics-screen":
          screenContent = renderStatisticsScreen();
          break;
        default:
          screenContent = renderHomeScreen();
      }
      app2.innerHTML = `
            ${renderNavbar()}
            ${screenContent}
            ${renderNotifications()}
        `;
      this.setupEventListeners();
    }
  };
  var app = new EyeTrackingApp();
  window.app = app;
  var app_professional_default = app;
})();
