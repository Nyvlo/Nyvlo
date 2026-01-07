import { LogService } from './log-service';
import { AIService } from './ai-service';
import { DatabaseService } from './database-service';
import fs from 'fs';
import path from 'path';
// @ts-ignore
import pdf from 'pdf-parse';

export class DocumentProcessorService {
    constructor(
        private logger: LogService,
        private aiService: AIService,
        private database: DatabaseService
    ) { }

    /**
     * Processa um arquivo e tenta enriquecer o cadastro do cliente
     */
    async processAndEnrich(
        tenantId: string,
        userId: string,
        filePath: string,
        mimeType: string
    ): Promise<{ success: boolean; data?: any; message?: string }> {

        if (!this.aiService.isEnabled()) {
            return { success: false, message: 'IA não ativada' };
        }

        try {
            this.logger.info(`Iniciando processamento de documento para enriquecimento`, { tenantId, userId, mimeType });

            let textContent = '';

            // 1. Extração de Texto
            if (mimeType === 'application/pdf') {
                const dataBuffer = fs.readFileSync(filePath);
                const data = await pdf(dataBuffer);
                textContent = data.text;
            } else if (mimeType.startsWith('text/')) {
                textContent = fs.readFileSync(filePath, 'utf-8');
            } else {
                // TODO: Implementar OCR para imagens no futuro
                return { success: false, message: 'Formato não suportado para extração automática de texto no momento (Apenas PDF e Texto).' };
            }

            if (!textContent || textContent.length < 10) {
                return { success: false, message: 'Não foi possível extrair texto legível do documento.' };
            }

            // 2. Extração de Entidades com IA
            const fieldsToExtract = [
                'nome_completo', 'cpf', 'cnpj', 'emails', 'telefones',
                'enderecos (com logradouro, numero, bairro, cidade, cep)',
                'data_nascimento', 'profissao', 'estado_civil'
            ];

            const extractedData = await this.aiService.extractData(textContent, fieldsToExtract);

            if (!extractedData) {
                return { success: false, message: 'A IA não encontrou dados relevantes no documento.' };
            }

            // 3. Enriquecimento do Cadastro (Salvar no Banco)
            await this.enrichCustomerData(tenantId, userId, extractedData);

            return { success: true, data: extractedData };

        } catch (error) {
            this.logger.error('Erro no processamento de documento', error as Error);
            return { success: false, message: 'Erro interno ao processar documento.' };
        }
    }

    private async enrichCustomerData(tenantId: string, userId: string, newData: any): Promise<void> {
        // Busca dados atuais
        const customer = await this.database.get<any>(
            'SELECT * FROM web_customers WHERE tenant_id = ? AND (whatsapp_id = ? OR phone_number = ?)',
            [tenantId, userId, userId.split('@')[0]]
        );

        if (!customer) {
            // Se não existir, cria um básico (embora o handler já deva ter criado)
            // ... Log e return
            this.logger.warn(`Cliente não encontrado para enriquecimento: ${userId}`);
            return;
        }

        // Merge de dados (Lógica simples: aditivo)
        // Se customer.notes ou um campo JSON 'enrichment_data' existir

        // Vamos verificar se existe um campo adequado. Se não, vamos usar 'notes' como append ou criar um JSON se a tabela permitir.
        // O banco tem a tabela `web_customers`. Vou assumir que posso salvar no campo `notes` (append) ou se eu tiver adicionado uma coluna JSON.
        // Como não posso alterar schema facilmente agora sem migration, vou usar uma estratégia híbrida:
        // 1. Atualizar campos padrão se vazios (email, nome, document).
        // 2. Salvar o JSON completo em `notes` formatado ou em uma nova tabela de `customer_attributes` se eu tivesse criado.
        // O usuário pediu "filtrar e anexar".

        // Melhor: Salvar em `notes` de forma estruturada ou atualizar campos.

        const updates: any[] = [];
        const params: any[] = [];

        // Tentar preencher campos vazios
        if (!customer.email && newData.emails && newData.emails.length > 0) {
            updates.push('email = ?');
            params.push(newData.emails[0]);
        }
        if (!customer.document && (newData.cpf || newData.cnpj)) {
            updates.push('document = ?');
            params.push(newData.cpf || newData.cnpj);
        }
        if ((!customer.name || customer.name === userId) && newData.nome_completo) {
            updates.push('name = ?');
            params.push(newData.nome_completo);
        }

        // Append no Notes
        const currentNotes = customer.notes || '';
        const enrichmentLog = `\n--- Enriquecimento Automático (${new Date().toLocaleDateString()}) ---\n${JSON.stringify(newData, null, 2)}`;

        updates.push('notes = ?');
        params.push(currentNotes + enrichmentLog);

        params.push(customer.id);

        if (updates.length > 0) {
            const sql = `UPDATE web_customers SET ${updates.join(', ')} WHERE id = ?`;
            await this.database.run(sql, params);
            this.logger.info(`Cadastro do cliente ${customer.id} enriquecido.`, { updates });
        }
    }
}
