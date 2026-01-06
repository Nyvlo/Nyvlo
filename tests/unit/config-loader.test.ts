import { ConfigLoader } from '../../src/config/config-loader';

describe('ConfigLoader', () => {
  describe('load', () => {
    it('should load default configuration when no file exists', () => {
      const config = ConfigLoader.load();
      
      expect(config).toBeDefined();
      expect(config.company.name).toBe('Modus Centro de Formação de Vigilantes');
      expect(config.courses).toHaveLength(3);
      expect(config.faq.categories).toHaveLength(4);
    });

    it('should have valid business hours', () => {
      const config = ConfigLoader.load();
      
      expect(config.businessHours.weekdays).toBeDefined();
      expect(config.businessHours.weekdays?.start).toBe('08:00');
      expect(config.businessHours.weekdays?.end).toBe('18:00');
    });

    it('should have valid bot settings', () => {
      const config = ConfigLoader.load();
      
      expect(config.bot.sessionTimeout).toBe(30);
      expect(config.bot.maxReconnectAttempts).toBe(5);
      expect(config.bot.messageDelay).toBe(1000);
    });
  });

  describe('validate', () => {
    it('should return no errors for valid config', () => {
      const config = ConfigLoader.load();
      const errors = ConfigLoader.validate(config);
      
      expect(errors).toHaveLength(0);
    });

    it('should return error for missing company name', () => {
      const config = ConfigLoader.load();
      config.company.name = '';
      
      const errors = ConfigLoader.validate(config);
      
      expect(errors).toContain('Nome da empresa é obrigatório');
    });

    it('should return error for invalid session timeout', () => {
      const config = ConfigLoader.load();
      config.bot.sessionTimeout = 0;
      
      const errors = ConfigLoader.validate(config);
      
      expect(errors).toContain('Timeout de sessão deve ser maior que 0');
    });
  });
});
