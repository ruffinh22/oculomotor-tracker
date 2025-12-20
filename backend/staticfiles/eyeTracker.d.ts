/**
 * Module de suivi oculaire professionnel avec WebGazer
 * Haute précision avec filtres Kalman et lissage avancé
 */
interface Eye {
    x: number;
    y: number;
    area?: number;
    open?: boolean;
    confidence?: number;
}
interface GazeData {
    x: number;
    y: number;
    timestamp: number;
    leftEye: Eye | null;
    rightEye: Eye | null;
    confidence: number;
}
interface CalibrationPoint {
    screenX: number;
    screenY: number;
    gazeX: number;
    gazeY: number;
}
declare global {
    interface Window {
        webgazer: any;
        onGazeUpdate?: (data: GazeData) => void;
    }
}
export declare class EyeTracker {
    isCalibrated: boolean;
    gazeData: GazeData | null;
    previousGazeData: GazeData | null;
    calibrationPoints: CalibrationPoint[];
    isTracking: boolean;
    eyeOpenThreshold: number;
    private kalmanX;
    private kalmanY;
    private gazeHistory;
    private maxHistorySize;
    private leftEyeOpenCount;
    private rightEyeOpenCount;
    private eyeStateBuffer;
    /**
     * Initialise WebGazer avec affichage de la vidéo
     */
    init(): Promise<void>;
    /**
     * Affiche la vidéo de la caméra
     */
    private showWebcamVideo;
    /**
     * Masque la vidéo de la caméra
     */
    private hideWebcamVideo; /**
     * Configure l'écouteur de regard avec filtrage avancé
     */
    private setupGazeListener;
    /**
     * Détermine si un oeil est ouvert avec détection améliorée
     */
    private isEyeOpen;
    /**
     * Calcule la confiance du suivi oculaire
     */
    private calculateConfidence;
    /**
     * Détermine si les yeux sont ouverts
     */
    areEyesOpen(): boolean;
    /**
     * Retourne l'état des yeux (0: fermés, 1: un œil, 2: deux yeux)
     */
    /**
     * Retourne l'état des yeux (0: fermés, 1: un œil, 2: deux yeux)
     * Méthode améliorée basée sur les données actuelles
     */
    getEyeState(): number;
    /**
     * Obtient la position actuelle du regard
     */
    getGazePosition(): {
        x: number;
        y: number;
    } | null;
    /**
     * Calcule la stabilité du regard (variance)
     */
    getGazeStability(): number;
    /**
     * Ajoute un point de calibration
     */
    addCalibrationPoint(x: number, y: number): boolean;
    /**
     * Finalise la calibration
     */
    finalizeCalibration(): boolean;
    /**
     * Démarre le suivi du regard
     */
    startTracking(): void;
    /**
     * Arrête le suivi du regard
     */
    stopTracking(): void;
    /**
     * Arrête WebGazer
     */
    stop(): void;
}
export {};
//# sourceMappingURL=eyeTracker.d.ts.map