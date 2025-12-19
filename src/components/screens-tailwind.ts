/**
 * Écrans de l'application avec styling Tailwind professionnel
 */

import stateManager from '../services/state.service';

/**
 * Render navbar content
 */
export function renderNavbarContent(): string {
    const state = stateManager.getState();
    return state.isAuthenticated
        ? `
        <div class="flex items-center gap-4">
            <span class="text-gray-700 font-medium">
                Connecté: <strong>${state.patient?.firstName} ${state.patient?.lastName}</strong>
            </span>
            <button class="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm font-medium transition-colors" data-action="logout">
                Déconnexion
            </button>
        </div>
    `
        : '';
}

/**
 * Render notifications
 */
export function renderNotifications(): string {
    const state = stateManager.getState();
    return state.notifications
        .map(
            (notif) => `
        <div class="fixed top-4 right-4 max-w-md p-4 rounded-lg shadow-lg 
            ${
                notif.type === 'error'
                    ? 'bg-red-50 border border-red-200 text-red-900'
                    : notif.type === 'success'
                      ? 'bg-green-50 border border-green-200 text-green-900'
                      : 'bg-blue-50 border border-blue-200 text-blue-900'
            } 
            notification" data-notif-id="${notif.id}">
            <div class="flex items-center justify-between">
                <span class="font-medium">${notif.message}</span>
                <button class="text-lg font-bold cursor-pointer opacity-60 hover:opacity-100" 
                    onclick="document.querySelector('[data-notif-id=&quot;${notif.id}&quot;]')?.remove()">×</button>
            </div>
        </div>
    `
        )
        .join('');
}

/**
 * Écran d'accueil Tailwind
 */
function renderHomeScreen(): string {
    const state = stateManager.getState();
    const isAuthenticated = state.patient?.id;

    return `
        <div class="max-w-2xl mx-auto">
            ${
                isAuthenticated
                    ? `
                    <div class="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
                        <h2 class="text-xl font-bold text-blue-900 mb-2">Bienvenue</h2>
                        <p class="text-blue-800">
                            Patient: <strong>${state.patient?.firstName} ${state.patient?.lastName}</strong>
                        </p>
                    </div>
                    `
                    : ''
            }

            <div class="space-y-4">
                <h1 class="text-3xl font-bold text-gray-900 mb-8">Système de Suivi Oculaire Clinique</h1>

                ${
                    !isAuthenticated
                        ? `
                        <div class="bg-white rounded-lg shadow-md p-8">
                            <h2 class="text-2xl font-bold text-gray-900 mb-6">Connexion</h2>
                            <form id="loginForm" class="space-y-4">
                                <input type="text" id="loginUsername" placeholder="Nom d'utilisateur" required
                                    class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                                <input type="password" id="loginPassword" placeholder="Mot de passe" required
                                    class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                                <button type="submit" class="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-colors">
                                    Se connecter
                                </button>
                            </form>
                            <p class="text-center text-gray-600 mt-4">
                                Pas encore inscrit? <button class="text-blue-600 hover:underline font-medium" onclick="window.app.goToScreen('register-screen')">S'inscrire</button>
                            </p>
                        </div>
                        `
                        : `
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div class="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow cursor-pointer"
                                onclick="window.app.goToScreen('calibration-screen')">
                                <div class="text-4xl mb-4">🔧</div>
                                <h3 class="text-xl font-bold text-gray-900 mb-2">Calibration</h3>
                                <p class="text-gray-600 text-sm">Procédure d'étalonnage des yeux (5 points)</p>
                                <p class="text-xs text-gray-500 mt-3">
                                    ${state.isCalibrated ? '✅ Calibré' : '⚠️ Non calibré'}
                                </p>
                            </div>

                            <div class="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow cursor-pointer"
                                ${!state.isCalibrated ? 'opacity-50 cursor-not-allowed' : ''}
                                onclick="${state.isCalibrated ? "window.app.goToScreen('test-screen')" : ''}">
                                <div class="text-4xl mb-4">🎯</div>
                                <h3 class="text-xl font-bold text-gray-900 mb-2">Test de Suivi</h3>
                                <p class="text-gray-600 text-sm">Test de précision du suivi oculaire</p>
                                <p class="text-xs text-gray-500 mt-3">Total: ${state.testResults?.length || 0} test(s)</p>
                            </div>

                            <div class="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow cursor-pointer"
                                onclick="window.app.goToScreen('results-screen')">
                                <div class="text-4xl mb-4">📊</div>
                                <h3 class="text-xl font-bold text-gray-900 mb-2">Résultats</h3>
                                <p class="text-gray-600 text-sm">Historique des tests et statistiques</p>
                                <p class="text-xs text-gray-500 mt-3">${state.testResults?.length || 0} résultat(s)</p>
                            </div>
                        </div>
                        `
                }
            </div>
        </div>
    `;
}

function renderCalibrationScreen(): string {
    const state = stateManager.getState();
    const calibrationProgress = state.calibrationPoints?.length || 0;

    return `
        <div class="max-w-3xl mx-auto">
            <div class="bg-white rounded-lg shadow-md p-8">
                <h2 class="text-2xl font-bold text-gray-900 mb-6">Calibration des Yeux</h2>
                
                <div class="mb-8">
                    <div class="flex justify-between items-center mb-4">
                        <span class="text-sm font-medium text-gray-700">Progression: ${calibrationProgress}/5 points</span>
                        <span class="text-sm font-medium text-blue-600">${Math.round((calibrationProgress / 5) * 100)}%</span>
                    </div>
                    <div class="w-full bg-gray-200 rounded-full h-3">
                        <div class="bg-blue-600 h-3 rounded-full transition-all duration-300" 
                            style="width: ${(calibrationProgress / 5) * 100}%"></div>
                    </div>
                </div>

                <div id="calibrationContainer" class="bg-gray-50 rounded-lg p-32 flex items-center justify-center relative min-h-96">
                    <!-- Cibles de calibration seront ajoutées ici -->
                </div>

                <div class="mt-8 flex gap-4">
                    <button class="px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg transition-colors"
                        data-action="start-calibration">
                        ▶️ Démarrer la calibration
                    </button>
                    <button class="px-6 py-3 bg-gray-300 hover:bg-gray-400 text-gray-900 font-bold rounded-lg transition-colors"
                        data-action="go-screen" data-screen="home-screen">
                        Annuler
                    </button>
                </div>
            </div>
        </div>
    `;
}

function renderTestScreen(): string {
    const state = stateManager.getState();
    const testActive = state.currentTest?.startTime && !state.currentTest?.endTime;
    const test = state.currentTest;

    return `
        <div class="max-w-6xl mx-auto">
            <div class="bg-white rounded-lg shadow-md p-8">
                <h2 class="text-2xl font-bold text-gray-900 mb-6">Test de Suivi Oculaire</h2>

                <div id="testCanvasContainer" class="bg-gray-50 rounded-lg border-2 border-gray-300 w-full h-96 flex items-center justify-center mb-8">
                    <canvas id="testCanvas" width="1024" height="768" class="w-full h-full rounded-lg bg-white"></canvas>
                </div>

                ${
                    testActive
                        ? `
                        <div class="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
                            <div class="bg-blue-50 rounded-lg p-4 border border-blue-200">
                                <div class="text-2xl font-bold text-blue-900" id="testDuration">0s</div>
                                <p class="text-sm text-blue-700">⏱️ Durée</p>
                            </div>
                            <div class="bg-green-50 rounded-lg p-4 border border-green-200">
                                <div class="text-2xl font-bold text-green-900" id="testTracking">0%</div>
                                <p class="text-sm text-green-700">👁️ Suivi</p>
                            </div>
                            <div class="bg-orange-50 rounded-lg p-4 border border-orange-200">
                                <div class="text-2xl font-bold text-orange-900" id="testFixations">0</div>
                                <p class="text-sm text-orange-700">🎯 Fixations</p>
                            </div>
                            <div class="bg-purple-50 rounded-lg p-4 border border-purple-200">
                                <div class="text-2xl font-bold text-purple-900" id="testEyeState">●●</div>
                                <p class="text-sm text-purple-700">👀 Yeux</p>
                            </div>
                            <div class="bg-cyan-50 rounded-lg p-4 border border-cyan-200">
                                <div class="text-2xl font-bold text-cyan-900" id="testStability">--</div>
                                <p class="text-sm text-cyan-700">📊 Stabilité</p>
                            </div>
                            <div class="bg-pink-50 rounded-lg p-4 border border-pink-200">
                                <div class="text-2xl font-bold text-pink-900" id="testConfidence">--</div>
                                <p class="text-sm text-pink-700">🎯 Confiance</p>
                            </div>
                        </div>
                        `
                        : ''
                }

                <div class="flex gap-4">
                    ${
                        !testActive
                            ? `
                            <button class="px-8 py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg transition-colors"
                                onclick="window.app?.startTest?.()" ${!state.isCalibrated ? 'disabled opacity-50' : ''}>
                                ▶️ Démarrer le test
                            </button>
                            `
                            : `
                            <button class="px-8 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg transition-colors"
                                onclick="window.app?.stopTest?.()">
                                ⏹️ Arrêter le test
                            </button>
                            `
                    }
                    <button class="px-8 py-3 bg-gray-300 hover:bg-gray-400 text-gray-900 font-bold rounded-lg transition-colors"
                        onclick="window.app?.goToScreen?.('home-screen')">
                        ← Retour
                    </button>
                </div>
            </div>
        </div>
    `;
}

function renderResultsScreen(): string {
    const state = stateManager.getState();
    const tests = state.testResults || [];

    return `
        <div class="max-w-5xl mx-auto">
            <div class="bg-white rounded-lg shadow-md p-8">
                <h2 class="text-2xl font-bold text-gray-900 mb-6">Résultats des Tests</h2>

                ${
                    tests.length === 0
                        ? `
                        <div class="text-center py-12">
                            <p class="text-gray-600 text-lg">Aucun test effectué</p>
                            <button class="mt-4 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                                onclick="window.app.goToScreen('test-screen')">
                                Effectuer un test
                            </button>
                        </div>
                        `
                        : `
                        <div class="space-y-4">
                            ${tests
                                .map(
                                    (test: any, idx: number) => `
                                <div class="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                                    <div class="flex justify-between items-start mb-2">
                                        <div>
                                            <h3 class="font-bold text-gray-900">Test ${tests.length - idx}</h3>
                                            <p class="text-sm text-gray-600">${new Date(test.startTime).toLocaleString()}</p>
                                        </div>
                                        <span class="px-3 py-1 rounded-full text-sm font-medium ${
                                            test.result === 'excellent'
                                                ? 'bg-green-100 text-green-800'
                                                : test.result === 'good'
                                                ? 'bg-blue-100 text-blue-800'
                                                : 'bg-orange-100 text-orange-800'
                                        }">
                                            ${test.result || 'En attente'}
                                        </span>
                                    </div>
                                    <div class="grid grid-cols-3 gap-4 text-sm">
                                        <div>
                                            <p class="text-gray-600">Durée</p>
                                            <p class="font-bold text-gray-900">${test.totalTime?.toFixed(1) || 0}s</p>
                                        </div>
                                        <div>
                                            <p class="text-gray-600">Suivi</p>
                                            <p class="font-bold text-gray-900">${test.trackingPercentage || 0}%</p>
                                        </div>
                                        <div>
                                            <p class="text-gray-600">Fixations</p>
                                            <p class="font-bold text-gray-900">${test.fixationCount || 0}</p>
                                        </div>
                                    </div>
                                </div>
                            `
                                )
                                .join('')}
                        </div>
                        `
                }

                <div class="mt-8 flex gap-4">
                    <button class="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-colors"
                        onclick="window.app.goToScreen('test-screen')">
                        Nouveau test
                    </button>
                    <button class="px-6 py-3 bg-gray-300 hover:bg-gray-400 text-gray-900 font-bold rounded-lg transition-colors"
                        onclick="window.app.goToScreen('home-screen')">
                        ← Accueil
                    </button>
                </div>
            </div>
        </div>
    `;
}

function renderRegisterScreen(): string {
    return `
        <div class="max-w-md mx-auto">
            <div class="bg-white rounded-lg shadow-md p-8">
                <h2 class="text-2xl font-bold text-gray-900 mb-6">Inscription Patient</h2>
                
                <form id="registerForm" class="space-y-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Nom d'utilisateur</label>
                        <input type="text" id="registerUsername" placeholder="Votre nom d'utilisateur" required
                            class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                    
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Email</label>
                        <input type="email" id="registerEmail" placeholder="votre.email@example.com" required
                            class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                    
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Prénom</label>
                        <input type="text" id="registerFirstName" placeholder="Votre prénom" required
                            class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                    
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Nom</label>
                        <input type="text" id="registerLastName" placeholder="Votre nom" required
                            class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                    
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Âge</label>
                        <input type="number" id="registerAge" placeholder="Votre âge" min="1" max="120" required
                            class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                    
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Mot de passe</label>
                        <input type="password" id="registerPassword" placeholder="Votre mot de passe" required
                            class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                    
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Confirmer le mot de passe</label>
                        <input type="password" id="registerPasswordConfirm" placeholder="Confirmer votre mot de passe" required
                            class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                    
                    <button type="submit" class="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-colors">
                        S'inscrire
                    </button>
                </form>
                
                <p class="text-center text-gray-600 mt-4">
                    Déjà inscrit? <button class="text-blue-600 hover:underline font-medium" onclick="window.app.goToScreen('home-screen')">Se connecter</button>
                </p>
            </div>
        </div>
    `;
}

function renderStatisticsScreen(): string {
    const state = stateManager.getState();
    const tests: any[] = state.testResults || [];

    // Calculer les statistiques
    const totalTests = tests.length;
    const excellentCount = tests.filter((t: any) => t.result === 'excellent').length;
    const goodCount = tests.filter((t: any) => t.result === 'good').length;
    const acceptableCount = tests.filter((t: any) => t.result === 'acceptable').length;
    const poorCount = tests.filter((t: any) => t.result === 'poor').length;

    const avgTracking = totalTests > 0 ? tests.reduce((sum: number, t: any) => sum + (t.trackingPercentage || 0), 0) / totalTests : 0;
    const avgStability = totalTests > 0 ? tests.reduce((sum: number, t: any) => sum + (t.gazeStability || 0), 0) / totalTests : 0;

    return `
        <div class="max-w-4xl mx-auto">
            <div class="bg-white rounded-lg shadow-md p-8">
                <h2 class="text-2xl font-bold text-gray-900 mb-6">Statistiques Globales</h2>

                ${
                    totalTests === 0
                        ? `
                        <div class="text-center py-12">
                            <p class="text-gray-600 text-lg">Aucune donnée disponible</p>
                            <p class="text-gray-500 text-sm mt-2">Effectuez des tests pour voir les statistiques</p>
                        </div>
                        `
                        : `
                        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                            <div class="bg-green-50 rounded-lg p-6 border border-green-200">
                                <div class="text-3xl font-bold text-green-900">${excellentCount}</div>
                                <p class="text-sm text-green-700">Excellent</p>
                            </div>
                            <div class="bg-blue-50 rounded-lg p-6 border border-blue-200">
                                <div class="text-3xl font-bold text-blue-900">${goodCount}</div>
                                <p class="text-sm text-blue-700">Bon</p>
                            </div>
                            <div class="bg-yellow-50 rounded-lg p-6 border border-yellow-200">
                                <div class="text-3xl font-bold text-yellow-900">${acceptableCount}</div>
                                <p class="text-sm text-yellow-700">Acceptable</p>
                            </div>
                            <div class="bg-red-50 rounded-lg p-6 border border-red-200">
                                <div class="text-3xl font-bold text-red-900">${poorCount}</div>
                                <p class="text-sm text-red-700">Faible</p>
                            </div>
                        </div>

                        <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                            <div class="bg-gray-50 rounded-lg p-6 border border-gray-200">
                                <div class="text-2xl font-bold text-gray-900">${avgTracking.toFixed(1)}%</div>
                                <p class="text-sm text-gray-700">Suivi moyen</p>
                            </div>
                            <div class="bg-gray-50 rounded-lg p-6 border border-gray-200">
                                <div class="text-2xl font-bold text-gray-900">${avgStability.toFixed(1)}%</div>
                                <p class="text-sm text-gray-700">Stabilité moyenne</p>
                            </div>
                        </div>

                        <div class="bg-gray-50 rounded-lg p-6 border border-gray-200">
                            <h3 class="text-lg font-bold text-gray-900 mb-4">Évolution des performances</h3>
                            <div class="text-sm text-gray-600">
                                <p>Total des tests: <strong>${totalTests}</strong></p>
                                <p>Taux de succès: <strong>${((excellentCount + goodCount) / totalTests * 100).toFixed(1)}%</strong></p>
                            </div>
                        </div>
                        `
                }

                <div class="mt-8 flex gap-4">
                    <button class="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-colors"
                        onclick="window.app.goToScreen('test-screen')">
                        Nouveau test
                    </button>
                    <button class="px-6 py-3 bg-gray-300 hover:bg-gray-400 text-gray-900 font-bold rounded-lg transition-colors"
                        onclick="window.app.goToScreen('home-screen')">
                        ← Accueil
                    </button>
                </div>
            </div>
        </div>
    `;
}

// Export des fonctions
export {
    renderHomeScreen,
    renderCalibrationScreen,
    renderTestScreen,
    renderResultsScreen,
    renderRegisterScreen,
    renderStatisticsScreen
};
