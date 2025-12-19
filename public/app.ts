/**
 * Application principale - Suivi Oculaire Clinique
 * Orchestration de tous les modules
 * Version TypeScript pour navigateur (compilée vers public/app.js)
 */

// Types (répliqués depuis les modules)
interface Eye {
    x: number;
    y: number;
    area?: number;
}

interface GazeData {
    x: number;
    y: number;
    timestamp: number;
    leftEye: Eye | null;
    rightEye: Eye | null;
}

interface PatientData {
    name: string;
    age: string;
    testDate: string;
}

interface TestData {
    startTime: number | null;
    endTime: number | null;
    totalTime: number;
    gazeTime: number;
    fixations: Array<{
        startTime: number;
        startX: number;
        startY: number;
        endTime?: number;
        duration?: number;
        gazePoints: Array<{ x: number; y: number; timestamp: number }>;
    }>;
    gazeHistory: Array<{
        x: number;
        y: number;
        targetX: number;
        targetY: number;
        onTarget: boolean;
        timestamp: number;
    }>;
    distances: (number | null)[];
    eyeStatus: { leftEyeOpen: boolean; rightEyeOpen: boolean };
}

interface CalibrationPoint {
    x: number;
    y: number;
}

// État global
const AppState = {
    currentScreen: 'home-screen',
    eyeTracker: null as any,
    targetDetector: null as any,
    distanceEstimator: null as any,
    testAnalyzer: null as any,

    // Données patient
    patientData: {
        name: '',
        age: '',
        testDate: '',
    } as PatientData,

    // Données test
    testData: {
        startTime: null,
        endTime: null,
        totalTime: 0,
        gazeTime: 0,
        fixations: [],
        gazeHistory: [],
        distances: [],
        eyeStatus: { leftEyeOpen: false, rightEyeOpen: false },
    } as TestData,

    // État suivi
    isCalibrating: false,
    isTesting: false,
    calibrationIndex: 0,
    calibrationPoints: [
        { x: 0.1, y: 0.1 },
        { x: 0.5, y: 0.1 },
        { x: 0.9, y: 0.1 },
        { x: 0.1, y: 0.5 },
        { x: 0.5, y: 0.5 },
        { x: 0.9, y: 0.5 },
        { x: 0.1, y: 0.9 },
        { x: 0.5, y: 0.9 },
        { x: 0.9, y: 0.9 },
    ] as CalibrationPoint[],
};

// Initialisation
document.addEventListener('DOMContentLoaded', async () => {
    console.log('🔍 Initialisation de l\'application...');

    try {
        // Initialise WebGazer
        const eyeTrackerModule = await import('/src/eyeTracker.ts');
        const targetDetectorModule = await import('/src/targetDetector.ts');
        const distanceEstimatorModule = await import('/src/distanceEstimator.ts');
        const testAnalyzerModule = await import('/src/testAnalyzer.ts');

        AppState.eyeTracker = new eyeTrackerModule.EyeTracker();
        AppState.targetDetector = null; // Créé au démarrage du test
        AppState.distanceEstimator = new distanceEstimatorModule.DistanceEstimator();
        AppState.testAnalyzer = new testAnalyzerModule.TestAnalyzer();

        // Initialise WebGazer
        await AppState.eyeTracker.init();
        console.log('✅ WebGazer initialisé');

        // Configure la date par défaut
        const testDateInput = document.getElementById('test-date') as HTMLInputElement;
        testDateInput.valueAsDate = new Date();

        console.log('✅ Application prête');
    } catch (error) {
        console.error('❌ Erreur d\'initialisation:', error);
        alert('Erreur d\'initialisation: ' + (error as Error).message);
    }
});

/**
 * Change l'écran actif
 */
function switchScreen(screenId: string): void {
    document.querySelectorAll('.screen').forEach((s) => s.classList.remove('active'));
    const screen = document.getElementById(screenId);
    if (screen) {
        screen.classList.add('active');
        AppState.currentScreen = screenId;
    }
}

/**
 * Démarre la calibration
 */
async function startCalibration(): Promise<void> {
    const patientNameInput = document.getElementById('patient-name') as HTMLInputElement;
    const patientAgeInput = document.getElementById('patient-age') as HTMLInputElement;
    const testDateInput = document.getElementById('test-date') as HTMLInputElement;

    const patientName = patientNameInput.value.trim();
    const patientAge = patientAgeInput.value;
    const testDate = testDateInput.value;

    if (!patientName || !testDate) {
        alert('Veuillez remplir le nom et la date');
        return;
    }

    // Enregistre les données patient
    AppState.patientData = { name: patientName, age: patientAge, testDate };

    // Bascule vers l'écran de calibration
    switchScreen('calibration-screen');
    AppState.isCalibrating = true;
    AppState.calibrationIndex = 0;

    // Commence la calibration
    showNextCalibrationPoint();
}

/**
 * Affiche le prochain point de calibration
 */
function showNextCalibrationPoint(): void {
    if (AppState.calibrationIndex >= AppState.calibrationPoints.length) {
        // Fin de la calibration
        if (AppState.eyeTracker.finalizeCalibration()) {
            console.log('✅ Calibration complétée');
            startTest();
        } else {
            alert('Calibration échouée. Essayez à nouveau.');
            switchScreen('home-screen');
        }
        return;
    }

    const canvas = document.getElementById('calibration-canvas') as HTMLCanvasElement;
    const point = AppState.calibrationPoints[AppState.calibrationIndex];
    const pointDiv = document.getElementById('calibration-point') as HTMLDivElement;

    // Positionne le point
    pointDiv.style.left = point.x * canvas.offsetWidth + 'px';
    pointDiv.style.top = point.y * canvas.offsetHeight + 'px';

    // Met à jour le statut
    const statusDiv = document.getElementById('calibration-status') as HTMLParagraphElement;
    statusDiv.textContent = `Position ${AppState.calibrationIndex + 1}/${AppState.calibrationPoints.length}`;

    const progressFill = document.getElementById('calibration-progress') as HTMLDivElement;
    progressFill.style.width = ((AppState.calibrationIndex / AppState.calibrationPoints.length) * 100) + '%';

    // Attend 1 seconde avant de permettre le clic
    setTimeout(() => {
        pointDiv.style.cursor = 'pointer';
    }, 1000);
}

/**
 * Gère le clic sur un point de calibration
 */
document.addEventListener('click', (e: MouseEvent) => {
    if (!AppState.isCalibrating) return;

    const pointDiv = document.getElementById('calibration-point') as HTMLDivElement;
    if (!pointDiv) return;

    const rect = pointDiv.getBoundingClientRect();

    // Vérifie si le clic est proche du point (tolérance de 100px)
    const distance = Math.sqrt(
        Math.pow(e.clientX - (rect.left + rect.width / 2), 2) +
        Math.pow(e.clientY - (rect.top + rect.height / 2), 2)
    );

    if (distance < 100) {
        // Enregistre le point de calibration
        AppState.eyeTracker.addCalibrationPoint(
            ((e.clientX - rect.left) / pointDiv.offsetWidth) * 100,
            ((e.clientY - rect.top) / pointDiv.offsetHeight) * 100
        );

        AppState.calibrationIndex++;
        showNextCalibrationPoint();
    }
});

/**
 * Saute la calibration
 */
function skipCalibration(): void {
    AppState.eyeTracker.isCalibrated = true;
    startTest();
}

/**
 * Démarre le test
 */
function startTest(): void {
    AppState.isCalibrating = false;
    AppState.isTesting = true;
    switchScreen('test-screen');

    const canvas = document.getElementById('test-canvas') as HTMLCanvasElement;
    const ctx = canvas.getContext('2d');

    if (!ctx) {
        console.error('Impossible d\'obtenir le contexte 2D du canvas');
        return;
    }

    // Redimensionne le canvas
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    // Initialise le détecteur de cible
    import('/src/targetDetector.ts').then((module) => {
        AppState.targetDetector = new module.TargetDetector(canvas.width, canvas.height);
        AppState.targetDetector.reset();

        // Initialise les données de test
        AppState.testData.startTime = Date.now();
        AppState.testData.gazeTime = 0;
        AppState.testData.fixations = [];
        AppState.testData.gazeHistory = [];
        AppState.testData.distances = [];

        // Lance la boucle d'animation
        AppState.eyeTracker.startTracking();
        animationLoop(canvas, ctx);
    });
}

/**
 * Boucle d'animation principale
 */
function animationLoop(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D): void {
    if (!AppState.isTesting || AppState.currentScreen !== 'test-screen') {
        return;
    }

    // Efface le canvas
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (AppState.targetDetector) {
        // Met à jour la cible
        AppState.targetDetector.update();

        // Obtient la position du regard
        const gazePos = AppState.eyeTracker.getGazePosition();
        const eyesOpen = AppState.eyeTracker.areEyesOpen();
        const timestamp = Date.now() - AppState.testData.startTime!;

        // Met à jour le suivi du regard
        AppState.targetDetector.updateGaze(gazePos, eyesOpen, timestamp);

        // Dessine la cible
        AppState.targetDetector.draw(ctx);

        // Met à jour l'interface
        updateTestUI(gazePos, eyesOpen, timestamp);

        // Affiche l'indicateur de regard
        if (gazePos) {
            const indicator = document.getElementById('gaze-indicator') as HTMLDivElement;
            indicator.style.left = gazePos.x - 15 + 'px';
            indicator.style.top = gazePos.y - 15 + 'px';
            indicator.style.display = 'block';
        }
    }

    requestAnimationFrame(() => animationLoop(canvas, ctx));
}

/**
 * Met à jour l'interface du test
 */
function updateTestUI(gazePos: any, eyesOpen: boolean, timestamp: number): void {
    // Temps écoulé
    const elapsedSeconds = Math.floor(timestamp / 1000);
    const elapsedTimeEl = document.getElementById('elapsed-time');
    if (elapsedTimeEl) {
        elapsedTimeEl.textContent = elapsedSeconds + 's';
    }

    // Temps de fixation
    if (AppState.targetDetector) {
        const gazeTimeMs = AppState.targetDetector.totalGazeTime;
        const gazeSeconds = (gazeTimeMs / 1000).toFixed(1);
        const gazeTimeEl = document.getElementById('gaze-time');
        if (gazeTimeEl) {
            gazeTimeEl.textContent = gazeSeconds + 's';
        }
        AppState.testData.gazeTime = gazeTimeMs;
    }

    // Distance œil-écran
    if (AppState.eyeTracker.gazeData) {
        const distance = AppState.distanceEstimator.estimateDistance(
            AppState.eyeTracker.gazeData.leftEye,
            AppState.eyeTracker.gazeData.rightEye
        );

        if (distance) {
            AppState.testData.distances.push(distance);
            const distanceCm = (distance / 10).toFixed(1);
            const eyeDistanceEl = document.getElementById('eye-distance');
            if (eyeDistanceEl) {
                eyeDistanceEl.textContent = distanceCm + ' cm';
            }
        }
    }

    // Statut des yeux
    const leftEyeOpen = AppState.eyeTracker.gazeData?.leftEye?.open ?? false;
    const rightEyeOpen = AppState.eyeTracker.gazeData?.rightEye?.open ?? false;
    AppState.testData.eyeStatus = { leftEyeOpen, rightEyeOpen };

    let eyeStatusText = '';
    if (leftEyeOpen && rightEyeOpen) eyeStatusText = '👀 Les deux';
    else if (leftEyeOpen) eyeStatusText = '👁️ Gauche';
    else if (rightEyeOpen) eyeStatusText = '👁️ Droit';
    else eyeStatusText = '❌ Fermés';

    const eyeStatusEl = document.getElementById('eye-status');
    if (eyeStatusEl) {
        eyeStatusEl.textContent = eyeStatusText;
    }

    // Retour du suivi
    let feedbackText = '';
    if (!AppState.eyeTracker.gazeData) {
        feedbackText = '⏳ Détection du regard...';
    } else if (!eyesOpen) {
        feedbackText = '👁️ Ouvrez les yeux';
    } else if (AppState.targetDetector.gazeOnTarget) {
        feedbackText = '✅ Cible détectée - Continuez à suivre';
    } else {
        feedbackText = '🎯 Suivez la cible';
    }

    const gazeFeedbackEl = document.getElementById('gaze-feedback');
    if (gazeFeedbackEl) {
        gazeFeedbackEl.textContent = feedbackText;
    }
}

/**
 * Termine le test
 */
function endTest(): void {
    AppState.isTesting = false;
    AppState.eyeTracker.stopTracking();

    // Finalise les données
    AppState.testData.endTime = Date.now();
    AppState.testData.totalTime = AppState.testData.endTime - (AppState.testData.startTime || 0);

    if (AppState.targetDetector) {
        AppState.testData.fixations = AppState.targetDetector.fixations;
        AppState.testData.gazeHistory = AppState.targetDetector.gazeHistory;
    }

    // Ajoute le nom et la date du patient
    const testDataWithPatient = {
        ...AppState.testData,
        patientName: AppState.patientData.name,
        testDate: AppState.patientData.testDate,
    };

    // Analyse les résultats
    const analysis = AppState.testAnalyzer.analyze(testDataWithPatient);

    // Affiche les résultats
    displayResults(analysis);
    switchScreen('results-screen');
}

/**
 * Affiche les résultats
 */
function displayResults(analysis: any): void {
    const summary = analysis.summary;
    const stats = analysis.statistics;
    const evaluation = analysis.clinicalEvaluation;

    // Remplissage des résultats
    const resultPatientName = document.getElementById('result-patient-name') as HTMLParagraphElement;
    if (resultPatientName) resultPatientName.textContent = summary.patientName;

    const resultDate = document.getElementById('result-date') as HTMLParagraphElement;
    if (resultDate) resultDate.textContent = summary.testDate;

    const resultTotalTime = document.getElementById('result-total-time') as HTMLParagraphElement;
    if (resultTotalTime) resultTotalTime.textContent = summary.totalDuration;

    const resultGazeTime = document.getElementById('result-gaze-time') as HTMLParagraphElement;
    if (resultGazeTime) resultGazeTime.textContent = summary.gazeDuration;

    const resultTrackingPercentage = document.getElementById('result-tracking-percentage') as HTMLParagraphElement;
    if (resultTrackingPercentage) resultTrackingPercentage.textContent = summary.trackingPercentage;

    const resultFixationCount = document.getElementById('result-fixation-count') as HTMLParagraphElement;
    if (resultFixationCount) resultFixationCount.textContent = summary.fixationCount.toString();

    const resultAvgDistance = document.getElementById('result-avg-distance') as HTMLParagraphElement;
    if (resultAvgDistance) resultAvgDistance.textContent = stats.averageEyeScreenDistance;

    const resultEyeStatus = document.getElementById('result-eye-status') as HTMLParagraphElement;
    if (resultEyeStatus) resultEyeStatus.textContent = summary.eyeStatus;

    const clinicalEvaluation = document.getElementById('clinical-evaluation') as HTMLParagraphElement;
    if (clinicalEvaluation) clinicalEvaluation.textContent = evaluation.evaluation;

    // Graphique de suivi
    drawTrackingChart();
}

/**
 * Dessine le graphique de suivi
 */
function drawTrackingChart(): void {
    const canvas = document.getElementById('tracking-chart') as HTMLCanvasElement;
    const ctx = canvas.getContext('2d');

    if (!ctx) return;

    if (!AppState.testData.gazeHistory || AppState.testData.gazeHistory.length === 0) {
        ctx.fillStyle = '#999';
        ctx.fillText('Pas de données de suivi', 20, 30);
        return;
    }

    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    // Normalise les données
    const maxTime = Math.max(...AppState.testData.gazeHistory.map((g) => g.timestamp));
    const timeScale = canvas.width / maxTime;
    const heightScale = canvas.height / 2;

    // Dessine le fond
    ctx.fillStyle = '#f0f0f0';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Dessine l'historique du regard
    ctx.strokeStyle = '#0066cc';
    ctx.lineWidth = 2;
    ctx.beginPath();

    let firstPoint = true;
    AppState.testData.gazeHistory.forEach((point) => {
        const x = point.timestamp * timeScale;
        const y = point.onTarget ? canvas.height / 4 : (canvas.height * 3) / 4;

        if (firstPoint) {
            ctx.moveTo(x, y);
            firstPoint = false;
        } else {
            ctx.lineTo(x, y);
        }
    });

    ctx.stroke();

    // Légende
    ctx.fillStyle = '#0066cc';
    ctx.fillRect(10, 10, 15, 15);
    ctx.fillStyle = '#000';
    ctx.font = '12px Arial';
    ctx.fillText('Regard sur cible', 30, 22);

    // Ligne de temps
    ctx.strokeStyle = '#ddd';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, canvas.height / 2);
    ctx.lineTo(canvas.width, canvas.height / 2);
    ctx.stroke();
}

/**
 * Imprime les résultats
 */
function printResults(): void {
    window.print();
}

/**
 * Nouveau test
 */
function newTest(): void {
    // Réinitialise l'état
    AppState.testData = {
        startTime: null,
        endTime: null,
        totalTime: 0,
        gazeTime: 0,
        fixations: [],
        gazeHistory: [],
        distances: [],
        eyeStatus: { leftEyeOpen: false, rightEyeOpen: false },
    };

    AppState.isTesting = false;
    switchScreen('home-screen');
}

// Global functions (pour les événements HTML)
declare global {
    function startCalibration(): Promise<void>;
    function skipCalibration(): void;
    function endTest(): void;
    function newTest(): void;
    function printResults(): void;
}

(window as any).startCalibration = startCalibration;
(window as any).skipCalibration = skipCalibration;
(window as any).endTest = endTest;
(window as any).newTest = newTest;
(window as any).printResults = printResults;
