/**
 * Point d'entrée du navigateur
 * Initialise l'app Tailwind et l'expose globalement
 */
import app from './app-tailwind';
console.log('📖 browser-entry.ts loaded');
// Expose l'app à la fenêtre globale
window.app = app;
console.log('✅ app exposed to window');
// Attendre le DOM complet avant d'initialiser
console.log('📖 document.readyState:', document.readyState);
if (document.readyState === 'loading') {
    console.log('⏳ Waiting for DOMContentLoaded...');
    document.addEventListener('DOMContentLoaded', () => {
        console.log('🎬 DOMContentLoaded fired, calling app.start()');
        try {
            app.start();
            console.log('✅ app.start() called successfully');
        }
        catch (error) {
            console.error('❌ Error calling app.start():', error);
        }
    });
}
else {
    // DOM déjà chargé
    console.log('✅ DOM already loaded, calling app.start()');
    try {
        app.start();
        console.log('✅ app.start() called successfully');
    }
    catch (error) {
        console.error('❌ Error calling app.start():', error);
    }
}
console.log('✅ Application prête');
//# sourceMappingURL=browser-entry.js.map