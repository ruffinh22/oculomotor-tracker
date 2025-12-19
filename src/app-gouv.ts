/**
 * Application de Suivi Oculaire Clinique - Style Gouvernemental
 * Intégration WebGazer + Django Backend avec design DSFR
 */

import stateManager, { TestData } from './services/state.service';
import apiService from './services/api.service';
import { renderMainLayout } from './components/screens-gouv';

declare global {
    interface Window {
        app: AppGouv | undefined;
    }
}

class AppGouv {
    private calibrationMode = false;
    private calibrationPoints: Array<{ x: number; y: number }> = [];
    private testActive = false;
    private testStartTime = 0;

    constructor() {
        console.log('🚀 Initialisation AppGouv');
    }

    /**
     * Initialise l'application
     */
    public async start(): Promise<void> {
        console.log('🚀 Démarrage de l\'application gouvernementale...');

        try {
            // Nettoie les vieux tokens
            const tokenVersion = localStorage.getItem('token_version');
            const currentVersion = '2.0';

            if (tokenVersion !== currentVersion) {
                console.log('🔄 Réinitialisation des tokens...');
                apiService.logout();
                localStorage.setItem('token_version', currentVersion);
            }

            console.log('✅ Tokens checked');

            // Initialise les modules eye tracking
            await this.initializeEyeTracking();
            console.log('✅ Eye tracking initialized');

            // Configure les event listeners
            this.setupEventListeners();
            console.log('✅ Event listeners setup');

            // Affiche l'écran initial
            this.render();
            console.log('✅ Rendu initial terminé');

            // S'abonne aux changements d'état
            stateManager.subscribe(() => {
                if (!this.testActive) {
                    this.render();
                }
            });

            console.log('✅ App ready!');
        } catch (error) {
            console.error('❌ Erreur lors du démarrage:', error);
            stateManager.addNotification(
                `Erreur au démarrage: ${error instanceof Error ? error.message : 'Inconnue'}`,
                'error'
            );
        }
    }

    /**
     * Initialise WebGazer pour le suivi oculaire
     */
    private async initializeEyeTracking(): Promise<void> {
        return new Promise((resolve) => {
            if (!window.webgazer) {
                console.warn('⚠️ WebGazer non disponible');
                resolve();
                return;
            }

            window.webgazer
                .setGazeListener((data: any) => {
                    if (data) {
                        stateManager.updateGazeData({
                            x: data.x,
                            y: data.y,
                            confidence: data.confidence,
                        });
                    }
                })
                .begin()
                .then(() => {
                    console.log('✅ WebGazer initialized');
                    
                    // Force le repositionnement du container WebGazer avec un interval
                    // Fonction pour forcer le repositionnement
                    const enforcePosition = () => {
                        const container = document.querySelector('.webgazer-container') as HTMLElement;
                        if (container) {
                            // Forcer le style avec cssText (plus puissant que les propriétés individuelles)
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
                            container.style.cssText = styleString;
                            
                            // Supprimer les attributs de style inline qui pourraient interférer
                            container.removeAttribute('data-webgazer');
                            
                            // Style les éléments internes
                            const canvas = container.querySelector('canvas') as HTMLElement;
                            const video = container.querySelector('video') as HTMLElement;
                            
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
                    
                    // Appliquer immédiatement
                    enforcePosition();
                    
                    // Continuous repositioning avec requestAnimationFrame pour une meilleure performance
                    let isRepositioning = true;
                    const reposition = () => {
                        if (isRepositioning) {
                            enforcePosition();
                            requestAnimationFrame(reposition);
                        }
                    };
                    reposition();
                    
                    // Observer pour détecter si WebGazer change les styles
                    const observer = new MutationObserver(() => {
                        enforcePosition();
                    });
                    
                    const container = document.querySelector('.webgazer-container') as HTMLElement;
                    if (container) {
                        observer.observe(container, {
                            attributes: true,
                            attributeOldValue: true,
                            attributeFilter: ['style', 'data-webgazer']
                        });
                    }
                    
                    // Arrêter après 15 secondes (mais continuer à observer)
                    setTimeout(() => {
                        isRepositioning = false;
                        console.log('✅ WebGazer container repositionné - monitoring actif');
                    }, 15000);
                    
                    resolve();
                })
                .catch((err: any) => {
                    console.error('⚠️ WebGazer error:', err);
                    resolve();
                });
        });
    }

    /**
     * Configure les event listeners
     */
    private setupEventListeners(): void {
        document.addEventListener('submit', (e) => this.handleFormSubmit(e));
    }

    /**
     * Gère la soumission de formulaires
     */
    private handleFormSubmit(e: Event): void {
        const form = e.target as HTMLFormElement;

        if (form.id === 'loginForm') {
            e.preventDefault();
            this.handleLogin(form);
        } else if (form.id === 'registerForm') {
            e.preventDefault();
            this.handleRegister(form);
        } else if (form.id === 'registerPatientForm') {
            e.preventDefault();
            this.handleRegisterPatient(form);
        }
    }

    /**
     * Gère la connexion
     */
    public async handleLogin(form?: HTMLFormElement): Promise<void> {
        try {
            if (!form) {
                form = document.querySelector('#loginForm') as HTMLFormElement;
                if (!form) {
                    stateManager.addNotification('✕ Formulaire non trouvé', 'error');
                    return;
                }
            }

            const usernameElement = form.querySelector('#loginUsername') as HTMLInputElement;
            const passwordElement = form.querySelector('#loginPassword') as HTMLInputElement;

            if (!usernameElement || !passwordElement) {
                stateManager.addNotification('✕ Erreur: Éléments du formulaire non trouvés', 'error');
                return;
            }

            const username = usernameElement.value;
            const password = passwordElement.value;

            const response = await apiService.login(username, password);
            stateManager.setPatient({
                id: response.user_id,
                username: response.username,
                email: response.email,
                firstName: response.first_name || '',
                lastName: response.last_name || '',
                age: 0,
            });

            stateManager.addNotification('✓ Connexion réussie!', 'success');
            this.goToScreen('home-screen');
            form.reset();
        } catch (error) {
            stateManager.addNotification(
                `✕ Erreur: ${error instanceof Error ? error.message : 'Erreur inconnue'}`,
                'error'
            );
        }
    }

    /**
     * Gère l'inscription
     */
    public async handleRegister(form?: HTMLFormElement): Promise<void> {
        try {
            if (!form) {
                form = document.querySelector('#registerForm') as HTMLFormElement;
                if (!form) {
                    stateManager.addNotification('✕ Formulaire non trouvé', 'error');
                    return;
                }
            }

            const usernameElement = form.querySelector('#registerUsername') as HTMLInputElement;
            const emailElement = form.querySelector('#registerEmail') as HTMLInputElement;
            const passwordElement = form.querySelector('#registerPassword') as HTMLInputElement;
            const firstNameElement = form.querySelector('#registerFirstName') as HTMLInputElement;
            const lastNameElement = form.querySelector('#registerLastName') as HTMLInputElement;
            const ageElement = form.querySelector('#registerAge') as HTMLInputElement;

            if (
                !usernameElement ||
                !emailElement ||
                !passwordElement ||
                !firstNameElement ||
                !lastNameElement ||
                !ageElement
            ) {
                stateManager.addNotification('✕ Erreur: Éléments du formulaire non trouvés', 'error');
                return;
            }

            const response = await apiService.register(
                usernameElement.value,
                emailElement.value,
                passwordElement.value,
                firstNameElement.value,
                lastNameElement.value,
                parseInt(ageElement.value)
            );

            stateManager.setPatient({
                id: response.user_id,
                username: response.username,
                email: response.email,
                firstName: response.first_name || '',
                lastName: response.last_name || '',
                age: parseInt(ageElement.value),
            });

            stateManager.addNotification('✓ Inscription réussie!', 'success');
            this.goToScreen('home-screen');
            form.reset();
        } catch (error) {
            stateManager.addNotification(
                `✕ Erreur: ${error instanceof Error ? error.message : 'Erreur inconnue'}`,
                'error'
            );
        }
    }

    /**
     * Gère l'enregistrement d'un nouveau patient (depuis l'écran patient-selection)
     */
    public async handleRegisterPatient(form?: HTMLFormElement): Promise<void> {
        try {
            if (!form) {
                form = document.querySelector('#registerPatientForm') as HTMLFormElement;
                if (!form) {
                    stateManager.addNotification('✕ Formulaire non trouvé', 'error');
                    return;
                }
            }

            const firstNameElement = form.querySelector('#firstName') as HTMLInputElement;
            const lastNameElement = form.querySelector('#lastName') as HTMLInputElement;
            const emailElement = form.querySelector('#email') as HTMLInputElement;
            const ageElement = form.querySelector('#age') as HTMLInputElement;
            const usernameElement = form.querySelector('#username') as HTMLInputElement;
            const passwordElement = form.querySelector('#password') as HTMLInputElement;

            if (!firstNameElement || !lastNameElement || !emailElement || !usernameElement || !passwordElement) {
                stateManager.addNotification('✕ Erreur: Champs obligatoires manquants', 'error');
                return;
            }

            const response = await apiService.register(
                usernameElement.value,
                emailElement.value,
                passwordElement.value,
                firstNameElement.value,
                lastNameElement.value,
                ageElement ? parseInt(ageElement.value) || 0 : 0
            );

            stateManager.addNotification('✓ Patient créé avec succès!', 'success');
            form.reset();
            
            // Recharger les patients et retourner à la sélection
            await this.loadPatients();
            this.goToScreen('patient-selection-screen');
        } catch (error) {
            stateManager.addNotification(
                `✕ Erreur: ${error instanceof Error ? error.message : 'Erreur inconnue'}`,
                'error'
            );
        }
    }

    /**
     * Démarre la calibration
     */
    public async startCalibration(): Promise<void> {
        console.log('🔧 Démarrage de la calibration...');
        this.calibrationMode = true;
        this.calibrationPoints = [];

        const canvas = document.querySelector('#testCanvas') as HTMLElement;
        if (!canvas) {
            stateManager.addNotification('✕ Canvas non trouvé', 'error');
            return;
        }

        const calibrationPositions = [
            { x: 0.1, y: 0.1 },
            { x: 0.9, y: 0.1 },
            { x: 0.5, y: 0.5 },
            { x: 0.1, y: 0.9 },
            { x: 0.9, y: 0.9 },
        ];

        for (let i = 0; i < calibrationPositions.length; i++) {
            const pos = calibrationPositions[i];
            const x = canvas.offsetWidth * pos.x;
            const y = canvas.offsetHeight * pos.y;

            // Affiche le point
            this.drawCalibrationPoint(canvas, x, y);

            // Attend que l'utilisateur regarde le point
            await new Promise((resolve) => setTimeout(resolve, 2000));

            stateManager.updateCalibration(i + 1);
        }

        this.calibrationMode = false;
        stateManager.addNotification('✓ Calibration terminée!', 'success');
        console.log('✅ Calibration complete');
    }

    /**
     * Dessine un point de calibration
     */
    private drawCalibrationPoint(canvas: HTMLElement, x: number, y: number): void {
        // Nettoie les anciens points
        const oldPoints = canvas.querySelectorAll('.calibration-point');
        oldPoints.forEach((point) => point.remove());

        // Crée un nouveau point
        const point = document.createElement('div');
        point.className = 'calibration-point';
        point.style.position = 'absolute';
        point.style.left = x + 'px';
        point.style.top = y + 'px';
        point.style.width = '20px';
        point.style.height = '20px';
        point.style.borderRadius = '50%';
        point.style.backgroundColor = '#000091';
        point.style.border = '3px solid #0a76f6';
        point.style.transform = 'translate(-50%, -50%)';
        point.style.boxShadow = '0 0 10px rgba(0, 0, 145, 0.5)';

        canvas.appendChild(point);
    }

    /**
     * Démarre un test
     */
    public async startTest(): Promise<void> {
        console.log('▶️ Démarrage du test...');
        this.testActive = true;
        this.testStartTime = Date.now();

        // Affiche les contrôles actifs
        const controls = document.querySelector('#activeTestControls') as HTMLElement;
        if (controls) {
            controls.style.display = 'block';
        }

        // Masque les boutons de démarrage
        const buttons = document.querySelectorAll('[onclick*="startTest"]') as NodeListOf<HTMLElement>;
        buttons.forEach((btn) => (btn.style.display = 'none'));

        stateManager.startTest();

        // Initialise le canvas pour la visualisation
        const canvas = document.querySelector('#testCanvas') as HTMLCanvasElement;
        const ctx = canvas?.getContext('2d');
        
        const gazeTrail: Array<{ x: number; y: number; timestamp: number }> = [];
        const fixations: Array<{ x: number; y: number; startTime: number; endTime: number; duration: number }> = [];
        let lastSpread = 0;
        let currentFixation: any = null;
        const FIXATION_THRESHOLD = 50; // pixels - seuil de stabilité
        const FIXATION_MIN_DURATION = 0.1; // 100ms minimum pour être une fixation

        if (canvas && ctx) {
            // Dimensionne le canvas correctement
            canvas.width = canvas.offsetWidth;
            canvas.height = canvas.offsetHeight;
        }

        // Met à jour les données du test en temps réel
        const testInterval = setInterval(() => {
            if (!this.testActive) {
                clearInterval(testInterval);
                return;
            }

            const elapsed = (Date.now() - this.testStartTime) / 1000;
            const state = stateManager.getState();
            
            // Récupère la dernière donnée de regard depuis rawData
            let gazeData: any = null;
            if (state.currentTest && state.currentTest.rawData) {
                const rawDataEntries = Object.entries(state.currentTest.rawData);
                if (rawDataEntries.length > 0) {
                    gazeData = rawDataEntries[rawDataEntries.length - 1][1];
                    // Clip les coordonnées au canvas pour éviter qu'elles sortent
                    if (gazeData && canvas) {
                        gazeData.x = Math.max(0, Math.min(gazeData.x, canvas.width));
                        gazeData.y = Math.max(0, Math.min(gazeData.y, canvas.height));
                    }
                }
            }

            // Ajoute au trail avec limite de 300 points
            if (gazeData && gazeData.x && gazeData.y) {
                gazeTrail.push({
                    x: gazeData.x,
                    y: gazeData.y,
                    timestamp: Date.now(),
                });

                if (gazeTrail.length > 300) {
                    gazeTrail.shift();
                }

                // Algorithme de détection de fixation amélioré
                if (gazeTrail.length >= 10) {
                    // Calcule la stabilité sur les 10 derniers points
                    const recentPoints = gazeTrail.slice(-10);
                    const avgX = recentPoints.reduce((sum, p) => sum + p.x, 0) / recentPoints.length;
                    const avgY = recentPoints.reduce((sum, p) => sum + p.y, 0) / recentPoints.length;
                    
                    // Calcule la dispersion (variance moyenne)
                    const spread = recentPoints.reduce((sum, p) => sum + Math.hypot(p.x - avgX, p.y - avgY), 0) / recentPoints.length;
                    lastSpread = spread;

                    if (spread < FIXATION_THRESHOLD) {
                        // Le regard est stable - on est en fixation
                        if (!currentFixation) {
                            // Début d'une nouvelle fixation
                            currentFixation = {
                                x: avgX,
                                y: avgY,
                                startTime: Date.now(),
                                startTrailIndex: gazeTrail.length - 1,
                            };
                        } else {
                            // Vérifie que la fixation continue au même endroit
                            const distance = Math.hypot(currentFixation.x - avgX, currentFixation.y - avgY);
                            if (distance < FIXATION_THRESHOLD * 2) {
                                // Même zone - continue la fixation
                                currentFixation.x = avgX;
                                currentFixation.y = avgY;
                            } else {
                                // Zone différente - termine la fixation et commence une nouvelle
                                const fixationDuration = (Date.now() - currentFixation.startTime) / 1000;
                                if (fixationDuration >= FIXATION_MIN_DURATION) {
                                    fixations.push({
                                        x: currentFixation.x,
                                        y: currentFixation.y,
                                        startTime: currentFixation.startTime,
                                        endTime: Date.now(),
                                        duration: fixationDuration,
                                    });
                                }
                                currentFixation = {
                                    x: avgX,
                                    y: avgY,
                                    startTime: Date.now(),
                                    startTrailIndex: gazeTrail.length - 1,
                                };
                            }
                        }
                    } else {
                        // Le regard bouge - fin de la fixation
                        if (currentFixation) {
                            const fixationDuration = (Date.now() - currentFixation.startTime) / 1000;
                            if (fixationDuration >= FIXATION_MIN_DURATION) {
                                fixations.push({
                                    x: currentFixation.x,
                                    y: currentFixation.y,
                                    startTime: currentFixation.startTime,
                                    endTime: Date.now(),
                                    duration: fixationDuration,
                                });
                            }
                            currentFixation = null;
                        }
                    }
                }
            }

            // Calcule les métriques
            const trackingPercentage = Math.min(100, (gazeTrail.length / (elapsed * 30)) * 100);
            const stability = gazeTrail.length > 1 ? Math.max(0, 100 - lastSpread * 3) : 0;
            const consistency = gazeTrail.length > 1 ? 100 - (lastSpread * 2) : 0;
            
            // Calcule les statistiques de fixations
            const avgFixationDuration = fixations.length > 0 
                ? fixations.reduce((sum, f) => sum + f.duration, 0) / fixations.length 
                : 0;
            const maxFixationDuration = fixations.length > 0 
                ? Math.max(...fixations.map(f => f.duration)) 
                : 0;
            const minFixationDuration = fixations.length > 0 
                ? Math.min(...fixations.map(f => f.duration)) 
                : 0;

            stateManager.updateTestData({
                totalTime: elapsed,
                gazeTime: elapsed,
                trackingPercentage,
                fixationCount: fixations.length,
                avgFixationDuration: avgFixationDuration * 1000, // en ms
                maxFixationDuration: maxFixationDuration * 1000,
                minFixationDuration: minFixationDuration * 1000,
                gazeStability: stability,
                gazeConsistency: Math.max(0, consistency),
            });

            // Dessine le canvas
            if (canvas && ctx) {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                ctx.fillStyle = 'rgba(246, 246, 246, 0.5)';
                ctx.fillRect(0, 0, canvas.width, canvas.height);

                // Dessine le trail du regard (historique)
                if (gazeTrail.length > 1) {
                    ctx.strokeStyle = '#18753c';
                    ctx.lineWidth = 2;
                    ctx.lineCap = 'round';
                    ctx.lineJoin = 'round';

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

                // Dessine les marqueurs de fixation terminées
                for (const fixation of fixations) {
                    const radius = Math.max(15, Math.min(50, fixation.duration * 30)); // Grandit avec la durée
                    ctx.strokeStyle = '#ff9947';
                    ctx.lineWidth = 3;
                    ctx.beginPath();
                    ctx.arc(fixation.x, fixation.y, radius, 0, Math.PI * 2);
                    ctx.stroke();

                    // Remplissage légèrement transparent
                    ctx.fillStyle = 'rgba(255, 153, 71, 0.2)';
                    ctx.fill();

                    // Texte "F" au centre
                    ctx.fillStyle = '#ff9947';
                    ctx.font = 'bold 14px Arial';
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillText('F', fixation.x, fixation.y);
                    
                    // Affiche la durée
                    ctx.font = 'bold 10px Arial';
                    ctx.fillText(`${fixation.duration.toFixed(2)}s`, fixation.x, fixation.y + 15);
                }

                // Dessine la fixation en cours (si existe)
                if (currentFixation && lastSpread < FIXATION_THRESHOLD) {
                    const currentDuration = (Date.now() - currentFixation.startTime) / 1000;
                    ctx.strokeStyle = '#ff9947';
                    ctx.lineWidth = 2;
                    ctx.setLineDash([5, 5]);
                    ctx.beginPath();
                    ctx.arc(currentFixation.x, currentFixation.y, 20, 0, Math.PI * 2);
                    ctx.stroke();
                    ctx.setLineDash([]);
                }

                // Dessine le point de regard actuel
                if (gazeData && gazeData.x && gazeData.y) {
                    // Cercle bleu principal (réduit)
                    ctx.fillStyle = '#0a76f6';
                    ctx.beginPath();
                    ctx.arc(gazeData.x, gazeData.y, 6, 0, Math.PI * 2);
                    ctx.fill();
                    
                    // Bordure sombre pour plus de contraste
                    ctx.strokeStyle = '#000091';
                    ctx.lineWidth = 2;
                    ctx.beginPath();
                    ctx.arc(gazeData.x, gazeData.y, 6, 0, Math.PI * 2);
                    ctx.stroke();

                    // Cercle blanc intérieur très petit
                    ctx.fillStyle = '#ffffff';
                    ctx.beginPath();
                    ctx.arc(gazeData.x, gazeData.y, 2, 0, Math.PI * 2);
                    ctx.fill();

                    // Croix fine de repérage
                    ctx.strokeStyle = '#0a76f6';
                    ctx.lineWidth = 1;
                    ctx.beginPath();
                    ctx.moveTo(gazeData.x - 12, gazeData.y);
                    ctx.lineTo(gazeData.x + 12, gazeData.y);
                    ctx.moveTo(gazeData.x, gazeData.y - 12);
                    ctx.lineTo(gazeData.x, gazeData.y + 12);
                    ctx.stroke();
                }
            }
        }, 16); // ~60 FPS
    }

    /**
     * Arrête le test et envoie les données
     */
    public async stopTest(): Promise<void> {
        console.log('⏹️ Arrêt du test...');
        this.testActive = false;

        const testData = stateManager.getState().currentTest;
        stateManager.addNotification('📤 Soumission des données...', 'info');

        try {
            // Récupère les tokens actuels depuis localStorage pour s'assurer qu'ils sont à jour
            const token = localStorage.getItem('access_token');
            if (!token) {
                stateManager.addNotification('✕ Token expiré. Veuillez vous reconnecter.', 'error');
                this.goToScreen('login-screen');
                return;
            }

            const result = await apiService.createTest({
                duration: testData?.totalTime || 0,
                gaze_time: testData?.gazeTime || 0,
                tracking_percentage: testData?.trackingPercentage || 0,
                fixation_count: testData?.fixationCount || 0,
                avg_fixation_duration: testData?.avgFixationDuration || 0,
                max_fixation_duration: testData?.maxFixationDuration || 0,
                min_fixation_duration: testData?.minFixationDuration || 0,
                gaze_stability: testData?.gazeStability || 0,
                gaze_consistency: testData?.gazeConsistency || 0,
                raw_data: testData?.rawData || {},
            });

            stateManager.addNotification('✓ Test enregistré avec succès!', 'success');
            
            // Ajoute le résultat au state pour l'affichage dans results-screen
            if (result) {
                stateManager.addTestResult({
                    id: result.id,
                    test_date: new Date().toISOString(),
                    duration: result.duration,
                    gaze_time: result.gaze_time,
                    tracking_percentage: result.tracking_percentage,
                    fixation_count: result.fixation_count,
                    result: result.result || 'good',
                    avg_fixation_duration: result.avg_fixation_duration,
                    max_fixation_duration: result.avg_fixation_duration,
                    min_fixation_duration: result.avg_fixation_duration,
                    gaze_stability: (result as any).gaze_stability || 0.5,
                    gaze_consistency: (result as any).gaze_consistency || 0.5,
                    raw_data: result.raw_data,
                });
            }
            
            stateManager.finishTest();

            // Masque les contrôles actifs
            const controls = document.querySelector('#activeTestControls') as HTMLElement;
            if (controls) {
                controls.style.display = 'none';
            }

            // Affiche les boutons de démarrage
            const buttons = document.querySelectorAll('[onclick*="startTest"]') as NodeListOf<HTMLElement>;
            buttons.forEach((btn) => (btn.style.display = 'block'));

            this.render();
            setTimeout(() => this.goToScreen('results-screen'), 1500);
        } catch (error) {
            stateManager.addNotification(
                `✕ Erreur: ${error instanceof Error ? error.message : 'Erreur inconnue'}`,
                'error'
            );
            this.testActive = false;
        }
    }

    /**
     * Affiche un écran spécifique
     */
    public async goToScreen(screenId: string): Promise<void> {
        console.log(`📺 Navigation vers: ${screenId}`);
        
        // Charge les tests si on va sur results-screen
        if (screenId === 'results-screen') {
            try {
                // Vérifie que le token existe
                const token = localStorage.getItem('access_token');
                if (!token) {
                    stateManager.addNotification('✕ Token expiré. Veuillez vous reconnecter.', 'error');
                    this.goToScreen('login-screen');
                    return;
                }
                
                const tests = await apiService.getTests();
                stateManager.setTests(tests);
            } catch (error) {
                console.error('Erreur lors du chargement des tests:', error);
                stateManager.addNotification(
                    `✕ Erreur: ${error instanceof Error ? error.message : 'Erreur inconnue'}`,
                    'error'
                );
            }
        }
        
        stateManager.setScreen(screenId);
        this.render();
    }

    /**
     * Charge la liste des patients
     */
    public async loadPatients(): Promise<void> {
        try {
            const patients = await apiService.getPatients();
            stateManager.setPatients(Array.isArray(patients) ? patients : (patients as any).results || []);
        } catch (error) {
            console.error('Erreur lors du chargement des patients:', error);
            stateManager.addNotification(
                `✕ Erreur: ${error instanceof Error ? error.message : 'Erreur inconnue'}`,
                'error'
            );
        }
    }

    /**
     * Sélectionne un patient pour le test
     */
    public selectPatient(patientId: number): void {
        console.log(`👤 Sélection du patient ${patientId}`);
        (window as any).__selectedPatientId = patientId;
        stateManager.setCurrentPatient(patientId);
    }

    /**
     * Récupère le patient actuellement sélectionné
     */
    public handleLogout(): void {
        if (confirm('Êtes-vous sûr de vouloir vous déconnecter?')) {
            apiService.logout();
            stateManager.clearPatient();
            stateManager.addNotification('✓ Déconnexion réussie', 'success');
            this.goToScreen('home-screen');
        }
    }

    /**
     * Affiche les détails d'un test
     */
    public viewTest(testId: number): void {
        console.log(`📊 Affichage du test ${testId}`);
        (window as any).__selectedTestId = testId;
        this.goToScreen('test-detail-screen');
    }

    /**
     * Rend l'interface
     */
    public render(): void {
        const app = document.querySelector('#app');
        if (!app) return;

        app.innerHTML = renderMainLayout();
    }
}

// Initialise l'app au démarrage
window.app = new AppGouv();

// Démarre l'app quand le DOM est prêt
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.app?.start();
    });
} else {
    window.app.start();
}
