import { v4 as uuidv4 } from 'uuid';
import { DatabaseService } from '../services/database-service';
import { LogService } from '../services/log-service';
import { BotConfig } from '../types/config';
import { BotState, UserState, ConversationContext } from '../types/state';

export class StateManager {
  private database: DatabaseService;
  private config: BotConfig;
  private logger: LogService;

  constructor(database: DatabaseService, config: BotConfig, logger: LogService) {
    this.database = database;
    this.config = config;
    this.logger = logger;
  }

  async getState(userId: string, tenantId: string = 'system-default'): Promise<UserState> {
    // Get the actual user ID from phone and tenant
    const user = await this.database.get<{ id: string }>('SELECT id FROM users WHERE phone = ? AND tenant_id = ?', [userId, tenantId]);

    if (!user) {
      return this.createDefaultState();
    }

    const session = await this.database.get<{ state: string; data: string; last_activity: string }>(
      'SELECT state, data, last_activity FROM sessions WHERE user_id = ? AND tenant_id = ?',
      [user.id, tenantId]
    );

    if (!session) {
      return this.createDefaultState();
    }

    const data = JSON.parse(session.data || '{}');

    return {
      currentState: session.state as BotState,
      previousState: data.previousState || null,
      data: data.data || {},
      lastActivity: new Date(session.last_activity).getTime(),
      context: data.context || {}
    };
  }

  async setState(userId: string, state: UserState, tenantId: string = 'system-default'): Promise<void> {
    // Ensure user exists first and get the actual user ID
    const actualUserId = await this.ensureUser(userId, tenantId);

    const sessionData = JSON.stringify({
      previousState: state.previousState,
      data: state.data,
      context: state.context
    });

    const existing = await this.database.get<{ id: string }>('SELECT id FROM sessions WHERE user_id = ? AND tenant_id = ?', [actualUserId, tenantId]);

    if (existing) {
      await this.database.run(
        'UPDATE sessions SET state = ?, data = ?, last_activity = CURRENT_TIMESTAMP WHERE user_id = ? AND tenant_id = ?',
        [state.currentState, sessionData, actualUserId, tenantId]
      );
    } else {
      await this.database.run(
        'INSERT INTO sessions (id, tenant_id, user_id, state, data) VALUES (?, ?, ?, ?, ?)',
        [uuidv4(), tenantId, actualUserId, state.currentState, sessionData]
      );
    }
  }

  async checkTimeout(userId: string, tenantId: string = 'system-default'): Promise<boolean> {
    const state = await this.getState(userId, tenantId);
    const timeoutMs = this.config.bot.sessionTimeout * 60 * 1000;
    const now = Date.now();

    return (now - state.lastActivity) > timeoutMs;
  }

  async resetState(userId: string, tenantId: string = 'system-default'): Promise<void> {
    await this.setState(userId, this.createDefaultState(), tenantId);
  }

  async transition(userId: string, nextState: BotState, contextUpdate?: Partial<ConversationContext>, tenantId: string = 'system-default'): Promise<void> {
    const currentState = await this.getState(userId, tenantId);

    const newState: UserState = {
      currentState: nextState,
      previousState: currentState.currentState,
      data: currentState.data,
      lastActivity: Date.now(),
      context: {
        ...currentState.context,
        ...contextUpdate
      }
    };

    await this.setState(userId, newState, tenantId);
  }

  async updateContext(userId: string, contextUpdate: Partial<ConversationContext>, tenantId: string = 'system-default'): Promise<void> {
    const currentState = await this.getState(userId, tenantId);

    const newState: UserState = {
      ...currentState,
      lastActivity: Date.now(),
      context: {
        ...currentState.context,
        ...contextUpdate
      }
    };

    await this.setState(userId, newState, tenantId);
  }

  private async ensureUser(phone: string, tenantId: string): Promise<string> {
    const existing = await this.database.get<{ id: string }>('SELECT id FROM users WHERE phone = ? AND tenant_id = ?', [phone, tenantId]);

    if (!existing) {
      try {
        const userId = uuidv4();
        await this.database.run(
          'INSERT INTO users (id, tenant_id, phone, name, type) VALUES (?, ?, ?, ?, \'lead\')',
          [userId, tenantId, phone, `Usuário ${phone.slice(-4)}`]
        );
        return userId;
      } catch (error) {
        // User might have been created by another process, try to get it
        const retry = await this.database.get<{ id: string }>('SELECT id FROM users WHERE phone = ? AND tenant_id = ?', [phone, tenantId]);
        if (retry) {
          return retry.id;
        }
        throw error;
      }
    } else {
      await this.database.run(
        'UPDATE users SET updated_at = CURRENT_TIMESTAMP WHERE phone = ? AND tenant_id = ?',
        [phone, tenantId]
      );
      return existing.id;
    }
  }

  private createDefaultState(): UserState {
    return {
      currentState: BotState.WELCOME,
      previousState: null,
      data: {},
      lastActivity: Date.now(),
      context: {}
    };
  }
}
