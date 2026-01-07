import { Router } from 'express';
import { DatabaseService } from '../../services/database-service';
import { WhatsAppManager } from '../../services/whatsapp-manager';
import { LogService } from '../../services/log-service';
import { ExternalApiController } from '../controllers/external-api.controller';
import { apiKeyMiddleware } from '../middleware/auth.middleware';

export function createExternalIntegrationRoutes(
    database: DatabaseService,
    whatsapp: WhatsAppManager,
    logger: LogService
): Router {
    const router = Router();
    const controller = new ExternalApiController(database, whatsapp, logger);

    // Todas as rotas abaixo requerem API Key válida
    router.use(apiKeyMiddleware);

    // Mensagens
    router.post('/messages/send-text', (req, res) => controller.sendText(req, res));
    router.post('/messages/send-media', (req, res) => controller.sendMedia(req, res));

    // Contatos
    router.get('/contacts/:phone', (req, res) => controller.getContact(req, res));
    router.post('/contacts', (req, res) => controller.upsertContact(req, res));

    return router;
}
