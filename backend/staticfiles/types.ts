/**
 * Types TypeScript pour le client
 */

export interface GazePoint {
    x: number;
    y: number;
}

export interface EyeData {
    x: number;
    y: number;
    area?: number;
    open?: boolean;
}

export interface GazeData {
    x: number;
    y: number;
    timestamp: number;
    leftEye: EyeData | null;
    rightEye: EyeData | null;
}

export interface PatientData {
    name: string;
    age: string;
    testDate: string;
}

export interface TestResultsData {
    patientName: string;
    testDate: string;
    startTime: number;
    endTime: number;
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
    eyeStatus: {
        leftEyeOpen: boolean;
        rightEyeOpen: boolean;
    };
}

export interface CalibrationPoint {
    x: number;
    y: number;
}
