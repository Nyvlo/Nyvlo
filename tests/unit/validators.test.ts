import { validateCPF, validateEmail, validateDate, validatePhone } from '../../src/utils/validators';

describe('Validators', () => {
  describe('validateCPF', () => {
    it('should accept valid CPF', () => {
      expect(validateCPF('529.982.247-25')).toBe(true);
      expect(validateCPF('52998224725')).toBe(true);
    });

    it('should reject invalid CPF', () => {
      expect(validateCPF('111.111.111-11')).toBe(false);
      expect(validateCPF('123.456.789-00')).toBe(false);
      expect(validateCPF('12345678900')).toBe(false);
    });

    it('should reject CPF with wrong length', () => {
      expect(validateCPF('123456789')).toBe(false);
      expect(validateCPF('1234567890123')).toBe(false);
    });

    it('should reject empty or null CPF', () => {
      expect(validateCPF('')).toBe(false);
      expect(validateCPF('   ')).toBe(false);
    });
  });

  describe('validateEmail', () => {
    it('should accept valid email', () => {
      expect(validateEmail('test@example.com')).toBe(true);
      expect(validateEmail('user.name@domain.com.br')).toBe(true);
    });

    it('should reject invalid email', () => {
      expect(validateEmail('invalid')).toBe(false);
      expect(validateEmail('invalid@')).toBe(false);
      expect(validateEmail('@domain.com')).toBe(false);
    });
  });

  describe('validateDate', () => {
    it('should accept valid date format DD/MM/YYYY', () => {
      expect(validateDate('01/01/2000')).toBe(true);
      expect(validateDate('31/12/1990')).toBe(true);
    });

    it('should reject invalid date format', () => {
      expect(validateDate('2000-01-01')).toBe(false);
      expect(validateDate('01-01-2000')).toBe(false);
      expect(validateDate('32/01/2000')).toBe(false);
    });
  });

  describe('validatePhone', () => {
    it('should accept valid phone numbers', () => {
      expect(validatePhone('11999999999')).toBe(true);
      expect(validatePhone('(11) 99999-9999')).toBe(true);
      expect(validatePhone('11 99999 9999')).toBe(true);
    });

    it('should reject invalid phone numbers', () => {
      expect(validatePhone('123')).toBe(false);
      expect(validatePhone('abcdefghijk')).toBe(false);
    });
  });
});
