/**
 * Composants UI réutilisables
 * Écrans et widgets communs
 */
import stateManager from '../services/state.service';
/**
 * Affiche les notifications
 */
export function renderNotifications() {
    const state = stateManager.getState();
    return state.notifications
        .map((notif) => `
        <div class="notification notification-${notif.type}">
            <span class="notification-message">${notif.message}</span>
            <button class="notification-close" onclick="document.querySelector('[data-notif-id=${notif.id}]').remove()">×</button>
        </div>
    `)
        .join('');
}
/**
 * Barre de navigation DSFR
 */
export function renderNavbar() {
    const state = stateManager.getState();
    return `
        <div class="navbar-menu" id="navbarMenu">
            ${state.isAuthenticated
        ? `
                <span class="navbar-user">Connecté en tant que ${state.patient?.firstName}</span>
                <button class="btn btn-secondary" onclick="app.logout()">Déconnexion</button>
            `
        : ''}
        </div>
    `;
}
/**
 * Écran d'accueil
 */
export function renderHomeScreen() {
    const state = stateManager.getState();
    if (!state.isAuthenticated) {
        return `
            <div class="screen home-screen">
                <div class="container">
                    <h1>Système de Suivi Oculaire Clinique</h1>
                    <p class="subtitle">Précision et fiabilité pour l'orthoptie</p>
                    
                    <div class="auth-forms">
                        <div class="form-container">
                            <h2>Connexion</h2>
                            <form id="loginForm">
                                <input type="text" placeholder="Nom d'utilisateur" id="loginUsername" required />
                                <input type="password" placeholder="Mot de passe" id="loginPassword" required />
                                <button type="submit" class="btn btn-primary">Se connecter</button>
                            </form>
                        </div>

                        <div class="form-container">
                            <h2>Inscription</h2>
                            <form id="registerForm">
                                <input type="text" placeholder="Nom d'utilisateur" id="regUsername" required />
                                <input type="email" placeholder="Email" id="regEmail" required />
                                <input type="password" placeholder="Mot de passe" id="regPassword" required />
                                <input type="text" placeholder="Prénom" id="regFirstName" required />
                                <input type="text" placeholder="Nom" id="regLastName" required />
                                <input type="number" placeholder="Âge" id="regAge" required />
                                <button type="submit" class="btn btn-primary">S'inscrire</button>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
    return `
        <div class="screen home-screen authenticated">
            <div class="container">
                <h1>Bienvenue, ${state.patient?.firstName} ${state.patient?.lastName}</h1>
                <p class="subtitle">Sélectionnez une action</p>

                <div class="actions-grid">
                    <div class="action-card" onclick="app.goToScreen('calibration-screen')">
                        <h3>🎯 Nouvelle Calibration</h3>
                        <p>Calibrer l'eye tracker pour une précision optimale</p>
                    </div>

                    <div class="action-card" onclick="app.goToScreen('test-screen')">
                        <h3>🔍 Nouveau Test</h3>
                        <p>Effectuer un test de suivi oculaire</p>
                    </div>

                    <div class="action-card" onclick="app.goToScreen('results-screen')">
                        <h3>📊 Mes Résultats</h3>
                        <p>Consulter les tests précédents</p>
                    </div>

                    <div class="action-card" onclick="app.goToScreen('statistics-screen')">
                        <h3>📈 Statistiques</h3>
                        <p>Analyse des tendances</p>
                    </div>
                </div>
            </div>
        </div>
    `;
}
/**
 * Écran de calibration
 */
export function renderCalibrationScreen() {
    const state = stateManager.getState();
    const calibrated = state.isCalibrated;
    return `
        <div class="screen calibration-screen">
            <div class="container">
                <h2>Calibration de l'Eye Tracker</h2>
                
                <div class="calibration-instructions">
                    <p>Veuillez suivre les points qui apparaîtront à l'écran.</p>
                    <p>Assurez-vous que votre caméra web est activée et que vous êtes bien positionné.</p>
                </div>

                <div id="calibrationContainer" class="calibration-container">
                    <canvas id="calibrationCanvas" width="800" height="600"></canvas>
                </div>

                <div class="calibration-status">
                    <p>Points calibrés: ${state.calibrationPoints.length}/5</p>
                    ${calibrated
        ? '<p class="success">✓ Calibration réussie!</p>'
        : ''}
                </div>

                <div class="button-group">
                    <button class="btn btn-primary" id="startCalibration">Démarrer la calibration</button>
                    ${calibrated
        ? `<button class="btn btn-success" onclick="app.goToScreen('test-screen')">Continuer vers le test</button>`
        : ''}
                    <button class="btn btn-secondary" onclick="app.goToScreen('home-screen')">Retour</button>
                </div>
            </div>
        </div>
    `;
}
/**
 * Écran de test
 */
export function renderTestScreen() {
    const state = stateManager.getState();
    const testActive = !!state.currentTest;
    return `
        <div class="screen test-screen">
            <div class="container">
                <h2>Test de Suivi Oculaire</h2>

                <div id="testContainer" class="test-container">
                    <canvas id="testCanvas" width="1024" height="768"></canvas>
                </div>

                ${testActive
        ? `
                    <div class="test-stats">
                        <div class="stat">
                            <label>Durée:</label>
                            <span id="testDuration">0s</span>
                        </div>
                        <div class="stat">
                            <label>Pourcentage de suivi:</label>
                            <span id="testTracking">0%</span>
                        </div>
                        <div class="stat">
                            <label>Fixations:</label>
                            <span id="testFixations">0</span>
                        </div>
                    </div>
                `
        : ''}

                <div class="button-group">
                    ${!testActive
        ? '<button class="btn btn-primary" id="startTest">Démarrer le test</button>'
        : '<button class="btn btn-danger" id="stopTest">Arrêter le test</button>'}
                    <button class="btn btn-secondary" onclick="app.goToScreen('home-screen')">Retour</button>
                </div>
            </div>
        </div>
    `;
}
/**
 * Écran de résultats
 */
export function renderResultsScreen() {
    const state = stateManager.getState();
    return `
        <div class="screen results-screen">
            <div class="container">
                <div class="results-header">
                    <div class="results-title-section">
                        <h2>📊 Mes Résultats de Tests</h2>
                        <p class="results-subtitle">Historique complet de vos tests de suivi oculaire</p>
                    </div>
                    <div class="results-stats-summary">
                        <div class="stat-box">
                            <span class="stat-number">${state.testResults.length}</span>
                            <span class="stat-label">Tests</span>
                        </div>
                        <div class="stat-box">
                            <span class="stat-number">${state.testResults.length > 0 ? (state.testResults.reduce((sum, t) => sum + t.tracking_percentage, 0) / state.testResults.length).toFixed(1) : 0}%</span>
                            <span class="stat-label">Suivi moyen</span>
                        </div>
                    </div>
                </div>

                ${state.testResults.length === 0
        ? `
                    <div class="empty-state">
                        <div class="empty-icon">📭</div>
                        <h3>Aucun test disponible</h3>
                        <p>Commencez par effectuer un test pour voir vos résultats ici</p>
                        <button class="btn btn-primary" onclick="app.goToScreen('test-screen')">Nouveau Test</button>
                    </div>
                `
        : `
                    <div class="results-filters">
                        <div class="filter-group">
                            <label>Trier par:</label>
                            <select id="sortResults">
                                <option value="recent">Plus récents d'abord</option>
                                <option value="oldest">Plus anciens d'abord</option>
                                <option value="best">Meilleur résultat</option>
                                <option value="worst">Moins bon résultat</option>
                            </select>
                        </div>
                    </div>

                    <div class="results-list">
                        ${state.testResults
            .sort((a, b) => new Date(b.test_date).getTime() - new Date(a.test_date).getTime())
            .map((result, index) => {
            const date = new Date(result.test_date);
            const timeAgo = getTimeAgo(date);
            return `
                            <div class="result-card result-${result.result}" data-result-id="${result.id}">
                                <div class="result-card-inner">
                                    <div class="result-visual">
                                        <div class="result-icon result-${result.result}">
                                            ${getResultIcon(result.result)}
                                        </div>
                                    </div>
                                    
                                    <div class="result-content">
                                        <div class="result-header">
                                            <h3>Test #${index + 1} - ${state.patient?.firstName} ${state.patient?.lastName}</h3>
                                            <span class="result-badge result-${result.result}">${result.result.toUpperCase()}</span>
                                        </div>
                                        
                                        <div class="result-time">
                                            <span class="time-date">${date.toLocaleDateString('fr-FR')}</span>
                                            <span class="time-ago">${timeAgo}</span>
                                        </div>
                                        
                                        <div class="result-metrics">
                                            <div class="metric">
                                                <span class="metric-icon">⏱️</span>
                                                <div class="metric-content">
                                                    <span class="metric-label">Durée</span>
                                                    <span class="metric-value">${result.duration.toFixed(1)}s</span>
                                                </div>
                                            </div>
                                            <div class="metric">
                                                <span class="metric-icon">👁️</span>
                                                <div class="metric-content">
                                                    <span class="metric-label">Suivi</span>
                                                    <span class="metric-value">${result.tracking_percentage.toFixed(1)}%</span>
                                                </div>
                                            </div>
                                            <div class="metric">
                                                <span class="metric-icon">👀</span>
                                                <div class="metric-content">
                                                    <span class="metric-label">Regard</span>
                                                    <span class="metric-value">${result.gaze_time.toFixed(1)}s</span>
                                                </div>
                                            </div>
                                            <div class="metric">
                                                <span class="metric-icon">📍</span>
                                                <div class="metric-content">
                                                    <span class="metric-label">Fixations</span>
                                                    <span class="metric-value">${result.fixation_count}</span>
                                                </div>
                                            </div>
                                        </div>
                                        
                                        <div class="result-progress">
                                            <div class="progress-bar">
                                                <div class="progress-fill" style="width: ${result.tracking_percentage}%"></div>
                                            </div>
                                            <span class="progress-label">Précision du suivi</span>
                                        </div>
                                    </div>
                                    
                                    <div class="result-actions">
                                        <button class="btn btn-sm btn-primary" onclick="app.viewTest(${result.id})">Détails</button>
                                        <button class="btn btn-sm btn-secondary" onclick="app.exportTestPDF(${result.id})">📥 PDF</button>
                                    </div>
                                </div>
                            </div>
                        `;
        })
            .join('')}
                    </div>

                    <div class="results-footer">
                        <button class="btn btn-lg btn-primary" onclick="app.exportAllTestsPDF()">📥 Exporter tous les résultats</button>
                        <button class="btn btn-lg btn-secondary" onclick="app.goToScreen('statistics-screen')">📈 Voir les statistiques</button>
                    </div>
                `}

                <div class="button-group">
                    <button class="btn btn-secondary" onclick="app.goToScreen('home-screen')">← Retour</button>
                </div>
            </div>
        </div>
    `;
}
/**
 * Helper pour obtenir l'icône du résultat
 */
function getResultIcon(result) {
    switch (result) {
        case 'excellent':
            return '⭐';
        case 'good':
            return '✓';
        case 'acceptable':
            return '⚠️';
        case 'poor':
            return '✗';
        default:
            return '?';
    }
}
/**
 * Helper pour obtenir le texte "il y a X temps"
 */
function getTimeAgo(date) {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    if (days > 0)
        return `il y a ${days} jour${days > 1 ? 's' : ''}`;
    if (hours > 0)
        return `il y a ${hours}h`;
    if (minutes > 0)
        return `il y a ${minutes}min`;
    return 'à l\'instant';
}
/**
 * Écran de statistiques
 */
export function renderStatisticsScreen() {
    const state = stateManager.getState();
    const stats = state.statistics;
    return `
        <div class="screen statistics-screen">
            <div class="container">
                <h2>Statistiques</h2>

                ${!stats
        ? '<p>Aucune statistique disponible.</p>'
        : `
                    <div class="statistics-grid">
                        <div class="stat-card">
                            <h3>Tests effectués</h3>
                            <p class="stat-value">${stats.total_tests || 0}</p>
                        </div>

                        <div class="stat-card">
                            <h3>Suivi moyen</h3>
                            <p class="stat-value">${(stats.avg_tracking || 0).toFixed(1)}%</p>
                        </div>

                        <div class="stat-card">
                            <h3>Meilleur résultat</h3>
                            <p class="stat-value">${stats.best_result || '-'}</p>
                        </div>

                        <div class="stat-card">
                            <h3>Stabilité moyenne</h3>
                            <p class="stat-value">${(stats.avg_stability || 0).toFixed(2)}</p>
                        </div>
                    </div>
                `}

                <div class="button-group">
                    <button class="btn btn-secondary" onclick="app.goToScreen('home-screen')">Retour</button>
                </div>
            </div>
        </div>
    `;
}
//# sourceMappingURL=screens.js.map