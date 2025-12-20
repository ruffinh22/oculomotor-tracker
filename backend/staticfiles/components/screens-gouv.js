/**
 * Écrans de l'application avec styling gouvernemental français (DSFR)
 * https://www.systeme-de-design.gouv.fr/
 */
import stateManager from '../services/state.service';
/**
 * Render navbar content
 */
export function renderNavbarContent() {
    const state = stateManager.getState();
    return state.isAuthenticated
        ? `
        <div class="navbar-menu">
            <div class="navbar-user">
                Connecté: <strong>${state.patient?.firstName} ${state.patient?.lastName}</strong>
            </div>
            <button class="logout-btn" onclick="window.app?.handleLogout?.()">
                Déconnexion
            </button>
        </div>
    `
        : '';
}
/**
 * Render navbar header
 */
export function renderNavbarHeader() {
    return `
        <div class="navbar-brand">
            <div class="logo">👁️</div>
            <h1>SOOC</h1>
        </div>
    `;
}
/**
 * Render notifications
 */
export function renderNotifications() {
    const state = stateManager.getState();
    return state.notifications
        .map((notif) => {
        const alertType = notif.type === 'error' ? 'alert-danger' :
            notif.type === 'success' ? 'alert-success' :
                'alert-info';
        const icon = notif.type === 'error' ? '✕' :
            notif.type === 'success' ? '✓' :
                'ℹ';
        return `
        <div class="alert ${alertType} notification" data-notif-id="${notif.id}" 
             style="position: fixed; top: 20px; right: 20px; max-width: 400px; z-index: 1000;">
            <div class="alert-icon">${icon}</div>
            <div style="flex: 1;">
                <strong>${notif.message}</strong>
            </div>
            <button style="background: none; border: none; cursor: pointer; font-size: 1.2rem; 
                         opacity: 0.6; padding: 0; margin-left: 1rem;"
                onclick="document.querySelector('[data-notif-id=&quot;${notif.id}&quot;]')?.remove()">×</button>
        </div>
    `;
    })
        .join('');
}
/**
 * Écran d'accueil gouvernemental
 */
function renderPatientSelectionScreen() {
    const state = stateManager.getState();
    const patients = state.patients || [];
    return `
        <div class="screen" id="patient-selection-screen">
            <div class="container">
                <h1 class="screen-title">Sélectionner un Patient</h1>
                <p class="screen-subtitle">Choisissez le patient pour lequel effectuer le test</p>

                ${patients.length === 0
        ? `
                        <div class="alert alert-info">
                            <div class="alert-icon">ℹ</div>
                            <div>Aucun patient disponible.</div>
                        </div>
                    `
        : ''}

                <div class="row">
                    <div class="col-half" style="margin-bottom: 1rem;">
                        <div class="card" style="cursor: pointer; transition: all 0.3s; padding: 1.5rem; text-align: center; background: #e8f4f8; border: 2px dashed #000091;"
                             onclick="window.app?.goToScreen?.('register-screen');">
                            <div style="font-size: 2.5rem; margin-bottom: 0.5rem;">➕</div>
                            <div style="font-size: 1.1rem; font-weight: bold; color: #000091;">
                                Ajouter un Patient
                            </div>
                            <div style="color: #666; font-size: 0.9rem; margin-top: 0.5rem;">
                                Créer un nouveau patient
                            </div>
                        </div>
                    </div>

                    ${patients
        .map((patient) => `
                        <div class="col-half" style="margin-bottom: 1rem;">
                            <div class="card" style="cursor: pointer; transition: all 0.3s; padding: 1.5rem; text-align: center;"
                                 onclick="window.app?.selectPatient?.(${patient.id}); window.app?.goToScreen?.('calibration-screen');">
                                <div style="font-size: 1.5rem; font-weight: bold; color: #000091; margin-bottom: 0.5rem;">
                                    ${(patient.user?.first_name || '') + ' ' + (patient.user?.last_name || '') || patient.user?.username || 'Patient'}
                                </div>
                                <div style="color: #666; font-size: 0.9rem;">
                                    👤 ID: ${patient.id}<br/>
                                    🎂 Âge: ${patient.age || '—'} ans<br/>
                                    📧 ${patient.user?.email || 'N/A'}
                                </div>
                            </div>
                        </div>
                    `)
        .join('')}
                </div>

                <div class="form-actions" style="margin-top: 2rem; display: flex; gap: 1rem; justify-content: center; flex-wrap: wrap;">
                    <button class="btn btn-secondary" onclick="window.app?.goToScreen?.('home-screen')" style="padding: 0.75rem 1.5rem; font-size: 1rem;">
                        ← Retour
                    </button>
                </div>
            </div>
        </div>
    `;
}
/**
 * Écran d'accueil gouvernemental
 */
function renderHomeScreen() {
    const state = stateManager.getState();
    const isAuthenticated = state.patient?.id;
    return `
        <div class="screen" id="home-screen">
            <div class="container">
                ${isAuthenticated
        ? `
                        <div class="alert alert-info">
                            <div class="alert-icon">ℹ</div>
                            <div>
                                Bienvenue <strong>${state.patient?.firstName} ${state.patient?.lastName}</strong>
                            </div>
                        </div>
                    `
        : ''}

                <h1 class="screen-title">Système de Suivi Oculaire Clinique</h1>
                <p class="screen-subtitle">Réalisé pour les professionnels de santé</p>

                <div class="row">
                    ${!isAuthenticated
        ? `
                        <div class="col-half">
                            <div class="card">
                                <div class="card-header">
                                    <h3>Connexion</h3>
                                </div>
                                <div class="card-body">
                                    <form id="loginForm">
                                        <div class="form-group">
                                            <label for="loginUsername">Identifiant</label>
                                            <input type="text" id="loginUsername" name="username" 
                                                   placeholder="Votre identifiant" required />
                                        </div>
                                        <div class="form-group">
                                            <label for="loginPassword">Mot de passe</label>
                                            <input type="password" id="loginPassword" name="password" 
                                                   placeholder="Votre mot de passe" required />
                                        </div>
                                        <div class="form-actions">
                                            <button type="submit" class="btn btn-primary btn-block">
                                                Se connecter
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        </div>

                        <div class="col-half">
                            <div class="card">
                                <div class="card-header">
                                    <h3>Inscription</h3>
                                </div>
                                <div class="card-body">
                                    <form id="registerForm">
                                        <div class="form-group">
                                            <label for="registerUsername">Identifiant</label>
                                            <input type="text" id="registerUsername" name="username" 
                                                   placeholder="Choisir un identifiant" required />
                                        </div>
                                        <div class="form-group">
                                            <label for="registerEmail">Email</label>
                                            <input type="email" id="registerEmail" name="email" 
                                                   placeholder="votre@email.fr" required />
                                        </div>
                                        <div class="form-group">
                                            <label for="registerPassword">Mot de passe</label>
                                            <input type="password" id="registerPassword" name="password" 
                                                   placeholder="Mot de passe sécurisé" required />
                                        </div>
                                        <div class="form-group">
                                            <label for="registerFirstName">Prénom</label>
                                            <input type="text" id="registerFirstName" name="firstName" 
                                                   placeholder="Votre prénom" required />
                                        </div>
                                        <div class="form-group">
                                            <label for="registerLastName">Nom</label>
                                            <input type="text" id="registerLastName" name="lastName" 
                                                   placeholder="Votre nom" required />
                                        </div>
                                        <div class="form-group">
                                            <label for="registerAge">Âge</label>
                                            <input type="number" id="registerAge" name="age" 
                                                   placeholder="Votre âge" required />
                                        </div>
                                        <div class="form-actions">
                                            <button type="submit" class="btn btn-primary btn-block">
                                                S'inscrire
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        </div>
                    `
        : `
                        <div class="col-full">
                            <div class="card">
                                <div class="card-header">
                                    <h3>Menu Principal</h3>
                                </div>
                                <div class="card-body">
                                    <div class="row">
                                        <div class="col-third">
                                            <button class="btn btn-primary btn-large btn-block" 
                                                    onclick="window.app?.loadPatients?.(); window.app?.goToScreen?.('patient-selection-screen')">
                                                📋 Nouveau Test
                                            </button>
                                        </div>
                                        <div class="col-third">
                                            <button class="btn btn-secondary btn-large btn-block" 
                                                    onclick="window.app?.goToScreen?.('results-screen')">
                                                📊 Résultats
                                            </button>
                                        </div>
                                        <div class="col-third">
                                            <button class="btn btn-secondary btn-large btn-block" 
                                                    onclick="window.app?.goToScreen?.('about-screen')">
                                                ℹ️ À propos
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    `}
                </div>
            </div>
        </div>
    `;
}
/**
 * Écran de calibration
 */
function renderCalibrationScreen() {
    const state = stateManager.getState();
    const calibrationPoints = state.calibrationPoints || 0;
    return `
        <div class="screen" id="calibration-screen">
            <div class="container">
                <h1 class="screen-title">Calibration du Suivi Oculaire</h1>
                <p class="screen-subtitle">Cliquez sur chaque point qui s'affiche à l'écran</p>

                <div class="card">
                    <div class="card-body">
                        <div id="testCanvas" style="
                            width: 100%;
                            height: 400px;
                            background: linear-gradient(135deg, #f6f6f6 0%, #ffffff 100%);
                            border: 2px solid #000091;
                            border-radius: 2px;
                            position: relative;
                            margin-bottom: 2rem;
                        "></div>

                        <div style="text-align: center; margin-bottom: 2rem;">
                            <p class="text-muted">
                                Points calibrés: <strong>${calibrationPoints.length}/5</strong>
                            </p>
                            <div class="spinner" style="margin: 1rem auto;"></div>
                        </div>

                        <div class="form-actions">
                            <button class="btn btn-secondary" onclick="window.app?.goToScreen?.('home-screen')">
                                ← Retour
                            </button>
                            ${calibrationPoints.length < 5
        ? `<button class="btn btn-primary" id="startCalibrationBtn" 
                                        onclick="window.app?.startCalibration?.()">
                                    Démarrer Calibration
                                </button>`
        : `<button class="btn btn-primary btn-success" 
                                        onclick="window.app?.goToScreen?.('test-screen')">
                                    ✓ Calibration Complète - Commencer Test
                                </button>`}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
}
/**
 * Écran de test
 */
function renderTestScreen() {
    const state = stateManager.getState();
    const testData = state.testData;
    return `
        <div class="screen" id="test-screen">
            <div class="container">
                <h1 class="screen-title">Test de Suivi Oculaire</h1>
                <p class="screen-subtitle">Regardez les cibles à l'écran - Vos mouvements oculaires sont tracés en direct</p>

                <div class="row">
                    <div class="col-full">
                        <div class="card">
                            <div class="card-header">
                                <h3>📹 Zone de Suivi Oculaire en Temps Réel</h3>
                            </div>
                            <div class="card-body">
                                <!-- Canvas pour afficher le suivi oculaire -->
                                <canvas id="testCanvas" style="
                                    width: 100%;
                                    height: 500px;
                                    background: linear-gradient(135deg, #f6f6f6 0%, #ffffff 100%);
                                    border: 3px solid #000091;
                                    border-radius: 2px;
                                    display: block;
                                    cursor: crosshair;
                                    box-shadow: inset 0 0 10px rgba(0, 0, 145, 0.1);
                                "></canvas>
                                <div style="margin-top: 1rem; padding: 1rem; background-color: #f6f6f6; border-radius: 2px; font-size: 0.85rem;">
                                    <strong>Légende:</strong>
                                    <div style="margin-top: 0.5rem;">
                                        <span style="display: inline-block; width: 12px; height: 12px; background-color: #0a76f6; border-radius: 50%; margin-right: 0.5rem; vertical-align: middle;"></span>
                                        <span>Position actuelle du regard</span>
                                    </div>
                                    <div style="margin-top: 0.3rem;">
                                        <span style="display: inline-block; width: 20px; height: 2px; background-color: #18753c; margin-right: 0.5rem; vertical-align: middle;"></span>
                                        <span>Trajet du regard (historique)</span>
                                    </div>
                                    <div style="margin-top: 0.3rem;">
                                        <span style="display: inline-block; width: 30px; height: 30px; border: 2px solid #ff9947; border-radius: 50%; margin-right: 0.5rem; vertical-align: middle; position: relative;">
                                            <span style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); font-size: 0.7rem; font-weight: bold;">F</span>
                                        </span>
                                        <span>Fixation détectée</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="row">
                    <div class="col-third">
                        <div class="card">
                            <div class="card-body">
                                <div style="font-size: 0.9rem; color: #666; font-weight: 600;">⏱️ Durée</div>
                                <div style="font-size: 1.8rem; font-weight: bold; color: #000091; margin-top: 0.5rem;">
                                    ${formatTime(testData?.totalTime || 0)}
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="col-third">
                        <div class="card">
                            <div class="card-body">
                                <div style="font-size: 0.9rem; color: #666; font-weight: 600;">📊 Suivi</div>
                                <div style="font-size: 1.8rem; font-weight: bold; color: #18753c; margin-top: 0.5rem;">
                                    ${(testData?.trackingPercentage || 0).toFixed(1)}%
                                </div>
                                <div style="background-color: #f6f6f6; height: 6px; border-radius: 2px; margin-top: 0.5rem; overflow: hidden;">
                                    <div style="background-color: #18753c; height: 100%; width: ${testData?.trackingPercentage || 0}%;"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="col-third">
                        <div class="card">
                            <div class="card-body">
                                <div style="font-size: 0.9rem; color: #666; font-weight: 600;">👁️ Fixations</div>
                                <div style="font-size: 1.8rem; font-weight: bold; color: #0a76f6; margin-top: 0.5rem;">
                                    ${testData?.fixationCount || 0}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="row">
                    <div class="col-half">
                        <div class="card">
                            <div class="card-body">
                                <div style="margin-bottom: 1.5rem;">
                                    <small style="color: #666; font-weight: 600;">Stabilité Oculaire</small>
                                    <div style="font-size: 1.4rem; font-weight: bold; color: #000091; margin-top: 0.5rem;">
                                        ${(testData?.gazeStability || 0).toFixed(2)}
                                    </div>
                                    <div style="background-color: #f6f6f6; height: 6px; border-radius: 2px; margin-top: 0.5rem; overflow: hidden;">
                                        <div style="background-color: #000091; height: 100%; width: ${Math.min((testData?.gazeStability || 0) * 10, 100)}%;"></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="col-half">
                        <div class="card">
                            <div class="card-body">
                                <div style="margin-bottom: 1.5rem;">
                                    <small style="color: #666; font-weight: 600;">Cohérence de Regard</small>
                                    <div style="font-size: 1.4rem; font-weight: bold; color: #0a76f6; margin-top: 0.5rem;">
                                        ${(testData?.gazeConsistency || 0).toFixed(2)}
                                    </div>
                                    <div style="background-color: #f6f6f6; height: 6px; border-radius: 2px; margin-top: 0.5rem; overflow: hidden;">
                                        <div style="background-color: #0a76f6; height: 100%; width: ${Math.min((testData?.gazeConsistency || 0) * 10, 100)}%;"></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="form-actions">
                    <button class="btn btn-secondary" onclick="window.app?.goToScreen?.('home-screen')">
                        ← Retour
                    </button>
                    <button class="btn btn-secondary" onclick="window.app?.startCalibration?.()">
                        🔧 Recalibrer
                    </button>
                    <button class="btn btn-success btn-large" onclick="window.app?.startTest?.()">
                        ▶️ Démarrer Test
                    </button>
                </div>

                <div id="activeTestControls" style="display: none; margin-top: 2rem;">
                    <div class="alert alert-warning">
                        <div class="alert-icon">⏱️</div>
                        <div><strong>Test en cours</strong> - Suivez les cibles avec les yeux. Votre regard est enregistré en temps réel.</div>
                    </div>
                    <div class="form-actions">
                        <button class="btn btn-danger btn-large btn-block" onclick="window.app?.stopTest?.()">
                            ⏹️ Arrêter le Test
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
}
/**
 * Écran des résultats
 */
function renderResultsScreen() {
    const state = stateManager.getState();
    const tests = state.tests || [];
    // Utiliser le patient_name du premier test ou state.patient
    const firstTest = tests.length > 0 ? tests[0] : null;
    const patientName = firstTest?.patient_name ||
        (state.patient ? `${state.patient.firstName} ${state.patient.lastName}` : 'Patient');
    return `
        <div class="screen" id="results-screen">
            <div class="container">
                <h1 class="screen-title">Historique des Tests - ${patientName}</h1>
                <p class="screen-subtitle">Consultez vos résultats de suivi oculaire</p>

                <div class="row">
                    <div class="col-full">
                        <div class="card" style="background: linear-gradient(135deg, #f0f8fc 0%, #e8f4f8 100%); border-left: 4px solid #000091;">
                            <div class="card-header">
                                <h3>Informations du Patient</h3>
                            </div>
                            <div class="card-body">
                                <div class="row">
                                    <div class="col-third">
                                        <div>
                                            <small style="color: #666; font-weight: 600;">Nom Complet</small>
                                            <div style="font-size: 1.1rem; font-weight: bold; color: #000091; margin-top: 0.5rem;">
                                                ${patientName}
                                            </div>
                                        </div>
                                    </div>
                                    <div class="col-third">
                                        <div>
                                            <small style="color: #666; font-weight: 600;">Âge</small>
                                            <div style="font-size: 1.1rem; font-weight: bold; color: #0a76f6; margin-top: 0.5rem;">
                                                ${state.patient?.age || '—'} ans
                                            </div>
                                        </div>
                                    </div>
                                    <div class="col-third">
                                        <div>
                                            <small style="color: #666; font-weight: 600;">Email</small>
                                            <div style="font-size: 0.95rem; color: #555; margin-top: 0.5rem; word-break: break-all;">
                                                📧 ${state.patient?.email || '—'}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                ${tests.length === 0
        ? `
                        <div class="alert alert-info">
                            <div class="alert-icon">ℹ</div>
                            <div>Aucun test effectué pour le moment.</div>
                        </div>
                    `
        : `
                        <div class="card">
                            <table>
                                <thead>
                                    <tr>
                                        <th>Patient</th>
                                        <th>Date</th>
                                        <th>Durée</th>
                                        <th>Suivi</th>
                                        <th>Fixations</th>
                                        <th>Résultat</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${tests
            .map((test, idx) => {
            const testDate = test.test_date || new Date().toISOString();
            const duration = test.duration || 0;
            const tracking = test.tracking_percentage || 0;
            const fixations = test.fixation_count || 0;
            const result = test.result || 'good';
            const patientName = test.patient_name || '— —';
            return `
                                        <tr>
                                            <td><strong>${patientName}</strong></td>
                                            <td>${new Date(testDate).toLocaleDateString('fr-FR')}</td>
                                            <td>${formatTime(duration)}</td>
                                            <td>${tracking.toFixed(1)}%</td>
                                            <td>${fixations}</td>
                                            <td>
                                                <span class="badge badge-${result === 'excellent' ? 'success' : result === 'good' ? 'primary' : 'warning'}">
                                                    ${result}
                                                </span>
                                            </td>
                                            <td>
                                                <button class="btn btn-small btn-secondary" 
                                                        onclick="window.app?.viewTest?.(${test.id || idx})">
                                                    Détails
                                                </button>
                                            </td>
                                        </tr>
                                    `;
        })
            .join('')}
                                </tbody>
                            </table>
                        </div>
                    `}

                <div class="form-actions">
                    <button class="btn btn-secondary" onclick="window.app?.goToScreen?.('home-screen')">
                        ← Retour
                    </button>
                </div>
            </div>
        </div>
    `;
}
/**
 * Écran de détail d'un test
 */
function renderTestDetailScreen() {
    const state = stateManager.getState();
    const testId = window.__selectedTestId;
    const tests = state.tests || [];
    const test = tests.find((t) => t.id === testId);
    if (!test) {
        return `
            <div class="screen" id="test-detail-screen">
                <div class="container">
                    <h1 class="screen-title">Détails du Test</h1>
                    <div class="alert alert-danger">
                        <div class="alert-icon">✕</div>
                        <div>Test non trouvé</div>
                    </div>
                    <div class="form-actions">
                        <button class="btn btn-secondary" onclick="window.app?.goToScreen?.('results-screen')">
                            ← Retour
                        </button>
                    </div>
                </div>
            </div>
        `;
    }
    const testDate = test.test_date || new Date().toISOString();
    const duration = test.duration || 0;
    const tracking = test.tracking_percentage || 0;
    const fixations = test.fixation_count || 0;
    const result = test.result || 'good';
    const gazeStability = test.gaze_stability || 0;
    const gazeConsistency = test.gaze_consistency || 0;
    const avgFixation = test.avg_fixation_duration || 0;
    const maxFixation = test.max_fixation_duration || 0;
    const minFixation = test.min_fixation_duration || 0;
    return `
        <div class="screen" id="test-detail-screen">
            <div class="container">
                <h1 class="screen-title">Détails du Test #${testId}</h1>
                <p class="screen-subtitle">Test effectué le ${new Date(testDate).toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>

                <div class="row">
                    <div class="col-full">
                        <div class="card" style="background: linear-gradient(135deg, #f0f8fc 0%, #e8f4f8 100%); border-left: 4px solid #000091; margin-bottom: 1.5rem;">
                            <div class="card-header">
                                <h3>Informations du Patient</h3>
                            </div>
                            <div class="card-body">
                                <div class="row">
                                    <div class="col-third">
                                        <div>
                                            <small style="color: #666; font-weight: 600;">Nom Complet</small>
                                            <div style="font-size: 1.1rem; font-weight: bold; color: #000091; margin-top: 0.5rem;">
                                                ${test.patient_name || state.patient?.firstName || '—'} ${state.patient?.lastName || ''}
                                            </div>
                                        </div>
                                    </div>
                                    <div class="col-third">
                                        <div>
                                            <small style="color: #666; font-weight: 600;">Âge</small>
                                            <div style="font-size: 1.1rem; font-weight: bold; color: #0a76f6; margin-top: 0.5rem;">
                                                ${state.patient?.age || '—'} ans
                                            </div>
                                        </div>
                                    </div>
                                    <div class="col-third">
                                        <div>
                                            <small style="color: #666; font-weight: 600;">Email</small>
                                            <div style="font-size: 0.95rem; color: #555; margin-top: 0.5rem; word-break: break-all;">
                                                📧 ${state.patient?.email || '—'}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="row">
                    <div class="col-full">
                        <div class="card">
                            <div class="card-header">
                                <h3>Informations Générales</h3>
                            </div>
                            <div class="card-body">
                                <div class="row">
                                    <div class="col-third">
                                        <div style="margin-bottom: 1.5rem;">
                                            <small style="color: #666; font-weight: 600;">Durée du test</small>
                                            <div style="font-size: 1.5rem; font-weight: bold; color: #000091; margin-top: 0.5rem;">
                                                ${formatTime(duration)}
                                            </div>
                                        </div>
                                    </div>
                                    <div class="col-third">
                                        <div style="margin-bottom: 1.5rem;">
                                            <small style="color: #666; font-weight: 600;">Résultat</small>
                                            <div style="margin-top: 0.5rem;">
                                                <span class="badge badge-${result === 'excellent' ? 'success' : result === 'good' ? 'primary' : 'warning'}" 
                                                      style="font-size: 1rem; padding: 0.5rem 1rem;">
                                                    ${result}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <div class="col-third">
                                        <div style="margin-bottom: 1.5rem;">
                                            <small style="color: #666; font-weight: 600;">Nombre de Fixations</small>
                                            <div style="font-size: 1.5rem; font-weight: bold; color: #0a76f6; margin-top: 0.5rem;">
                                                ${fixations}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="row">
                    <div class="col-half">
                        <div class="card">
                            <div class="card-header">
                                <h3>Métriques de Suivi</h3>
                            </div>
                            <div class="card-body">
                                <div style="margin-bottom: 1.5rem;">
                                    <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
                                        <small style="color: #666; font-weight: 600;">Pourcentage de Suivi</small>
                                        <strong>${tracking.toFixed(1)}%</strong>
                                    </div>
                                    <div style="background-color: #f6f6f6; height: 8px; border-radius: 2px; overflow: hidden;">
                                        <div style="background-color: #18753c; height: 100%; width: ${tracking}%;"></div>
                                    </div>
                                </div>

                                <div style="margin-bottom: 1.5rem;">
                                    <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
                                        <small style="color: #666; font-weight: 600;">Stabilité Oculaire</small>
                                        <strong>${gazeStability.toFixed(2)}</strong>
                                    </div>
                                    <div style="background-color: #f6f6f6; height: 8px; border-radius: 2px; overflow: hidden;">
                                        <div style="background-color: #0a76f6; height: 100%; width: ${Math.min(gazeStability * 10, 100)}%;"></div>
                                    </div>
                                </div>

                                <div>
                                    <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
                                        <small style="color: #666; font-weight: 600;">Cohérence de Regard</small>
                                        <strong>${gazeConsistency.toFixed(2)}</strong>
                                    </div>
                                    <div style="background-color: #f6f6f6; height: 8px; border-radius: 2px; overflow: hidden;">
                                        <div style="background-color: #ff9947; height: 100%; width: ${Math.min(gazeConsistency * 10, 100)}%;"></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="col-half">
                        <div class="card">
                            <div class="card-header">
                                <h3>Durées de Fixation</h3>
                            </div>
                            <div class="card-body">
                                <div style="margin-bottom: 1.5rem;">
                                    <small style="color: #666; font-weight: 600;">Durée Moyenne</small>
                                    <div style="font-size: 1.3rem; font-weight: bold; margin-top: 0.5rem;">
                                        ${avgFixation.toFixed(0)} ms
                                    </div>
                                </div>

                                <div style="margin-bottom: 1.5rem;">
                                    <small style="color: #666; font-weight: 600;">Durée Maximale</small>
                                    <div style="font-size: 1.3rem; font-weight: bold; color: #ce0500; margin-top: 0.5rem;">
                                        ${maxFixation.toFixed(0)} ms
                                    </div>
                                </div>

                                <div>
                                    <small style="color: #666; font-weight: 600;">Durée Minimale</small>
                                    <div style="font-size: 1.3rem; font-weight: bold; color: #18753c; margin-top: 0.5rem;">
                                        ${minFixation.toFixed(0)} ms
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="form-actions">
                    <button class="btn btn-secondary" onclick="window.app?.goToScreen?.('results-screen')">
                        ← Retour aux résultats
                    </button>
                </div>
            </div>
        </div>
    `;
}
/**
 * Écran Enregistrement d'un nouveau patient
 */
function renderRegisterScreen() {
    return `
        <div class="screen" id="register-screen">
            <div class="container">
                <h1 class="screen-title">Créer un Nouveau Patient</h1>
                <p class="screen-subtitle">Enregistrez les informations du nouveau patient</p>

                <div class="row">
                    <div class="col-full">
                        <div class="card">
                            <form id="registerPatientForm">
                                <div class="form-group">
                                    <label for="firstName">Prénom *</label>
                                    <input type="text" id="firstName" name="firstName" placeholder="Jean" required />
                                </div>

                                <div class="form-group">
                                    <label for="lastName">Nom *</label>
                                    <input type="text" id="lastName" name="lastName" placeholder="Dupont" required />
                                </div>

                                <div class="form-group">
                                    <label for="email">Email *</label>
                                    <input type="email" id="email" name="email" placeholder="patient@example.com" required />
                                </div>

                                <div class="form-group">
                                    <label for="age">Âge</label>
                                    <input type="number" id="age" name="age" placeholder="30" min="0" max="150" />
                                </div>

                                <div class="form-group">
                                    <label for="username">Nom d'utilisateur *</label>
                                    <input type="text" id="username" name="username" placeholder="jean_dupont" required />
                                </div>

                                <div class="form-group">
                                    <label for="password">Mot de passe *</label>
                                    <input type="password" id="password" name="password" placeholder="••••••••" required />
                                </div>

                                <div class="form-actions">
                                    <button type="submit" class="btn btn-primary">
                                        ✓ Créer Patient
                                    </button>
                                    <button type="button" class="btn btn-secondary" onclick="window.app?.goToScreen?.('patient-selection-screen')">
                                        ← Retour
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
}
/**
 * Écran À propos
 */
function renderAboutScreen() {
    return `
        <div class="screen" id="about-screen">
            <div class="container">
                <h1 class="screen-title">À propos</h1>

                <div class="card">
                    <div class="card-header">
                        <h3>Système de Suivi Oculaire Clinique</h3>
                    </div>
                    <div class="card-body">
                        <p style="margin-bottom: 1rem;">
                            <strong>Version:</strong> 1.0.0
                        </p>
                        <p style="margin-bottom: 1rem;">
                            Le Système de Suivi Oculaire Clinique (SOOC) est un outil d'évaluation ophtalmologique 
                            fondé sur le suivi oculaire par webcam. Il utilise la technologie WebGazer.js 
                            pour un suivi oculaire pratique et sans équipement spécialisé.
                        </p>
                        <p style="margin-bottom: 1rem;">
                            <strong>Destiné aux:</strong> Orthoptistes et professionnels de la santé visuelle
                        </p>
                        <p style="margin-bottom: 1rem;">
                            <strong>Technologie:</strong> WebGazer.js, Django REST Framework, TypeScript
                        </p>
                        <p style="color: #666; font-size: 0.9rem;">
                            © 2025 République Française - Tous droits réservés
                        </p>
                    </div>
                </div>

                <div class="form-actions">
                    <button class="btn btn-secondary" onclick="window.app?.goToScreen?.('home-screen')">
                        ← Retour
                    </button>
                </div>
            </div>
        </div>
    `;
}
/**
 * Utilitaire: formater le temps
 */
function formatTime(seconds) {
    if (!seconds || isNaN(seconds))
        return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}
/**
 * Render main layout
 */
export function renderMainLayout() {
    const state = stateManager.getState();
    return `
        <nav class="navbar">
            ${renderNavbarHeader()}
            ${renderNavbarContent()}
        </nav>
        
        <main style="flex: 1; display: flex; flex-direction: column; justify-content: center;">
            ${state.currentScreen === 'home-screen'
        ? renderHomeScreen()
        : state.currentScreen === 'patient-selection-screen'
            ? renderPatientSelectionScreen()
            : state.currentScreen === 'register-screen'
                ? renderRegisterScreen()
                : state.currentScreen === 'calibration-screen'
                    ? renderCalibrationScreen()
                    : state.currentScreen === 'test-screen'
                        ? renderTestScreen()
                        : state.currentScreen === 'results-screen'
                            ? renderResultsScreen()
                            : state.currentScreen === 'test-detail-screen'
                                ? renderTestDetailScreen()
                                : state.currentScreen === 'about-screen'
                                    ? renderAboutScreen()
                                    : renderHomeScreen()}
        </main>

        <footer style="background-color: #f6f6f6; border-top: 1px solid #ddd; padding: 1.5rem; text-align: center; font-size: 0.9rem; color: #666;">
            <p>Système de Suivi Oculaire Clinique - Réalisé pour les professionnels de santé</p>
        </footer>

        ${renderNotifications()}
    `;
}
//# sourceMappingURL=screens-gouv.js.map