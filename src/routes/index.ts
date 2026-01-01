import { Router } from 'express';
import {
    ingestRepository,
    getIngestionStatus,
    deleteRepository,
} from '../controllers/ingestionController';
import { queryRepository } from '../controllers/queryController';
import { healthCheck, getStats } from '../controllers/healthController';
import { asyncHandler } from '../middleware/errorHandler';

const router = Router();

// Health check
router.get('/health', healthCheck);
router.get('/stats', getStats);

// Debug endpoint to check Pinecone contents
router.get('/debug/pinecone', asyncHandler(async (_req, res) => {
    const vectorStoreService = require('../services/VectorStoreService').default;
    const stats = await vectorStoreService.getStats();
    res.json({
        message: 'Pinecone index stats',
        stats,
        note: 'Check namespaces and totalRecordCount to see if vectors exist'
    });
}));

// Ingestion routes
router.post('/ingest', ingestRepository);
router.get('/status/:jobId', getIngestionStatus);
router.delete('/repo/:repoId', deleteRepository);

// Query routes
router.post('/query', queryRepository);

export default router;
