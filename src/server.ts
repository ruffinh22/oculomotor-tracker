import express, { Request, Response } from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, '..', 'public')));
app.use(express.static(path.join(__dirname, '..', 'dist')));

// Route d'accueil
app.get('/', (_req: Request, res: Response) => {
    res.sendFile(path.join(__dirname, '..', 'public', 'index-tailwind.html'));
});

// API Routes
app.get('/api/health', (_req: Request, res: Response) => {
    res.json({
        status: 'ok',
        message: 'Serveur de suivi oculaire actif',
        timestamp: new Date().toISOString(),
    });
});

// Sauvegarde des résultats de test
app.post('/api/test-results', (req: Request, res: Response) => {
    try {
        const testResults = req.body;

        console.log('📊 Résultats du test reçus:');
        console.log(`   Patient: ${testResults.patientName}`);
        console.log(`   Date: ${testResults.testDate}`);
        console.log(`   Durée: ${testResults.totalTime}ms`);
        console.log(`   Temps fixation: ${testResults.gazeTime}ms`);

        // En production, sauvegarder en base de données
        res.json({
            success: true,
            message: 'Résultats sauvegardés',
            testId: Date.now().toString(),
        });
    } catch (error) {
        console.error('Erreur lors de la sauvegarde:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// Gestion des erreurs 404
app.use((_req: Request, res: Response) => {
    res.status(404).json({ error: 'Route non trouvée' });
});

// Démarrage du serveur
app.listen(PORT, () => {
    console.log(`\n🔍 Serveur de suivi oculaire clinique`);
    console.log(`✅ Démarré sur http://localhost:${PORT}`);
    console.log(`\nAccédez à http://localhost:${PORT} dans votre navigateur\n`);
});
