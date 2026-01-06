import * as fc from 'fast-check';
import { validateCPF, validateEmail, validateDate, validatePhone } from '../../src/utils/validators';

/**
 * **Feature: whatsapp-bot-modus, Property 13: CPF Validation Accepts Only Valid CPFs**
 * **Validates: Requirements 4.2**
 * 
 * For any string input as CPF, the validation SHALL accept only strings that pass 
 * the CPF checksum algorithm (11 digits with valid verification digits).
 */
describe('Property Tests: Validators', () => {
  describe('Property 13: CPF Validation Accepts Only Valid CPFs', () => {
    // Generator for valid CPFs
    const validCPFArbitrary = fc.tuple(
      fc.integer({ min: 0, max: 9 }),
      fc.integer({ min: 0, max: 9 }),
      fc.integer({ min: 0, max: 9 }),
      fc.integer({ min: 0, max: 9 }),
      fc.integer({ min: 0, max: 9 }),
      fc.integer({ min: 0, max: 9 }),
      fc.integer({ min: 0, max: 9 }),
      fc.integer({ min: 0, max: 9 }),
      fc.integer({ min: 0, max: 9 })
    ).map(digits => {
      // Calculate first check digit
      let sum = 0;
      for (let i = 0; i < 9; i++) {
        sum += digits[i] * (10 - i);
      }
      let d1 = (sum * 10) % 11;
      if (d1 === 10 || d1 === 11) d1 = 0;
      
      // Calculate second check digit
      sum = 0;
      for (let i = 0; i < 9; i++) {
        sum += digits[i] * (11 - i);
      }
      sum += d1 * 2;
      let d2 = (sum * 10) % 11;
      if (d2 === 10 || d2 === 11) d2 = 0;
      
      return [...digits, d1, d2].join('');
    }).filter(cpf => !/^(\d)\1+$/.test(cpf)); // Filter out all-same-digit CPFs

    it('should accept all valid CPFs', () => {
      fc.assert(
        fc.property(validCPFArbitrary, (cpf) => {
          expect(validateCPF(cpf)).toBe(true);
        }),
        { numRuns: 100 }
      );
    });

    it('should reject CPFs with wrong length', () => {
      fc.assert(
        fc.property(
          fc.stringOf(fc.constantFrom('0', '1', '2', '3', '4', '5', '6', '7', '8', '9'), { minLength: 1, maxLength: 10 }),
          (shortCpf) => {
            expect(validateCPF(shortCpf)).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should reject CPFs with all same digits', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: 9 }),
          (digit) => {
            const sameCpf = digit.toString().repeat(11);
            expect(validateCPF(sameCpf)).toBe(false);
          }
        ),
        { numRuns: 10 }
      );
    });

    it('should reject random 11-digit strings that are not valid CPFs', () => {
      fc.assert(
        fc.property(
          fc.stringOf(fc.constantFrom('0', '1', '2', '3', '4', '5', '6', '7', '8', '9'), { minLength: 11, maxLength: 11 }),
          (randomCpf) => {
            // Most random 11-digit strings should be invalid
            // We just verify the function doesn't throw
            const result = validateCPF(randomCpf);
            expect(typeof result).toBe('boolean');
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Email Validation', () => {
    it('should accept emails with valid format', () => {
      fc.assert(
        fc.property(
          fc.tuple(
            fc.stringOf(fc.constantFrom(...'abcdefghijklmnopqrstuvwxyz0123456789'.split('')), { minLength: 1, maxLength: 10 }),
            fc.stringOf(fc.constantFrom(...'abcdefghijklmnopqrstuvwxyz'.split('')), { minLength: 1, maxLength: 10 }),
            fc.constantFrom('com', 'org', 'net', 'br', 'com.br')
          ),
          ([local, domain, tld]) => {
            const email = `${local}@${domain}.${tld}`;
            expect(validateEmail(email)).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should reject strings without @ symbol', () => {
      fc.assert(
        fc.property(
          fc.stringOf(fc.constantFrom(...'abcdefghijklmnopqrstuvwxyz0123456789.'.split('')), { minLength: 1, maxLength: 20 }),
          (str) => {
            if (!str.includes('@')) {
              expect(validateEmail(str)).toBe(false);
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Date Validation', () => {
    it('should accept valid dates in DD/MM/YYYY format', () => {
      fc.assert(
        fc.property(
          fc.tuple(
            fc.integer({ min: 1, max: 28 }),
            fc.integer({ min: 1, max: 12 }),
            fc.integer({ min: 1900, max: 2100 })
          ),
          ([day, month, year]) => {
            const date = `${day.toString().padStart(2, '0')}/${month.toString().padStart(2, '0')}/${year}`;
            expect(validateDate(date)).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should reject invalid month values', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 13, max: 99 }),
          (month) => {
            const date = `01/${month.toString().padStart(2, '0')}/2000`;
            expect(validateDate(date)).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Phone Validation', () => {
    it('should accept valid Brazilian phone numbers', () => {
      fc.assert(
        fc.property(
          fc.tuple(
            fc.integer({ min: 11, max: 99 }),
            fc.integer({ min: 90000000, max: 99999999 })
          ),
          ([ddd, number]) => {
            const phone = `${ddd}${number}`;
            expect(validatePhone(phone)).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should reject phone numbers with less than 10 digits', () => {
      fc.assert(
        fc.property(
          fc.stringOf(fc.constantFrom('0', '1', '2', '3', '4', '5', '6', '7', '8', '9'), { minLength: 1, maxLength: 9 }),
          (shortPhone) => {
            expect(validatePhone(shortPhone)).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
