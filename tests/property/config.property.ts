import * as fc from 'fast-check';
import { ConfigLoader } from '../../src/config/config-loader';
import { BotConfig } from '../../src/types/config';

/**
 * **Feature: whatsapp-bot-modus, Property 31: Configuration Loaded From JSON**
 * **Validates: Requirements 11.5**
 * 
 * For any system startup, all bot settings SHALL match the values in the configuration JSON file.
 */
describe('Property Tests: Configuration', () => {
  describe('Property 31: Configuration Loaded From JSON', () => {
    it('should load configuration with all required fields', () => {
      fc.assert(
        fc.property(fc.constant(null), () => {
          const config = ConfigLoader.load();
          
          // Verify all required top-level fields exist
          expect(config.company).toBeDefined();
          expect(config.businessHours).toBeDefined();
          expect(config.bot).toBeDefined();
          expect(config.messages).toBeDefined();
          expect(config.courses).toBeDefined();
          expect(config.faq).toBeDefined();
          
          // Verify company info
          expect(typeof config.company.name).toBe('string');
          expect(config.company.name.length).toBeGreaterThan(0);
          
          // Verify bot settings are valid numbers
          expect(typeof config.bot.sessionTimeout).toBe('number');
          expect(config.bot.sessionTimeout).toBeGreaterThan(0);
          expect(typeof config.bot.maxReconnectAttempts).toBe('number');
          expect(config.bot.maxReconnectAttempts).toBeGreaterThan(0);
          
          // Verify courses is an array
          expect(Array.isArray(config.courses)).toBe(true);
          
          // Verify FAQ structure
          expect(Array.isArray(config.faq.categories)).toBe(true);
          expect(Array.isArray(config.faq.questions)).toBe(true);
        }),
        { numRuns: 100 }
      );
    });

    it('should maintain configuration consistency across multiple loads', () => {
      fc.assert(
        fc.property(fc.integer({ min: 1, max: 10 }), (loadCount) => {
          const configs: BotConfig[] = [];
          
          for (let i = 0; i < loadCount; i++) {
            configs.push(ConfigLoader.load());
          }
          
          // All loads should return equivalent configurations
          const firstConfig = JSON.stringify(configs[0]);
          for (const config of configs) {
            expect(JSON.stringify(config)).toBe(firstConfig);
          }
        }),
        { numRuns: 100 }
      );
    });

    it('should have valid business hours format', () => {
      fc.assert(
        fc.property(fc.constant(null), () => {
          const config = ConfigLoader.load();
          const timeRegex = /^\d{2}:\d{2}$/;
          
          if (config.businessHours.weekdays) {
            expect(config.businessHours.weekdays.start).toMatch(timeRegex);
            expect(config.businessHours.weekdays.end).toMatch(timeRegex);
          }
          
          if (config.businessHours.saturday) {
            expect(config.businessHours.saturday.start).toMatch(timeRegex);
            expect(config.businessHours.saturday.end).toMatch(timeRegex);
          }
        }),
        { numRuns: 100 }
      );
    });
  });
});
