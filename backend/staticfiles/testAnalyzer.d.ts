/**
 * Module d'analyse avancée et de rapport professionnel
 * Génère les statistiques cliniques de haute précision
 */
interface TestData {
    totalTime: number;
    gazeTime: number;
    patientName: string;
    testDate: string;
    fixations: Array<{
        startTime: number;
        endTime?: number;
        duration?: number;
        x?: number;
        y?: number;
    }>;
    saccades: Array<{
        startTime: number;
        endTime: number;
        duration: number;
        amplitude: number;
        velocity: number;
    }>;
    gazeHistory: Array<{
        onTarget: boolean;
        x: number;
        y: number;
        timestamp: number;
        confidence: number;
    }>;
    distances: (number | null)[];
    eyeStatus: {
        leftEyeOpen: boolean;
        rightEyeOpen: boolean;
        state: number;
    };
}
interface TestSummary {
    patientName: string;
    testDate: string;
    totalDuration: string;
    gazeDuration: string;
    trackingPercentage: string;
    fixationCount: number;
    saccadeCount: number;
    averageFixationDuration: string;
    eyeStatus: string;
    gazeStability: number;
    trackingConfidence: number;
}
interface TestStatistics {
    totalTestTime: string;
    totalGazeTime: string;
    gazeTimePercentage: string;
    fixationCount: number;
    saccadeCount: number;
    averageFixationDuration: string;
    maxFixationDuration: string;
    minFixationDuration: string;
    averageEyeScreenDistance: string;
    gazeStability: number;
    trackingConfidence: number;
    eyeStateDistribution: {
        bothEyesOpen: number;
        oneEyeOpen: number;
        eyesClosed: number;
    };
}
interface ClinicalEvaluation {
    evaluation: string;
    rating: string;
    trackingPercentage: string;
    recommendedFollowUp: string;
}
interface TrackingQuality {
    quality: string;
    score: string;
    details: {
        gazePercentage: string;
        stability: string;
        consistency: string;
    };
}
export declare class TestAnalyzer {
    testData: TestData | null;
    /**
     * Analyse les données du test
     */
    analyze(testData: TestData): {
        summary: TestSummary;
        statistics: TestStatistics;
        clinicalEvaluation: ClinicalEvaluation;
        trackingQuality: TrackingQuality;
    };
    /**
     * Génère le résumé du test
     */
    private generateSummary;
    /**
     * Génère les statistiques détaillées
     */
    private generateStatistics;
    /**
     * Génère l'évaluation clinique
     */
    private generateClinicalEvaluation;
    /**
     * Évalue la qualité du suivi
     */
    private assessTrackingQuality;
    /**
     * Calcule la durée moyenne des fixations
     */
    private calculateAverageFixationDuration;
    /**
     * Calcule la durée max des fixations
     */
    private calculateMaxFixationDuration;
    /**
     * Calcule la durée min des fixations
     */
    private calculateMinFixationDuration;
    /**
     * Calcule la distance oeil-écran moyenne
     */
    private calculateAverageDistance;
    /**
     * Calcule la stabilité du regard
     */
    private calculateGazeStability;
    /**
     * Calcule la cohérence du suivi
     */
    private calculateConsistency;
    /**
     * Obtient le statut oculaire
     */
    private getEyeStatus;
}
export default TestAnalyzer;
//# sourceMappingURL=testAnalyzer.d.ts.map