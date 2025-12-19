/**
 * Composants UI DSFR - Système de Design de l'État
 * Design gouvernemental français
 */

import stateManager from '../services/state.service';

/**
 * Barre de navigation DSFR
 */
export function renderNavbarContent(): string {
    const state = stateManager.getState();
    return state.isAuthenticated
        ? `
        <span class="navbar-user">Connecté: <strong>${state.patient?.firstName} ${state.patient?.lastName}</strong></span>
        <button class="btn btn-secondary" onclick="app.logout()">Déconnexion</button>
    `
        : '';
}

/**
 * Affiche les notifications DSFR
 */
export function renderNotifications(): string {
    const state = stateManager.getState();
    return state.notifications
        .map(
            (notif) => `
        <div class="notification notification-${notif.type}" data-notif-id="${notif.id}">
            <span class="notification-message">${notif.message}</span>
            <button class="notification-close" onclick="document.querySelector('[data-notif-id=${notif.id}]').remove()">×</button>
        </div>
    `
        )
        .join('');
}

/**
 * Écran d'accueil DSFR
 */
export function renderHomeScreen(): string {
    const state = stateManager.getState();

    if (!state.isAuthenticated) {
        return `
            <div class="screen home-screen">
                <div class="container">
                    <h1>Système de Suivi Oculaire Clinique</h1>
                    <p class="subtitle">
                        Service public pour l'analyse précise du suivi oculaire en orthoptie
                    </p>

                    <div class="auth-forms">
                        <div class="form-container">
                            <h2>Connexion</h2>
                            <form id="loginForm">
                                <div class="form-group">
                                    <label for="loginUsername">Nom d'utilisateur</label>
                                    <input
                                        type="text"
                                        id="loginUsername"
                                        placeholder="Votre identifiant"
                                        required
                                    />
                                </div>
                                <div class="form-group">
                                    <label for="loginPassword">Mot de passe</label>
                                    <input
                                        type="password"
                                        id="loginPassword"
                                        placeholder="Votre mot de passe"
                                        required
                                    />
                                </div>
                                <button type="submit" class="btn btn-primary">
                                    Se connecter
                                </button>
                                <p style="text-align: center; font-size: 0.9rem; color: #666;">
                                    <a href="#" style="color: #000091;">Mot de passe oublié?</a>
                                </p>
                            </form>
                        </div>

                        <div class="form-container">
                            <h2>Nouvel utilisateur</h2>
                            <form id="registerForm">
                                <div class="form-group">
                                    <label for="regUsername">Nom d'utilisateur</label>
                                    <input
                                        type="text"
                                        id="regUsername"
                                        placeholder="Choisissez votre identifiant"
                                        required
                                    />
                                </div>
                                <div class="form-group">
                                    <label for="regFirstName">Prénom</label>
                                    <input
                                        type="text"
                                        id="regFirstName"
                                        placeholder="Votre prénom"
                                        required
                                    />
                                </div>
                                <div class="form-group">
                                    <label for="regLastName">Nom</label>
                                    <input
                                        type="text"
                                        id="regLastName"
                                        placeholder="Votre nom"
                                        required
                                    />
                                </div>
                                <div class="form-group">
                                    <label for="regEmail">Adresse email</label>
                                    <input
                                        type="email"
                                        id="regEmail"
                                        placeholder="exemple@gouv.fr"
                                        required
                                    />
                                </div>
                                <div class="form-group">
                                    <label for="regAge">Âge</label>
                                    <input
                                        type="number"
                                        id="regAge"
                                        placeholder="Votre âge"
                                        min="18"
                                        max="120"
                                        required
                                    />
                                </div>
                                <div class="form-group">
                                    <label for="regPassword">Mot de passe</label>
                                    <input
                                        type="password"
                                        id="regPassword"
                                        placeholder="Au moins 8 caractères"
                                        required
                                    />
                                </div>
                                <button type="submit" class="btn btn-primary">
                                    S'inscrire
                                </button>
                            </form>
                        </div>
                    </div>

                    <div style="margin-top: 3rem; padding: 2rem; background-color: #e3f2fd; border-radius: 4px; border-left: 4px solid #0078d4;">
                        <h3 style="margin-top: 0; color: #000091;">ℹ️ À propos du service</h3>
                        <p>
                            Cette application de suivi oculaire clinique a été développée pour assister
                            les professionnels de santé dans l'analyse précise du suivi oculaire en orthoptie.
                        </p>
                        <p>
                            Le service est sécurisé et conforme aux normes gouvernementales de protection
                            des données personnelles.
                        </p>
                        <p style="margin-bottom: 0;">
                            <a href="#" style="color: #000091; font-weight: 600;">En savoir plus sur ce service →</a>
                        </p>
                    </div>
                </div>
            </div>
        `;
    }

    return `
        <div class="screen home-screen authenticated">
            <div class="container">
                <h1>Bienvenue, ${state.patient?.firstName}</h1>
                <p class="subtitle">Sélectionnez une action pour commencer</p>

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
                        <p>Consulter les tests précédents et l'analyse</p>
                    </div>

                    <div class="action-card" onclick="app.goToScreen('statistics-screen')">
                        <h3>📈 Statistiques</h3>
                        <p>Visualiser les tendances et la progression</p>
                    </div>
                </div>

                <div style="margin-top: 3rem; padding: 2rem; background-color: #f0f8f0; border-radius: 4px; border-left: 4px solid #27ae60;">
                    <h3 style="margin-top: 0; color: #000091;">✓ Compte vérifié</h3>
                    <p style="margin-bottom: 0;">
                        Vos données sont protégées et chiffrées selon les standards gouvernementaux.
                    </p>
                </div>
            </div>
        </div>
    `;
}

/**
 * Écran de calibration DSFR
 */
export function renderCalibrationScreen(): string {
    const state = stateManager.getState();
    const calibrated = state.isCalibrated;

    return `
        <div class="screen calibration-screen">
            <div class="container">
                <h2>Calibration de l'Eye Tracker</h2>

                <div class="calibration-instructions">
                    <p><strong>Instructions:</strong></p>
                    <p>Veuillez suivre les points qui apparaîtront à l'écran.</p>
                    <p>Assurez-vous que votre caméra web est activée et que vous êtes bien positionné face à l'écran.</p>
                    <p>Maintenez une position stable pendant la calibration.</p>
                </div>

                <div class="calibration-container">
                    <canvas id="calibrationCanvas" width="800" height="600"></canvas>
                </div>

                <div class="calibration-status">
                    <p>
                        Points de calibration: <strong>${state.calibrationPoints.length}/5</strong>
                    </p>
                    ${
                        calibrated
                            ? '<p class="success">✓ Calibration réussie! Vous pouvez procéder au test.</p>'
                            : '<p>Veuillez calibrer au moins 5 points.</p>'
                    }
                </div>

                <div class="button-group">
                    <button class="btn btn-primary" id="startCalibration" onclick="window.app.startCalibration()">
                        Démarrer la calibration
                    </button>
                    ${
                        calibrated
                            ? `<button class="btn btn-success" onclick="app.goToScreen('test-screen')">
                        Continuer vers le test →
                    </button>`
                            : ''
                    }
                    <button class="btn btn-secondary" onclick="app.goToScreen('home-screen')">
                        Retour
                    </button>
                </div>
            </div>
        </div>
    `;
}

/**
 * Écran de test DSFR
 */
export function renderTestScreen(): string {
    const state = stateManager.getState();
    const testActive = !!state.currentTest;

    return `
        <div class="screen test-screen">
            <div class="container">
                <h2>Test de Suivi Oculaire</h2>

                ${
                    !state.isCalibrated
                        ? `
                    <div class="notification notification-warning" style="margin-bottom: 2rem;">
                        <span>⚠️ Calibration requise avant de procéder au test</span>
                    </div>
                `
                        : ''
                }

                <div class="test-container">
                    <canvas id="testCanvas" width="1024" height="768"></canvas>
                </div>

                ${
                    testActive
                        ? `
                    <div class="test-stats">
                        <div class="stat">
                            <label>⏱️ Durée du test</label>
                            <span id="testDuration">0s</span>
                        </div>
                        <div class="stat">
                            <label>👁️ Suivi oculaire</label>
                            <span id="testTracking">0%</span>
                        </div>
                        <div class="stat">
                            <label>🎯 Fixations</label>
                            <span id="testFixations">0</span>
                        </div>
                        <div class="stat">
                            <label>👀 État des yeux</label>
                            <span id="testEyeState">●●</span>
                        </div>
                        <div class="stat">
                            <label>📊 Stabilité</label>
                            <span id="testStability">--</span>
                        </div>
                        <div class="stat">
                            <label>🎯 Confiance</label>
                            <span id="testConfidence">--</span>
                        </div>
                    </div>
                `
                        : ''
                }

                <div class="button-group">
                    ${
                        !testActive
                            ? `<button class="btn btn-primary" id="startTest" onclick="window.app.startTest()" ${!state.isCalibrated ? 'disabled' : ''}>
                        Démarrer le test
                    </button>`
                            : `<button class="btn btn-danger" id="stopTest" onclick="window.app.stopTest()">
                        Arrêter le test
                    </button>`
                    }
                    <button class="btn btn-secondary" onclick="window.app.goToScreen('home-screen')">
                        Retour
                    </button>
                </div>
            </div>
        </div>
    `;
}

/**
 * Écran de résultats DSFR
 */
export function renderResultsScreen(): string {
    const state = stateManager.getState();

    return `
        <div class="screen results-screen">
            <div class="container">
                <h2>Résultats des Tests</h2>

                ${
                    state.testResults.length === 0
                        ? `
                    <div class="notification notification-info">
                        <span>Aucun test disponible. Commencez par effectuer un test.</span>
                    </div>
                `
                        : `
                    <div class="results-list">
                        ${state.testResults
                            .map(
                                (result: any, _index: number) => `
                            <div class="result-card result-${result.result}">
                                <h3>Test #{} - ${new Date(result.test_date).toLocaleDateString(
                                    'fr-FR'
                                )}</h3>
                                <p class="result-status ${result.result}">
                                    Résultat: <strong>${
                                        ({
                                            excellent: 'Excellent',
                                            good: 'Bon',
                                            acceptable: 'Acceptable',
                                            poor: 'Faible',
                                        } as Record<string, string>)[result.result] || result.result.toUpperCase()
                                    }</strong>
                                </p>
                                <div class="result-details">
                                    <p><strong>Durée:</strong> ${result.duration.toFixed(
                                        1
                                    )}s</p>
                                    <p><strong>Suivi:</strong> ${result.tracking_percentage.toFixed(
                                        1
                                    )}%</p>
                                    <p><strong>Fixations:</strong> ${
                                        result.fixation_count
                                    }</p>
                                    <p><strong>Stab. gaze:</strong> ${result.gaze_stability.toFixed(
                                        2
                                    )}</p>
                                </div>
                            </div>
                        `
                            )
                            .join('')}
                    </div>
                `
                }

                <div class="button-group">
                    <button class="btn btn-secondary" onclick="app.goToScreen('home-screen')">
                        Retour
                    </button>
                </div>
            </div>
        </div>
    `;
}

/**
 * Écran de statistiques DSFR
 */
export function renderStatisticsScreen(): string {
    const state = stateManager.getState();
    const stats = state.statistics;

    return `
        <div class="screen statistics-screen">
            <div class="container">
                <h2>Statistiques et Analyse</h2>

                ${
                    !stats
                        ? `
                    <div class="notification notification-info">
                        <span>Aucune statistique disponible. Effectuez des tests pour générer des statistiques.</span>
                    </div>
                `
                        : `
                    <div class="statistics-grid">
                        <div class="stat-card">
                            <h3>Tests effectués</h3>
                            <p class="stat-value">${stats.total_tests || 0}</p>
                        </div>

                        <div class="stat-card">
                            <h3>Suivi moyen</h3>
                            <p class="stat-value">${(stats.avg_tracking || 0).toFixed(
                                1
                            )}%</p>
                        </div>

                        <div class="stat-card">
                            <h3>Meilleur résultat</h3>
                            <p class="stat-value">${stats.best_result || '-'}</p>
                        </div>

                        <div class="stat-card">
                            <h3>Stabilité gaze</h3>
                            <p class="stat-value">${(stats.avg_stability || 0).toFixed(
                                2
                            )}</p>
                        </div>
                    </div>
                `
                }

                <div class="button-group">
                    <button class="btn btn-secondary" onclick="app.goToScreen('home-screen')">
                        Retour
                    </button>
                </div>
            </div>
        </div>
    `;
}
