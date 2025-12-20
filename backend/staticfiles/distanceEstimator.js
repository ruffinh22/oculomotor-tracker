/**
 * Module d'analyse de distance œil-écran
 * Utilise des points de référence faciaux pour estimer la distance
 */
export class DistanceEstimator {
    constructor() {
        this.averageEyeDistance = 67; // mm
        this.typicalScreenDistance = 500; // mm
    }
    /**
     * Estime la distance œil-écran basée sur la détection faciale
     * En pratique, cela utilise la distance entre les yeux détectée
     */
    estimateDistance(leftEye, rightEye) {
        if (!leftEye || !rightEye) {
            return null;
        }
        // Calcule la distance pixel entre les deux yeux
        const pixelDistance = Math.sqrt(Math.pow(rightEye.x - leftEye.x, 2) +
            Math.pow(rightEye.y - leftEye.y, 2));
        if (pixelDistance === 0)
            return null;
        // Rapport de la distance réelle vs détectée
        // Cette formule est une estimation grossière
        // En production, il faudrait une calibration avec objets de référence
        const ratio = this.averageEyeDistance / pixelDistance;
        const estimatedDistance = this.typicalScreenDistance * ratio;
        // Limitation dans une plage réaliste (20-100cm)
        return Math.max(200, Math.min(1000, estimatedDistance));
    }
    /**
     * Détermine si la distance est acceptable pour le test
     */
    isDistanceAcceptable(distance) {
        // Distance acceptable: 30-70cm (300-700mm)
        return distance !== null && distance >= 300 && distance <= 700;
    }
    /**
     * Obtient un message sur la distance
     */
    getDistanceMessage(distance) {
        if (distance === null) {
            return 'Distance non détectable';
        }
        const distanceCm = Math.round(distance / 10) / 10;
        if (distance < 300) {
            return `Trop proche (${distanceCm}cm) - Éloignez-vous`;
        }
        else if (distance > 700) {
            return `Trop loin (${distanceCm}cm) - Rapprochez-vous`;
        }
        else {
            return `Distance acceptable (${distanceCm}cm)`;
        }
    }
}
//# sourceMappingURL=distanceEstimator.js.map