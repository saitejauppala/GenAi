import express from 'express';
import { createCheckout, createPortal, webhookHandler } from '../controllers/billingController';
import { authenticateJWT } from '../middleware/auth';

const router = express.Router();

router.post('/create-checkout', authenticateJWT, createCheckout);
router.get('/portal', authenticateJWT, createPortal);

// Webhook: must use raw body parser; apply express.raw here
router.post('/webhook', express.raw({ type: 'application/json' }), webhookHandler as any);

export default router;
