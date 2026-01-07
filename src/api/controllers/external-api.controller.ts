import { Request, Response } from 'express';
import { DatabaseService } from '../../services/database-service';
import { WhatsAppManager } from '../../services/whatsapp-manager';
import { LogService } from '../../services/log-service';
import { AuthRequest } from '../middleware/auth.middleware';

export class ExternalApiController {
    constructor(
        private database: DatabaseService,
        private whatsapp: WhatsAppManager,
        private logger: LogService
    ) { }

    /**
     * Envia uma mensagem de texto simples
     */
    async sendText(req: AuthRequest, res: Response): Promise<void> {
        const { phone, message, instanceId } = req.body;
        const tenantId = req.tenantId;

        if (!phone || !message) {
            res.status(400).json({ success: false, error: 'Parâmetros obrigatórios: phone, message' });
            return;
        }

        try {
            // Se instanceId não informado, tenta pegar um ativo do tenant
            const instance = instanceId || await this.getDefaultInstance(tenantId!);
            if (!instance) {
                res.status(404).json({ success: false, error: 'Nenhuma instância do WhatsApp conectada encontrada para este Tenant.' });
                return;
            }

            await this.whatsapp.sendMessage(instance, phone, message);

            await this.database.logEvent(tenantId!, 'api', 'message_sent', 'external_api', { phone, type: 'text' });

            res.status(200).json({
                success: true,
                status: 'queued'
            });
        } catch (error: any) {
            this.logger.error('API: Erro ao enviar mensagem de texto', error);
            res.status(500).json({ success: false, error: error.message });
        }
    }

    /**
     * Envia uma mensagem com mídia (imagem, pdf, etc)
     */
    async sendMedia(req: AuthRequest, res: Response): Promise<void> {
        const { phone, mediaUrl, mediaType, caption, instanceId } = req.body;
        const tenantId = req.tenantId;

        if (!phone || !mediaUrl || !mediaType) {
            res.status(400).json({ success: false, error: 'Parâmetros obrigatórios: phone, mediaUrl, mediaType (image, video, document, audio)' });
            return;
        }

        try {
            const instance = instanceId || await this.getDefaultInstance(tenantId!);
            if (!instance) {
                res.status(404).json({ success: false, error: 'Nenhuma instância do WhatsApp conectada encontrada.' });
                return;
            }

            await this.whatsapp.sendMedia(instance, phone, mediaUrl, mediaType, caption);

            await this.database.logEvent(tenantId!, 'api', 'message_sent', 'external_api', { phone, type: mediaType });

            res.status(200).json({
                success: true,
                status: 'queued'
            });
        } catch (error: any) {
            this.logger.error('API: Erro ao enviar mídia', error);
            res.status(500).json({ success: false, error: error.message });
        }
    }

    /**
     * Consulta informações de um contato
     */
    async getContact(req: AuthRequest, res: Response): Promise<void> {
        const { phone } = req.params;
        const tenantId = req.tenantId;

        try {
            // Utilizando any para simplificar, idealmente usar uma interface Contact
            const contact = await this.database.get<any>(
                'SELECT * FROM contacts WHERE tenant_id = ? AND phone = ?',
                [tenantId, phone]
            );

            if (!contact) {
                res.status(404).json({ success: false, error: 'Contato não encontrado' });
                return;
            }

            res.status(200).json({
                success: true,
                contact: {
                    phone: contact.phone,
                    name: contact.name,
                    tags: contact.tags ? JSON.parse(contact.tags) : [],
                    email: contact.email,
                    customFields: contact.custom_fields ? JSON.parse(contact.custom_fields) : {}
                }
            });
        } catch (error: any) {
            this.logger.error('API: Erro ao buscar contato', error);
            res.status(500).json({ success: false, error: error.message });
        }
    }

    /**
     * Cria ou atualiza um contato (Upsert)
     */
    async upsertContact(req: AuthRequest, res: Response): Promise<void> {
        const { phone, name, email, tags, customFields } = req.body;
        const tenantId = req.tenantId;

        if (!phone) {
            res.status(400).json({ success: false, error: 'Phone é obrigatório' });
            return;
        }

        try {
            const existing = await this.database.get<{ id: string }>('SELECT id FROM contacts WHERE tenant_id = ? AND phone = ?', [tenantId, phone]);

            if (existing) {
                await this.database.run(
                    `UPDATE contacts SET name = COALESCE(?, name), email = COALESCE(?, email), tags = COALESCE(?, tags), custom_fields = COALESCE(?, custom_fields), updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
                    [name, email, JSON.stringify(tags || []), JSON.stringify(customFields || {}), existing.id]
                );
            } else {
                await this.database.run(
                    `INSERT INTO contacts (id, tenant_id, phone, name, email, tags, custom_fields) VALUES (?, ?, ?, ?, ?, ?, ?)`,
                    [`ct_${Date.now()}`, tenantId, phone, name || phone, email, JSON.stringify(tags || []), JSON.stringify(customFields || {})]
                );
            }

            res.status(200).json({ success: true, message: 'Contato salvo com sucesso' });
        } catch (error: any) {
            this.logger.error('API: Erro ao salvar contato', error);
            res.status(500).json({ success: false, error: error.message });
        }
    }

    /**
     * Verifica qual instância usar (pega a primeira conectada se não especificada)
     */
    private async getDefaultInstance(tenantId: string): Promise<string | null> {
        const instances = await this.database.query<any>(
            "SELECT id FROM instances WHERE tenant_id = ? AND status = 'connected' LIMIT 1",
            [tenantId]
        );
        return instances.length > 0 ? instances[0].id : null;
    }
}
