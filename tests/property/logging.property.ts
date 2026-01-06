import * as fc from 'fast-check';
import * as fs from 'fs';
import * as path from 'path';
import { LogService, LogEntry } from '../../src/services/log-service';

/**
 * **Feature: whatsapp-bot-modus, Property 29: Errors Logged With Required Fields**
 * **Validates: Requirements 10.4**
 * 
 * For any error that occurs, the log entry SHALL contain timestamp, error type, and error details.
 */
describe('Property Tests: Logging', () => {
  const testLogDir = 'test-logs';
  
  beforeEach(() => {
    // Clean up test logs
    if (fs.existsSync(testLogDir)) {
      const files = fs.readdirSync(testLogDir);
      files.forEach(file => fs.unlinkSync(path.join(testLogDir, file)));
    }
  });

  afterAll(() => {
    // Clean up test logs directory
    if (fs.existsSync(testLogDir)) {
      const files = fs.readdirSync(testLogDir);
      files.forEach(file => fs.unlinkSync(path.join(testLogDir, file)));
      fs.rmdirSync(testLogDir);
    }
  });

  describe('Property 29: Errors Logged With Required Fields', () => {
    it('should log errors with timestamp, level, and message', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 100 }),
          (errorMessage) => {
            const logger = new LogService(testLogDir);
            logger.error(errorMessage);

            // Read the log file
            const files = fs.readdirSync(testLogDir);
            expect(files.length).toBeGreaterThan(0);

            const logContent = fs.readFileSync(path.join(testLogDir, files[0]), 'utf-8');
            const lines = logContent.trim().split('\n');
            const lastEntry: LogEntry = JSON.parse(lines[lines.length - 1]);

            // Verify required fields
            expect(lastEntry.timestamp).toBeDefined();
            expect(lastEntry.level).toBe('error');
            expect(lastEntry.message).toBe(errorMessage);

            // Verify timestamp format (ISO 8601)
            expect(new Date(lastEntry.timestamp).toISOString()).toBe(lastEntry.timestamp);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should include error details when provided', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 50 }),
          fc.string({ minLength: 1, maxLength: 100 }),
          (errorName, errorMsg) => {
            const logger = new LogService(testLogDir);
            const error = new Error(errorMsg);
            error.name = errorName;
            
            logger.error('Test error', error);

            const files = fs.readdirSync(testLogDir);
            const logContent = fs.readFileSync(path.join(testLogDir, files[0]), 'utf-8');
            const lines = logContent.trim().split('\n');
            const lastEntry: LogEntry = JSON.parse(lines[lines.length - 1]);

            expect(lastEntry.details).toBeDefined();
            expect((lastEntry.details as any).name).toBe(errorName);
            expect((lastEntry.details as any).message).toBe(errorMsg);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should log all severity levels correctly', () => {
      fc.assert(
        fc.property(
          fc.constantFrom('info', 'warn', 'error', 'debug'),
          fc.string({ minLength: 1, maxLength: 50 }),
          (level, message) => {
            const logger = new LogService(testLogDir);
            
            switch (level) {
              case 'info':
                logger.info(message);
                break;
              case 'warn':
                logger.warn(message);
                break;
              case 'error':
                logger.error(message);
                break;
              case 'debug':
                logger.debug(message);
                break;
            }

            const files = fs.readdirSync(testLogDir);
            const logContent = fs.readFileSync(path.join(testLogDir, files[0]), 'utf-8');
            const lines = logContent.trim().split('\n');
            const lastEntry: LogEntry = JSON.parse(lines[lines.length - 1]);

            expect(lastEntry.level).toBe(level);
            expect(lastEntry.message).toBe(message);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should create log entries with monotonically increasing timestamps', () => {
      fc.assert(
        fc.property(
          fc.array(fc.string({ minLength: 1, maxLength: 20 }), { minLength: 2, maxLength: 10 }),
          (messages) => {
            const logger = new LogService(testLogDir);
            
            messages.forEach(msg => logger.info(msg));

            const files = fs.readdirSync(testLogDir);
            const logContent = fs.readFileSync(path.join(testLogDir, files[0]), 'utf-8');
            const entries: LogEntry[] = logContent.trim().split('\n').map(line => JSON.parse(line));

            // Verify timestamps are in order
            for (let i = 1; i < entries.length; i++) {
              const prev = new Date(entries[i - 1].timestamp).getTime();
              const curr = new Date(entries[i].timestamp).getTime();
              expect(curr).toBeGreaterThanOrEqual(prev);
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
