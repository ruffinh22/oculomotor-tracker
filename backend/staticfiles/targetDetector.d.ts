/**
 * Module de détection de cible
 * Gère le mouvement de la cible et détecte le suivi du regard
 */
interface Fixation {
    startTime: number;
    startX: number;
    startY: number;
    endTime?: number;
    duration?: number;
    gazePoints: Array<{
        x: number;
        y: number;
        timestamp: number;
    }>;
}
interface GazeHistoryPoint {
    x: number;
    y: number;
    targetX: number;
    targetY: number;
    onTarget: boolean;
    timestamp: number;
}
export declare class TargetDetector {
    canvasWidth: number;
    canvasHeight: number;
    targetX: number;
    targetY: number;
    targetRadius: number;
    vx: number;
    vy: number;
    minX: number;
    maxX: number;
    minY: number;
    maxY: number;
    gazeOnTarget: boolean;
    gazeStartTime: number | null;
    totalGazeTime: number;
    gazeToleranceRadius: number;
    fixations: Fixation[];
    currentFixation: Fixation | null;
    gazeHistory: GazeHistoryPoint[];
    constructor(canvasWidth: number, canvasHeight: number);
    /**
     * Met à jour la position de la cible
     */
    update(): void;
    /**
     * Analyse le regard par rapport à la cible
     */
    updateGaze(gazePoint: {
        x: number;
        y: number;
    } | null, eyesOpen: boolean, timestamp: number): void;
    /**
     * Calcule la distance euclidienne
     */
    private getDistance;
    /**
     * Dessine la cible sur le canvas
     */
    draw(ctx: CanvasRenderingContext2D): void;
    /**
     * Obtient le statut du suivi
     */
    getStatus(): {
        targetPosition: {
            x: number;
            y: number;
        };
        gazeOnTarget: boolean;
        totalGazeTime: number;
        fixationCount: number;
        gazeHistory: GazeHistoryPoint[];
    };
    /**
     * Réinitialise la détection
     */
    reset(): void;
}
export {};
//# sourceMappingURL=targetDetector.d.ts.map