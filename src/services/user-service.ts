import { v4 as uuidv4 } from 'uuid';
import { DatabaseService } from './database-service';
import { User, UserType } from '../types/database';

export class UserService {
  private database: DatabaseService;

  constructor(database: DatabaseService) {
    this.database = database;
  }

  async createOrUpdate(tenantId: string, phone: string, name?: string, email?: string): Promise<User> {
    const existing = await this.getByPhone(tenantId, phone);

    if (existing) {
      // Update existing user
      const updates: string[] = ['updated_at = CURRENT_TIMESTAMP'];
      const values: any[] = [];

      if (name) {
        updates.push('name = ?');
        values.push(name);
      }
      if (email) {
        updates.push('email = ?');
        values.push(email);
      }

      values.push(phone);
      values.push(tenantId);

      await this.database.run(`
        UPDATE users SET ${updates.join(', ')} WHERE phone = ? AND tenant_id = ?
      `, values);

      const updated = await this.getByPhone(tenantId, phone);
      return updated!;
    }

    // Create new user
    const id = uuidv4();
    await this.database.run(`
      INSERT INTO users (id, tenant_id, phone, name, email, type) VALUES (?, ?, ?, ?, ?, 'lead')
    `, [id, tenantId, phone, name || null, email || null]);

    return {
      id,
      phone,
      name: name || null,
      email: email || null,
      type: 'lead',
      optOutBroadcast: false,
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }

  async getByPhone(tenantId: string, phone: string): Promise<User | null> {
    const row = await this.database.get<any>(`
      SELECT * FROM users WHERE phone = ? AND tenant_id = ?
    `, [phone, tenantId]);

    if (!row) return null;

    return this.mapRowToUser(row);
  }

  async getById(tenantId: string, id: string): Promise<User | null> {
    const row = await this.database.get<any>(`
      SELECT * FROM users WHERE id = ? AND tenant_id = ?
    `, [id, tenantId]);

    if (!row) return null;

    return this.mapRowToUser(row);
  }

  async updateType(tenantId: string, phone: string, type: UserType): Promise<boolean> {
    const result = await this.database.run(`
      UPDATE users SET type = ?, updated_at = CURRENT_TIMESTAMP WHERE phone = ? AND tenant_id = ?
    `, [type, phone, tenantId]);

    return result.changes > 0;
  }

  async updateOptOut(tenantId: string, phone: string, optOut: boolean): Promise<boolean> {
    const result = await this.database.run(`
      UPDATE users SET opt_out_broadcast = ?, updated_at = CURRENT_TIMESTAMP WHERE phone = ? AND tenant_id = ?
    `, [optOut ? 1 : 0, phone, tenantId]);

    return result.changes > 0;
  }

  async getByType(tenantId: string, type: UserType): Promise<User[]> {
    const rows = await this.database.query<any>(`
      SELECT * FROM users WHERE type = ? AND tenant_id = ?
    `, [type, tenantId]);

    return rows.map(row => this.mapRowToUser(row));
  }

  async getBroadcastRecipients(tenantId: string, audience: 'all' | 'students' | 'leads' | 'alumni'): Promise<User[]> {
    let query = 'SELECT * FROM users WHERE opt_out_broadcast = 0 AND tenant_id = ?';
    const params: any[] = [tenantId];

    if (audience !== 'all') {
      query += ' AND type = ?';
      params.push(audience === 'students' ? 'student' : audience === 'leads' ? 'lead' : 'alumni');
    }

    const rows = await this.database.query<any>(query, params);
    return rows.map(row => this.mapRowToUser(row));
  }

  private mapRowToUser(row: any): User {
    return {
      id: row.id,
      phone: row.phone,
      name: row.name,
      email: row.email,
      type: row.type as UserType,
      optOutBroadcast: Boolean(row.opt_out_broadcast),
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at)
    };
  }
}
