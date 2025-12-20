/**
 * Module de détection de cible
 * Gère le mouvement de la cible et détecte le suivi du regard
 */
export class TargetDetector {
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
        // Position de la cible
        this.targetX = canvasWidth / 2;
        this.targetY = canvasHeight / 2;
        // Limites du mouvement
        this.minX = this.targetRadius;
        this.maxX = canvasWidth - this.targetRadius;
        this.minY = this.targetRadius;
        this.maxY = canvasHeight - this.targetRadius;
    }
    /**
     * Met à jour la position de la cible
     */
    update() {
        // Mouvement de la cible
        this.targetX += this.vx;
        this.targetY += this.vy;
        // Rebond aux limites
        if (this.targetX <= this.minX || this.targetX >= this.maxX) {
            this.vx *= -1;
        }
        if (this.targetY <= this.minY || this.targetY >= this.maxY) {
            this.vy *= -1;
        }
        // Confinement
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
        // Calcule la distance entre le regard et la cible
        const distance = this.getDistance(gazePoint.x, gazePoint.y, this.targetX, this.targetY);
        const wasOnTarget = this.gazeOnTarget;
        this.gazeOnTarget = distance < this.gazeToleranceRadius && eyesOpen;
        // Gère le début d'une fixation
        if (this.gazeOnTarget && !wasOnTarget && eyesOpen) {
            this.gazeStartTime = timestamp;
            this.currentFixation = {
                startTime: timestamp,
                startX: this.targetX,
                startY: this.targetY,
                gazePoints: [],
            };
        }
        // Accumule le temps de fixation
        if (this.gazeOnTarget && this.currentFixation) {
            const fixationDuration = timestamp - (this.gazeStartTime || 0);
            this.totalGazeTime = fixationDuration;
            this.currentFixation.gazePoints.push({
                x: gazePoint.x,
                y: gazePoint.y,
                timestamp: timestamp,
            });
        }
        // Termine une fixation
        if (!this.gazeOnTarget && wasOnTarget && this.currentFixation) {
            this.currentFixation.endTime = timestamp;
            this.currentFixation.duration =
                timestamp - this.currentFixation.startTime;
            this.fixations.push(this.currentFixation);
            this.currentFixation = null;
            this.gazeStartTime = null;
        }
        // Historique
        this.gazeHistory.push({
            x: gazePoint.x,
            y: gazePoint.y,
            targetX: this.targetX,
            targetY: this.targetY,
            onTarget: this.gazeOnTarget,
            timestamp: timestamp,
        });
        // Garde seulement les 1000 derniers points
        if (this.gazeHistory.length > 1000) {
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
        // Cible principale
        ctx.fillStyle = 'rgba(255, 100, 0, 0.8)';
        ctx.beginPath();
        ctx.arc(this.targetX, this.targetY, this.targetRadius, 0, Math.PI * 2);
        ctx.fill();
        // Cercle de tolérance (invisible mais pour ref)
        if (this.gazeOnTarget) {
            ctx.strokeStyle = 'rgba(0, 255, 0, 0.5)';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(this.targetX, this.targetY, this.gazeToleranceRadius, 0, Math.PI * 2);
            ctx.stroke();
        }
        // Point blanc au centre
        ctx.fillStyle = 'white';
        ctx.beginPath();
        ctx.arc(this.targetX, this.targetY, this.targetRadius / 3, 0, Math.PI * 2);
        ctx.fill();
    }
    /**
     * Obtient le statut du suivi
     */
    getStatus() {
        return {
            targetPosition: {
                x: this.targetX,
                y: this.targetY,
            },
            gazeOnTarget: this.gazeOnTarget,
            totalGazeTime: this.totalGazeTime,
            fixationCount: this.fixations.length,
            gazeHistory: this.gazeHistory,
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
        // Position aléatoire initiale
        this.targetX =
            this.canvasWidth / 2 + (Math.random() - 0.5) * 200;
        this.targetY =
            this.canvasHeight / 2 + (Math.random() - 0.5) * 200;
    }
}
//# sourceMappingURL=targetDetector.js.map