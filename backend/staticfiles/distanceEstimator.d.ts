/**
 * Module d'analyse de distance œil-écran
 * Utilise des points de référence faciaux pour estimer la distance
 */
interface Eye {
    x: number;
    y: number;
}
export declare class DistanceEstimator {
    averageEyeDistance: number;
    typicalScreenDistance: number;
    /**
     * Estime la distance œil-écran basée sur la détection faciale
     * En pratique, cela utilise la distance entre les yeux détectée
     */
    estimateDistance(leftEye: Eye | undefined, rightEye: Eye | undefined): number | null;
    /**
     * Détermine si la distance est acceptable pour le test
     */
    isDistanceAcceptable(distance: number | null): boolean;
    /**
     * Obtient un message sur la distance
     */
    getDistanceMessage(distance: number | null): string;
}
export {};
//# sourceMappingURL=distanceEstimator.d.ts.map