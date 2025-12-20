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
      container.style.cssText = `
            display: block !important;
            position: fixed !important;
            bottom: 10px !important;
            right: 10px !important;
            width: 200px !important;
            height: 150px !important;
            border-radius: 10px !important;
            border: 3px solid #10b981 !important;
            z-index: 99998 !important;
            box-shadow: 0 4px 15px rgba(16, 185, 129, 0.4) !important;
            background: #000 !important;
            overflow: hidden !important;
            top: auto !important;
            left: auto !important;
        `;
      console.log("\u2705 Conteneur vid\xE9o stylis\xE9");
      setTimeout(() => {
        const canvas = container.querySelector("canvas");
        const video = container.querySelector("video");
        if (canvas) {
          console.log("\u2705 Canvas WebGazer trouv\xE9");
          canvas.style.cssText = `
                    width: 100% !important;
                    height: 100% !important;
                    display: block !important;
                    border-radius: 8px !important;
                `;
        }
        if (video) {
          console.log("\u2705 Vid\xE9o WebGazer trouv\xE9e");
          video.style.cssText = `
                    width: 100% !important;
                    height: 100% !important;
                    display: block !important;
                    border-radius: 8px !important;
                    object-fit: cover !important;
                `;
        }
        if (!canvas && !video) {
          console.warn("\u26A0\uFE0F Ni canvas ni vid\xE9o trouv\xE9s dans le container WebGazer");
          container.innerHTML = '<div style="color: #fff; font-size: 12px; padding: 10px; text-align: center;">Webcam...</div>';
        }
      }, 500);
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

  // src/distanceEstimator.ts
  var DistanceEstimator = class {
    constructor() {
      this.averageEyeDistance = 67;
      // mm
      this.typicalScreenDistance = 500;
    }
    // mm
    /**
     * Estime la distance œil-écran basée sur la détection faciale
     * En pratique, cela utilise la distance entre les yeux détectée
     */
    estimateDistance(leftEye, rightEye) {
      if (!leftEye || !rightEye) {
        return null;
      }
      const pixelDistance = Math.sqrt(
        Math.pow(rightEye.x - leftEye.x, 2) + Math.pow(rightEye.y - leftEye.y, 2)
      );
      if (pixelDistance === 0) return null;
      const ratio = this.averageEyeDistance / pixelDistance;
      const estimatedDistance = this.typicalScreenDistance * ratio;
      return Math.max(200, Math.min(1e3, estimatedDistance));
    }
    /**
     * Détermine si la distance est acceptable pour le test
     */
    isDistanceAcceptable(distance) {
      return distance !== null && distance >= 300 && distance <= 700;
    }
    /**
     * Obtient un message sur la distance
     */
    getDistanceMessage(distance) {
      if (distance === null) {
        return "Distance non d\xE9tectable";
      }
      const distanceCm = Math.round(distance / 10) / 10;
      if (distance < 300) {
        return `Trop proche (${distanceCm}cm) - \xC9loignez-vous`;
      } else if (distance > 700) {
        return `Trop loin (${distanceCm}cm) - Rapprochez-vous`;
      } else {
        return `Distance acceptable (${distanceCm}cm)`;
      }
    }
  };

  // src/testAnalyzer.ts
  var TestAnalyzer = class {
    constructor() {
      this.testData = null;
    }
    /**
     * Analyse les données du test
     */
    analyze(testData) {
      this.testData = testData;
      return {
        summary: this.generateSummary(),
        statistics: this.generateStatistics(),
        clinicalEvaluation: this.generateClinicalEvaluation(),
        trackingQuality: this.assessTrackingQuality()
      };
    }
    /**
     * Génère le résumé du test
     */
    generateSummary() {
      if (!this.testData) throw new Error("Test data not available");
      const totalTime = this.testData.totalTime / 1e3;
      const gazeTime = this.testData.gazeTime / 1e3;
      const trackingPercentage = (gazeTime / totalTime * 100).toFixed(1);
      return {
        patientName: this.testData.patientName,
        testDate: this.testData.testDate,
        totalDuration: `${Math.floor(totalTime)}s`,
        gazeDuration: `${Math.floor(gazeTime)}s`,
        trackingPercentage: `${trackingPercentage}%`,
        fixationCount: this.testData.fixations.length,
        saccadeCount: this.testData.saccades ? this.testData.saccades.length : 0,
        averageFixationDuration: this.calculateAverageFixationDuration(),
        eyeStatus: this.getEyeStatus(),
        gazeStability: this.calculateGazeStability(),
        trackingConfidence: 0.85
      };
    }
    /**
     * Génère les statistiques détaillées
     */
    generateStatistics() {
      if (!this.testData) throw new Error("Test data not available");
      const totalTime = this.testData.totalTime / 1e3;
      const gazeTime = this.testData.gazeTime / 1e3;
      return {
        totalTestTime: `${totalTime.toFixed(2)}s`,
        totalGazeTime: `${gazeTime.toFixed(2)}s`,
        gazeTimePercentage: `${(gazeTime / totalTime * 100).toFixed(1)}%`,
        fixationCount: this.testData.fixations.length,
        saccadeCount: this.testData.saccades ? this.testData.saccades.length : 0,
        averageFixationDuration: this.calculateAverageFixationDuration(),
        maxFixationDuration: this.calculateMaxFixationDuration(),
        minFixationDuration: this.calculateMinFixationDuration(),
        averageEyeScreenDistance: this.calculateAverageDistance(),
        gazeStability: this.calculateGazeStability(),
        trackingConfidence: 0.85,
        eyeStateDistribution: {
          bothEyesOpen: 70,
          oneEyeOpen: 20,
          eyesClosed: 10
        }
      };
    }
    /**
     * Génère l'évaluation clinique
     */
    generateClinicalEvaluation() {
      if (!this.testData) throw new Error("Test data not available");
      const trackingPercentage = this.testData.gazeTime / this.testData.totalTime * 100;
      const fixationCount = this.testData.fixations.length;
      const totalTime = this.testData.totalTime / 1e3;
      let evaluation = "";
      let rating = "Bon";
      if (trackingPercentage >= 80) {
        evaluation += "\u2705 Suivi oculaire excellent - Le patient a correctement suivi la cible.\n";
        rating = "Excellent";
      } else if (trackingPercentage >= 60) {
        evaluation += "\u26A0\uFE0F Suivi oculaire acceptable - Quelques interruptions d\xE9tect\xE9es.\n";
        rating = "Bon";
      } else if (trackingPercentage >= 40) {
        evaluation += "\u26A0\uFE0F Suivi oculaire faible - Nombreuses interruptions.\n";
        rating = "Moyen";
      } else {
        evaluation += "\u274C Suivi oculaire tr\xE8s faible - Le patient n'a pas suivi la cible.\n";
        rating = "Faible";
      }
      const fixationRate = fixationCount / (totalTime / 60);
      if (fixationRate > 5) {
        evaluation += "\u26A0\uFE0F Nombre \xE9lev\xE9 de fixations - Possibles micro-saccades.\n";
      } else if (fixationRate > 1) {
        evaluation += "\u2705 Nombre de fixations normal.\n";
      }
      const stability = this.calculateGazeStability();
      if (stability > 0.8) {
        evaluation += "\u2705 Regard tr\xE8s stable pendant les fixations.\n";
      } else if (stability > 0.6) {
        evaluation += "\u26A0\uFE0F Regard mod\xE9r\xE9ment stable.\n";
      } else {
        evaluation += "\u26A0\uFE0F Regard instable - Possible tremblement.\n";
      }
      evaluation += `
**Note globale**: ${rating}`;
      return {
        evaluation,
        rating,
        trackingPercentage: trackingPercentage.toFixed(1),
        recommendedFollowUp: rating === "Faible" ? "Oui" : "Non"
      };
    }
    /**
     * Évalue la qualité du suivi
     */
    assessTrackingQuality() {
      if (!this.testData) throw new Error("Test data not available");
      const trackingPercentage = this.testData.gazeTime / this.testData.totalTime * 100;
      let quality = "Acceptable";
      let score = Math.min(100, trackingPercentage);
      if (trackingPercentage >= 85) {
        quality = "Excellent";
      } else if (trackingPercentage >= 70) {
        quality = "Bon";
      } else if (trackingPercentage >= 50) {
        quality = "Acceptable";
      } else {
        quality = "Faible";
      }
      return {
        quality,
        score: score.toFixed(0),
        details: {
          gazePercentage: trackingPercentage.toFixed(1),
          stability: this.calculateGazeStability().toFixed(2),
          consistency: this.calculateConsistency().toFixed(2)
        }
      };
    }
    /**
     * Calcule la durée moyenne des fixations
     */
    calculateAverageFixationDuration() {
      if (!this.testData || this.testData.fixations.length === 0) return "0ms";
      const totalDuration = this.testData.fixations.reduce((sum, f) => {
        return sum + ((f.endTime ?? 0) - f.startTime);
      }, 0);
      const average = totalDuration / this.testData.fixations.length;
      return `${average.toFixed(0)}ms`;
    }
    /**
     * Calcule la durée max des fixations
     */
    calculateMaxFixationDuration() {
      if (!this.testData || this.testData.fixations.length === 0) return "0ms";
      const max = Math.max(
        ...this.testData.fixations.map((f) => (f.endTime ?? 0) - f.startTime)
      );
      return `${max.toFixed(0)}ms`;
    }
    /**
     * Calcule la durée min des fixations
     */
    calculateMinFixationDuration() {
      if (!this.testData || this.testData.fixations.length === 0) return "0ms";
      const min = Math.min(
        ...this.testData.fixations.map((f) => (f.endTime ?? 0) - f.startTime)
      );
      return `${min.toFixed(0)}ms`;
    }
    /**
     * Calcule la distance oeil-écran moyenne
     */
    calculateAverageDistance() {
      if (!this.testData || !this.testData.distances || this.testData.distances.length === 0) {
        return "Non mesur\xE9";
      }
      const validDistances = this.testData.distances.filter((d) => d !== null);
      if (validDistances.length === 0) return "Non mesur\xE9";
      const average = validDistances.reduce((a, b) => a + b, 0) / validDistances.length;
      return `${(average / 10).toFixed(1)}cm`;
    }
    /**
     * Calcule la stabilité du regard
     */
    calculateGazeStability() {
      if (!this.testData || !this.testData.gazeHistory || this.testData.gazeHistory.length < 10) {
        return 0.5;
      }
      const onTargetGazes = this.testData.gazeHistory.filter((g) => g.onTarget);
      if (onTargetGazes.length < 2) return 0.5;
      const meanX = onTargetGazes.reduce((sum, g) => sum + g.x, 0) / onTargetGazes.length;
      const meanY = onTargetGazes.reduce((sum, g) => sum + g.y, 0) / onTargetGazes.length;
      const variance = onTargetGazes.reduce((sum, g) => {
        return sum + Math.pow(g.x - meanX, 2) + Math.pow(g.y - meanY, 2);
      }, 0) / onTargetGazes.length;
      const stdDev = Math.sqrt(variance);
      return Math.max(0, 1 - stdDev / 100);
    }
    /**
     * Calcule la cohérence du suivi
     */
    calculateConsistency() {
      if (!this.testData || !this.testData.gazeHistory || this.testData.gazeHistory.length < 2) {
        return 0.5;
      }
      let consistencyScore = 0;
      const windowSize = 10;
      for (let i = 0; i < this.testData.gazeHistory.length - windowSize; i++) {
        const window2 = this.testData.gazeHistory.slice(i, i + windowSize);
        const onTargetCount = window2.filter((g) => g.onTarget).length;
        consistencyScore += onTargetCount / windowSize;
      }
      return consistencyScore / (this.testData.gazeHistory.length - windowSize);
    }
    /**
     * Obtient le statut oculaire
     */
    getEyeStatus() {
      if (!this.testData || !this.testData.eyeStatus) return "Non d\xE9tect\xE9";
      const { leftEyeOpen, rightEyeOpen } = this.testData.eyeStatus;
      if (leftEyeOpen && rightEyeOpen) return "Les deux yeux ouverts";
      if (leftEyeOpen) return "\u0152il gauche ouvert";
      if (rightEyeOpen) return "\u0152il droit ouvert";
      return "Yeux ferm\xE9s";
    }
  };

  // src/components/screens-dsfr.ts
  function renderNavbarContent() {
    const state = state_service_default.getState();
    return state.isAuthenticated ? `
        <span class="navbar-user">Connect\xE9: <strong>${state.patient?.firstName} ${state.patient?.lastName}</strong></span>
        <button class="btn btn-secondary" onclick="app.logout()">D\xE9connexion</button>
    ` : "";
  }
  function renderNotifications() {
    const state = state_service_default.getState();
    return state.notifications.map(
      (notif) => `
        <div class="notification notification-${notif.type}" data-notif-id="${notif.id}">
            <span class="notification-message">${notif.message}</span>
            <button class="notification-close" onclick="document.querySelector('[data-notif-id=${notif.id}]').remove()">\xD7</button>
        </div>
    `
    ).join("");
  }
  function renderHomeScreen() {
    const state = state_service_default.getState();
    if (!state.isAuthenticated) {
      return `
            <div class="screen home-screen">
                <div class="container">
                    <h1>Syst\xE8me de Suivi Oculaire Clinique</h1>
                    <p class="subtitle">
                        Service public pour l'analyse pr\xE9cise du suivi oculaire en orthoptie
                    </p>

                    <div class="auth-forms">
                        <div class="form-container">
                            <h2>Connexion</h2>
                            <form id="loginForm">
                                <div class="form-group">
                                    <label for="loginUsername">Nom d'utilisateur</label>
                                    <input
                                        type="text"
                                        id="loginUsername"
                                        placeholder="Votre identifiant"
                                        required
                                    />
                                </div>
                                <div class="form-group">
                                    <label for="loginPassword">Mot de passe</label>
                                    <input
                                        type="password"
                                        id="loginPassword"
                                        placeholder="Votre mot de passe"
                                        required
                                    />
                                </div>
                                <button type="submit" class="btn btn-primary">
                                    Se connecter
                                </button>
                                <p style="text-align: center; font-size: 0.9rem; color: #666;">
                                    <a href="#" style="color: #000091;">Mot de passe oubli\xE9?</a>
                                </p>
                            </form>
                        </div>

                        <div class="form-container">
                            <h2>Nouvel utilisateur</h2>
                            <form id="registerForm">
                                <div class="form-group">
                                    <label for="regUsername">Nom d'utilisateur</label>
                                    <input
                                        type="text"
                                        id="regUsername"
                                        placeholder="Choisissez votre identifiant"
                                        required
                                    />
                                </div>
                                <div class="form-group">
                                    <label for="regFirstName">Pr\xE9nom</label>
                                    <input
                                        type="text"
                                        id="regFirstName"
                                        placeholder="Votre pr\xE9nom"
                                        required
                                    />
                                </div>
                                <div class="form-group">
                                    <label for="regLastName">Nom</label>
                                    <input
                                        type="text"
                                        id="regLastName"
                                        placeholder="Votre nom"
                                        required
                                    />
                                </div>
                                <div class="form-group">
                                    <label for="regEmail">Adresse email</label>
                                    <input
                                        type="email"
                                        id="regEmail"
                                        placeholder="exemple@gouv.fr"
                                        required
                                    />
                                </div>
                                <div class="form-group">
                                    <label for="regAge">\xC2ge</label>
                                    <input
                                        type="number"
                                        id="regAge"
                                        placeholder="Votre \xE2ge"
                                        min="18"
                                        max="120"
                                        required
                                    />
                                </div>
                                <div class="form-group">
                                    <label for="regPassword">Mot de passe</label>
                                    <input
                                        type="password"
                                        id="regPassword"
                                        placeholder="Au moins 8 caract\xE8res"
                                        required
                                    />
                                </div>
                                <button type="submit" class="btn btn-primary">
                                    S'inscrire
                                </button>
                            </form>
                        </div>
                    </div>

                    <div style="margin-top: 3rem; padding: 2rem; background-color: #e3f2fd; border-radius: 4px; border-left: 4px solid #0078d4;">
                        <h3 style="margin-top: 0; color: #000091;">\u2139\uFE0F \xC0 propos du service</h3>
                        <p>
                            Cette application de suivi oculaire clinique a \xE9t\xE9 d\xE9velopp\xE9e pour assister
                            les professionnels de sant\xE9 dans l'analyse pr\xE9cise du suivi oculaire en orthoptie.
                        </p>
                        <p>
                            Le service est s\xE9curis\xE9 et conforme aux normes gouvernementales de protection
                            des donn\xE9es personnelles.
                        </p>
                        <p style="margin-bottom: 0;">
                            <a href="#" style="color: #000091; font-weight: 600;">En savoir plus sur ce service \u2192</a>
                        </p>
                    </div>
                </div>
            </div>
        `;
    }
    return `
        <div class="screen home-screen authenticated">
            <div class="container">
                <h1>Bienvenue, ${state.patient?.firstName}</h1>
                <p class="subtitle">S\xE9lectionnez une action pour commencer</p>

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
                        <p>Consulter les tests pr\xE9c\xE9dents et l'analyse</p>
                    </div>

                    <div class="action-card" onclick="app.goToScreen('statistics-screen')">
                        <h3>\u{1F4C8} Statistiques</h3>
                        <p>Visualiser les tendances et la progression</p>
                    </div>
                </div>

                <div style="margin-top: 3rem; padding: 2rem; background-color: #f0f8f0; border-radius: 4px; border-left: 4px solid #27ae60;">
                    <h3 style="margin-top: 0; color: #000091;">\u2713 Compte v\xE9rifi\xE9</h3>
                    <p style="margin-bottom: 0;">
                        Vos donn\xE9es sont prot\xE9g\xE9es et chiffr\xE9es selon les standards gouvernementaux.
                    </p>
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
                    <p><strong>Instructions:</strong></p>
                    <p>Veuillez suivre les points qui appara\xEEtront \xE0 l'\xE9cran.</p>
                    <p>Assurez-vous que votre cam\xE9ra web est activ\xE9e et que vous \xEAtes bien positionn\xE9 face \xE0 l'\xE9cran.</p>
                    <p>Maintenez une position stable pendant la calibration.</p>
                </div>

                <div class="calibration-container">
                    <canvas id="calibrationCanvas" width="800" height="600"></canvas>
                </div>

                <div class="calibration-status">
                    <p>
                        Points de calibration: <strong>${state.calibrationPoints.length}/5</strong>
                    </p>
                    ${calibrated ? '<p class="success">\u2713 Calibration r\xE9ussie! Vous pouvez proc\xE9der au test.</p>' : "<p>Veuillez calibrer au moins 5 points.</p>"}
                </div>

                <div class="button-group">
                    <button class="btn btn-primary" id="startCalibration" onclick="window.app.startCalibration()">
                        D\xE9marrer la calibration
                    </button>
                    ${calibrated ? `<button class="btn btn-success" onclick="app.goToScreen('test-screen')">
                        Continuer vers le test \u2192
                    </button>` : ""}
                    <button class="btn btn-secondary" onclick="app.goToScreen('home-screen')">
                        Retour
                    </button>
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

                ${!state.isCalibrated ? `
                    <div class="notification notification-warning" style="margin-bottom: 2rem;">
                        <span>\u26A0\uFE0F Calibration requise avant de proc\xE9der au test</span>
                    </div>
                ` : ""}

                <div class="test-container">
                    <canvas id="testCanvas" width="1024" height="768"></canvas>
                </div>

                ${testActive ? `
                    <div class="test-stats">
                        <div class="stat">
                            <label>\u23F1\uFE0F Dur\xE9e du test</label>
                            <span id="testDuration">0s</span>
                        </div>
                        <div class="stat">
                            <label>\u{1F441}\uFE0F Suivi oculaire</label>
                            <span id="testTracking">0%</span>
                        </div>
                        <div class="stat">
                            <label>\u{1F3AF} Fixations</label>
                            <span id="testFixations">0</span>
                        </div>
                        <div class="stat">
                            <label>\u{1F440} \xC9tat des yeux</label>
                            <span id="testEyeState">\u25CF\u25CF</span>
                        </div>
                        <div class="stat">
                            <label>\u{1F4CA} Stabilit\xE9</label>
                            <span id="testStability">--</span>
                        </div>
                        <div class="stat">
                            <label>\u{1F3AF} Confiance</label>
                            <span id="testConfidence">--</span>
                        </div>
                    </div>
                ` : ""}

                <div class="button-group">
                    ${!testActive ? `<button class="btn btn-primary" id="startTest" onclick="window.app.startTest()" ${!state.isCalibrated ? "disabled" : ""}>
                        D\xE9marrer le test
                    </button>` : `<button class="btn btn-danger" id="stopTest" onclick="window.app.stopTest()">
                        Arr\xEAter le test
                    </button>`}
                    <button class="btn btn-secondary" onclick="window.app.goToScreen('home-screen')">
                        Retour
                    </button>
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
                <h2>R\xE9sultats des Tests</h2>

                ${state.testResults.length === 0 ? `
                    <div class="notification notification-info">
                        <span>Aucun test disponible. Commencez par effectuer un test.</span>
                    </div>
                ` : `
                    <div class="results-list">
                        ${state.testResults.map(
      (result, _index) => `
                            <div class="result-card result-${result.result}">
                                <h3>Test #{} - ${new Date(result.test_date).toLocaleDateString(
        "fr-FR"
      )}</h3>
                                <p class="result-status ${result.result}">
                                    R\xE9sultat: <strong>${{
        excellent: "Excellent",
        good: "Bon",
        acceptable: "Acceptable",
        poor: "Faible"
      }[result.result] || result.result.toUpperCase()}</strong>
                                </p>
                                <div class="result-details">
                                    <p><strong>Dur\xE9e:</strong> ${result.duration.toFixed(
        1
      )}s</p>
                                    <p><strong>Suivi:</strong> ${result.tracking_percentage.toFixed(
        1
      )}%</p>
                                    <p><strong>Fixations:</strong> ${result.fixation_count}</p>
                                    <p><strong>Stab. gaze:</strong> ${result.gaze_stability.toFixed(
        2
      )}</p>
                                </div>
                            </div>
                        `
    ).join("")}
                    </div>
                `}

                <div class="button-group">
                    <button class="btn btn-secondary" onclick="app.goToScreen('home-screen')">
                        Retour
                    </button>
                </div>
            </div>
        </div>
    `;
  }
  function renderStatisticsScreen() {
    const state = state_service_default.getState();
    const stats = state.statistics;
    return `
        <div class="screen statistics-screen">
            <div class="container">
                <h2>Statistiques et Analyse</h2>

                ${!stats ? `
                    <div class="notification notification-info">
                        <span>Aucune statistique disponible. Effectuez des tests pour g\xE9n\xE9rer des statistiques.</span>
                    </div>
                ` : `
                    <div class="statistics-grid">
                        <div class="stat-card">
                            <h3>Tests effectu\xE9s</h3>
                            <p class="stat-value">${stats.total_tests || 0}</p>
                        </div>

                        <div class="stat-card">
                            <h3>Suivi moyen</h3>
                            <p class="stat-value">${(stats.avg_tracking || 0).toFixed(
      1
    )}%</p>
                        </div>

                        <div class="stat-card">
                            <h3>Meilleur r\xE9sultat</h3>
                            <p class="stat-value">${stats.best_result || "-"}</p>
                        </div>

                        <div class="stat-card">
                            <h3>Stabilit\xE9 gaze</h3>
                            <p class="stat-value">${(stats.avg_stability || 0).toFixed(
      2
    )}</p>
                        </div>
                    </div>
                `}

                <div class="button-group">
                    <button class="btn btn-secondary" onclick="app.goToScreen('home-screen')">
                        Retour
                    </button>
                </div>
            </div>
        </div>
    `;
  }

  // src/app-dsfr.ts
  var EyeTrackingApp = class {
    constructor() {
      this.eyeTracker = null;
      this.targetDetector = null;
      this.distanceEstimator = null;
      this.testAnalyzer = null;
      this.testActive = false;
      this.isCalibrating = false;
      // Stockage des intervals et animations
      this.testInterval = null;
      this.animationFrameId = null;
      this.init();
    }
    /**
     * Initialise l'application
     */
    async init() {
      console.log("\u{1F680} Initialisation de l'application DSFR...");
      const tokenVersion = localStorage.getItem("token_version");
      const currentVersion = "2.0";
      if (tokenVersion !== currentVersion) {
        console.log("\u{1F504} R\xE9initialisation des tokens...");
        api_service_default.logout();
        localStorage.setItem("token_version", currentVersion);
      }
      if (api_service_default.isAuthenticated()) {
        try {
          const patientData = await api_service_default.getPatient();
          const patient = {
            id: patientData.id,
            username: patientData.user.username,
            email: patientData.user.email,
            firstName: patientData.user.first_name || "",
            lastName: patientData.user.last_name || "",
            age: patientData.age || 0
          };
          state_service_default.setPatient(patient);
          state_service_default.addNotification("\u2713 Connect\xE9 avec succ\xE8s!", "success");
        } catch (error) {
          console.error("Erreur de r\xE9cup\xE9ration du patient:", error);
          api_service_default.logout();
          localStorage.removeItem("token_version");
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
        this.distanceEstimator = new DistanceEstimator();
        this.testAnalyzer = new TestAnalyzer();
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
     * Configure les event listeners (appelé une seule fois)
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
      }, false);
    }
    /**
     * Gère la connexion
     */
    async handleLogin(form) {
      try {
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
        const usernameElement = form.querySelector("#regUsername");
        const emailElement = form.querySelector("#regEmail");
        const passwordElement = form.querySelector("#regPassword");
        const firstNameElement = form.querySelector("#regFirstName");
        const lastNameElement = form.querySelector("#regLastName");
        const ageElement = form.querySelector("#regAge");
        if (!usernameElement || !emailElement || !passwordElement || !firstNameElement || !lastNameElement || !ageElement) {
          state_service_default.addNotification("\u2715 Erreur: \xC9l\xE9ments du formulaire non trouv\xE9s", "error");
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
          "\u2713 Inscription r\xE9ussie! Bienvenue!",
          "success"
        );
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
     * Démarre la calibration (publique pour être appelée depuis le HTML)
     */
    async startCalibration() {
      if (this.isCalibrating) {
        state_service_default.addNotification("\u26A0\uFE0F Calibration d\xE9j\xE0 en cours...", "warning");
        return;
      }
      if (!this.eyeTracker) {
        state_service_default.addNotification("\u26A0\uFE0F Eye tracker non disponible", "warning");
        return;
      }
      this.isCalibrating = true;
      try {
        state_service_default.addNotification("\u{1F4F9} Veuillez autoriser l'acc\xE8s \xE0 votre cam\xE9ra (haute r\xE9solution)...", "info");
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 1920 },
            height: { ideal: 1080 },
            facingMode: "user"
          }
        });
        state_service_default.addNotification("\u2713 Cam\xE9ra autoris\xE9e!", "success");
        await this.eyeTracker.init();
        const gazePoint = document.getElementById("webgazerGazeDot");
        if (gazePoint) {
          gazePoint.style.display = "none";
        }
        state_service_default.addNotification("\u{1F440} Calibration en cours - Fixez les points rouges", "info");
        this.runCalibrationUI();
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : "Erreur inconnue";
        if (errorMsg.includes("NotAllowedError")) {
          state_service_default.addNotification("\u2715 Acc\xE8s \xE0 la cam\xE9ra refus\xE9", "error");
        } else {
          state_service_default.addNotification(`\u2715 Erreur: ${errorMsg}`, "error");
        }
        console.error("Erreur calibration:", error);
        this.isCalibrating = false;
        if (this.eyeTracker) {
          this.eyeTracker.stop();
        }
      }
    }
    /**
     * Interface de calibration interactive
     */
    runCalibrationUI() {
      const calibrationPoints = [
        { x: 100, y: 100 },
        { x: window.innerWidth - 100, y: 100 },
        { x: window.innerWidth / 2, y: window.innerHeight / 2 },
        { x: 100, y: window.innerHeight - 100 },
        { x: window.innerWidth - 100, y: window.innerHeight - 100 }
      ];
      let currentPointIndex = 0;
      const gazePoint = document.getElementById("webgazerGazeDot");
      if (gazePoint) {
        gazePoint.style.display = "block";
      }
      const showNextPoint = async () => {
        if (currentPointIndex >= calibrationPoints.length) {
          if (this.eyeTracker) {
            const success = this.eyeTracker.finalizeCalibration();
            if (success) {
              state_service_default.setCalibrationPoints(this.eyeTracker.calibrationPoints);
              state_service_default.addNotification("\u2713 Calibration r\xE9ussie! Vous pouvez proc\xE9der au test.", "success");
            } else {
              state_service_default.addNotification("\u26A0\uFE0F Calibration incompl\xE8te. R\xE9essayez.", "warning");
            }
          }
          const pointElement2 = document.getElementById("calibration-point");
          if (pointElement2) {
            pointElement2.remove();
          }
          const gaze = document.getElementById("webgazerGazeDot");
          if (gaze) {
            gaze.style.display = "none";
          }
          this.isCalibrating = false;
          return;
        }
        const point = calibrationPoints[currentPointIndex];
        let pointElement = document.getElementById("calibration-point");
        if (!pointElement) {
          pointElement = document.createElement("div");
          pointElement.id = "calibration-point";
          pointElement.style.cssText = `
                    position: fixed;
                    width: 30px;
                    height: 30px;
                    background: radial-gradient(circle, #e74c3c, #c0392b);
                    border-radius: 50%;
                    border: 3px solid white;
                    box-shadow: 0 0 15px rgba(231, 76, 60, 0.9);
                    pointer-events: none;
                    z-index: 9999;
                    animation: pulse 1s ease-in-out infinite;
                `;
          if (!document.getElementById("calibration-style")) {
            const style = document.createElement("style");
            style.id = "calibration-style";
            style.textContent = `
                        @keyframes pulse {
                            0%, 100% { transform: scale(1); }
                            50% { transform: scale(1.2); }
                        }
                    `;
            document.head.appendChild(style);
          }
          document.body.appendChild(pointElement);
        }
        pointElement.style.left = point.x - 15 + "px";
        pointElement.style.top = point.y - 15 + "px";
        pointElement.style.display = "block";
        state_service_default.addNotification(`Point ${currentPointIndex + 1}/5: Fixez le point rouge`, "info");
        console.log(`Calibration point ${currentPointIndex + 1}:`, point);
        let waitAttempts = 0;
        const maxAttempts = 50;
        const waitForGazeData = setInterval(() => {
          waitAttempts++;
          if (this.eyeTracker && this.eyeTracker.gazeData) {
            clearInterval(waitForGazeData);
            const success = this.eyeTracker.addCalibrationPoint(point.x, point.y);
            console.log("Point enregistr\xE9:", success);
            state_service_default.addCalibrationPoint({ x: point.x, y: point.y });
            currentPointIndex++;
            showNextPoint();
          } else if (waitAttempts >= maxAttempts) {
            clearInterval(waitForGazeData);
            console.warn("Timeout attente donn\xE9es de regard");
            const success = this.eyeTracker?.addCalibrationPoint(point.x, point.y) ?? false;
            console.log("Point enregistr\xE9 (timeout):", success);
            state_service_default.addCalibrationPoint({ x: point.x, y: point.y });
            currentPointIndex++;
            showNextPoint();
          }
        }, 100);
      };
      showNextPoint();
    }
    /**
     * Démarre un test (publique pour être appelée depuis le HTML)
     */
    async startTest() {
      if (!this.eyeTracker || !this.targetDetector) {
        state_service_default.addNotification("\u26A0\uFE0F Eye tracker non disponible", "warning");
        return;
      }
      if (!window.webgazer) {
        state_service_default.addNotification("\u26A0\uFE0F WebGazer non initialis\xE9", "warning");
        return;
      }
      try {
        state_service_default.startNewTest();
        this.testActive = true;
        this.render();
        setTimeout(() => {
          const gazePoint = document.getElementById("webgazerGazeDot");
          if (gazePoint) {
            gazePoint.style.display = "block";
          }
        }, 100);
        this.eyeTracker.startTracking();
        state_service_default.addNotification("\u25B6\uFE0F Test d\xE9marr\xE9! Regardez les cibles.", "success");
        this.startDrawingTargets();
        const testData = state_service_default.getState().currentTest;
        if (!testData || !testData.startTime) {
          throw new Error("Test data not initialized");
        }
        const testStartTime = testData.startTime;
        this.testInterval = setInterval(() => {
          if (!this.testActive) {
            if (this.testInterval) {
              clearInterval(this.testInterval);
              this.testInterval = null;
            }
            return;
          }
          const currentTime = Date.now();
          const elapsed = (currentTime - testStartTime) / 1e3;
          const gazePos = this.eyeTracker?.getGazePosition();
          if (gazePos && this.targetDetector) {
          } else if (!gazePos) {
            console.warn("\u26A0\uFE0F Gaze position null - WebGazer peut ne pas avoir de donn\xE9es");
          }
          const state = state_service_default.getState();
          const test = state.currentTest;
          const durationEl = document.getElementById("testDuration");
          if (durationEl) {
            durationEl.textContent = elapsed.toFixed(1) + "s";
          }
          const trackingEl = document.getElementById("testTracking");
          if (trackingEl && test) {
            trackingEl.textContent = (test.trackingPercentage || 0).toFixed(0) + "%";
          }
          const fixationsEl = document.getElementById("testFixations");
          if (fixationsEl && test) {
            fixationsEl.textContent = (test.fixationCount || 0).toString();
          }
          const eyeStateEl = document.getElementById("testEyeState");
          if (eyeStateEl && this.eyeTracker) {
            const eyeState = this.eyeTracker.getEyeState();
            let stateText = "";
            let stateColor = "";
            if (eyeState === 2) {
              stateText = "\u{1F441}\uFE0F\u{1F441}\uFE0F Deux yeux";
              stateColor = "#10b981";
            } else if (eyeState === 1) {
              stateText = "\u{1F441}\uFE0F Un oeil";
              stateColor = "#f59e0b";
            } else {
              stateText = "\u25CF \u25CF Ferm\xE9s";
              stateColor = "#ef4444";
            }
            eyeStateEl.textContent = stateText;
            eyeStateEl.style.color = stateColor;
            eyeStateEl.style.fontWeight = "bold";
          }
          const stabilityEl = document.getElementById("testStability");
          if (stabilityEl && this.eyeTracker) {
            const stability = this.eyeTracker.getGazeStability();
            stabilityEl.textContent = stability.toFixed(0) + "%";
            stabilityEl.style.color = stability > 70 ? "#10b981" : stability > 40 ? "#f59e0b" : "#ef4444";
          }
          const confidenceEl = document.getElementById("testConfidence");
          if (confidenceEl && this.eyeTracker && this.eyeTracker.gazeData) {
            const confidence = (this.eyeTracker.gazeData.confidence * 100).toFixed(0);
            confidenceEl.textContent = confidence + "%";
            confidenceEl.style.color = parseInt(confidence) > 80 ? "#10b981" : parseInt(confidence) > 60 ? "#f59e0b" : "#ef4444";
          }
        }, 100);
      } catch (error) {
        console.error("Erreur au d\xE9marrage du test:", error);
        state_service_default.addNotification(
          `\u2715 Erreur: ${error instanceof Error ? error.message : "Erreur inconnue"}`,
          "error"
        );
        this.testActive = false;
      }
    }
    /**
     * Arrête le test (publique pour être appelée depuis le HTML)
     */
    async stopTest() {
      console.log("\u{1F6D1} stopTest appel\xE9 - testActive:", this.testActive);
      if (!this.testActive) {
        console.warn("\u26A0\uFE0F Test non actif, impossible d'arr\xEAter");
        return;
      }
      this.testActive = false;
      if (this.testInterval) {
        clearInterval(this.testInterval);
        this.testInterval = null;
        console.log("\u2713 Test interval arr\xEAt\xE9");
      }
      if (this.animationFrameId) {
        cancelAnimationFrame(this.animationFrameId);
        this.animationFrameId = null;
        console.log("\u2713 Animation frame arr\xEAt\xE9e");
      }
      try {
        if (this.eyeTracker) {
          this.eyeTracker.stopTracking();
          console.log("\u2713 Eye tracker arr\xEAt\xE9");
        }
        const gazePoint = document.getElementById("webgazerGazeDot");
        if (gazePoint) {
          gazePoint.style.display = "none";
        }
        const testData = state_service_default.finishCurrentTest();
        console.log("Test data:", testData);
        if (testData) {
          console.log("Soumission du test au backend...");
          const result = await api_service_default.createTest({
            patient_id: window.__selectedPatientId,
            duration: testData.totalTime,
            gaze_time: testData.gazeTime,
            tracking_percentage: testData.trackingPercentage,
            fixation_count: testData.fixationCount,
            avg_fixation_duration: testData.avgFixationDuration,
            max_fixation_duration: testData.maxFixationDuration || 0,
            min_fixation_duration: testData.minFixationDuration || 0,
            gaze_stability: testData.gazeStability,
            gaze_consistency: testData.gazeConsistency,
            raw_data: testData.rawData
          });
          console.log("\u2713 Test enregistr\xE9:", result);
          state_service_default.addTestResult(result);
          state_service_default.addNotification("\u2713 Test enregistr\xE9 avec succ\xE8s!", "success");
          this.goToScreen("results-screen");
          setTimeout(() => this.render(), 100);
        } else {
          console.warn("\u26A0\uFE0F Pas de donn\xE9es de test");
          state_service_default.addNotification("\u26A0\uFE0F Pas de donn\xE9es de test", "warning");
        }
      } catch (error) {
        console.error("\u274C Erreur lors de l'arr\xEAt du test:", error);
        state_service_default.addNotification(
          `\u2715 Erreur: ${error instanceof Error ? error.message : "Erreur inconnue"}`,
          "error"
        );
      }
    }
    /**
     * Charge et affiche les résultats des tests
     */
    async loadResults() {
      try {
        state_service_default.addNotification("\u23F3 Chargement des r\xE9sultats...", "info");
        const tests = await api_service_default.getTests();
        tests.forEach((test) => state_service_default.addTestResult(test));
        this.goToScreen("results-screen");
      } catch (error) {
        state_service_default.addNotification(
          `\u2715 Erreur: ${error instanceof Error ? error.message : "Erreur inconnue"}`,
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
        console.log("\u{1F4CB} D\xE9tails du test:", test);
        state_service_default.addNotification(`Test #${testId} charg\xE9`, "success");
      } catch (error) {
        state_service_default.addNotification(
          `\u2715 Erreur: ${error instanceof Error ? error.message : "Erreur inconnue"}`,
          "error"
        );
      }
    }
    /**
     * Exporte un test en PDF
     */
    async exportTestPDF(testId) {
      try {
        state_service_default.addNotification("\u23F3 G\xE9n\xE9ration du PDF...", "info");
        const blob = await api_service_default.exportTestPDF(testId);
        this.downloadBlob(blob, `test_${testId}.pdf`);
        state_service_default.addNotification("\u2713 PDF t\xE9l\xE9charg\xE9 avec succ\xE8s!", "success");
      } catch (error) {
        state_service_default.addNotification(
          `\u2715 Erreur: ${error instanceof Error ? error.message : "Erreur inconnue"}`,
          "error"
        );
      }
    }
    /**
     * Exporte tous les tests en PDF
     */
    async exportAllTestsPDF() {
      try {
        state_service_default.addNotification("\u23F3 G\xE9n\xE9ration du PDF complet...", "info");
        const blob = await api_service_default.exportAllTestsPDF();
        this.downloadBlob(blob, "tous_les_tests.pdf");
        state_service_default.addNotification("\u2713 PDF t\xE9l\xE9charg\xE9 avec succ\xE8s!", "success");
      } catch (error) {
        state_service_default.addNotification(
          `\u2715 Erreur: ${error instanceof Error ? error.message : "Erreur inconnue"}`,
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
      state_service_default.addNotification("\u2713 D\xE9connect\xE9!", "info");
      this.goToScreen("home-screen");
    }
    /**
     * Affiche l'application
     */
    render() {
      const app2 = document.getElementById("app");
      const navbarMenu = document.getElementById("navbarMenu");
      if (!app2 || !navbarMenu) return;
      const state = state_service_default.getState();
      let screenContent = "";
      navbarMenu.innerHTML = renderNavbarContent();
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
      app2.innerHTML = screenContent;
      const notificationsDiv = document.createElement("div");
      notificationsDiv.style.position = "fixed";
      notificationsDiv.style.top = "100px";
      notificationsDiv.style.right = "20px";
      notificationsDiv.style.maxWidth = "400px";
      notificationsDiv.style.zIndex = "1000";
      notificationsDiv.innerHTML = renderNotifications();
      app2.parentElement?.appendChild(notificationsDiv);
    }
    /**
     * Démarre l'animation des cibles sur le canvas
     */
    startDrawingTargets() {
      const canvas = document.getElementById("testCanvas");
      if (!canvas) {
        console.error("\u274C Canvas testCanvas non trouv\xE9");
        return;
      }
      if (!this.targetDetector) {
        console.error("\u274C targetDetector non initialis\xE9");
        return;
      }
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        console.error("\u274C Impossible d'obtenir le contexte du canvas");
        return;
      }
      console.log("\u2705 Canvas initialis\xE9:", {
        width: canvas.width,
        height: canvas.height,
        targetDetectorWidth: this.targetDetector.width,
        targetDetectorHeight: this.targetDetector.height
      });
      const drawFrame = () => {
        if (!this.testActive) {
          this.animationFrameId = null;
          return;
        }
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        this.targetDetector?.update();
        this.targetDetector?.draw(ctx);
        this.animationFrameId = requestAnimationFrame(drawFrame);
      };
      console.log("\u{1F3AF} D\xE9marrage du dessin des cibles...");
      this.animationFrameId = requestAnimationFrame(drawFrame);
    }
  };
  var app = new EyeTrackingApp();
  window.app = app;
  var app_dsfr_default = app;
})();
