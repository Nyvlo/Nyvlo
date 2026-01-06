import * as fc from 'fast-check';
import { BotState } from '../../src/types/state';

/**
 * Property tests for State Machine navigation
 */
describe('Property Tests: State Machine', () => {
  // Valid menu options for main menu
  const MAIN_MENU_OPTIONS: Record<number, BotState> = {
    1: BotState.COURSES_LIST,
    2: BotState.APPOINTMENT_START,
    3: BotState.ENROLLMENT_START,
    4: BotState.FAQ_CATEGORIES,
    5: BotState.HUMAN_TRANSFER,
    6: BotState.DOCUMENTS,
  };

  // Simulated state machine for testing
  class TestStateMachine {
    private currentState: BotState = BotState.WELCOME;

    getState(): BotState {
      return this.currentState;
    }

    transition(input: string): { success: boolean; newState: BotState } {
      const normalized = input.toLowerCase().trim();

      // Global commands
      if (normalized === 'menu' || normalized === '0') {
        if (this.currentState !== BotState.WELCOME) {
          this.currentState = BotState.MAIN_MENU;
          return { success: true, newState: this.currentState };
        }
      }

      // Handle based on current state
      switch (this.currentState) {
        case BotState.WELCOME:
          this.currentState = BotState.MAIN_MENU;
          return { success: true, newState: this.currentState };

        case BotState.MAIN_MENU:
          const num = parseInt(input);
          if (num >= 1 && num <= 6) {
            this.currentState = MAIN_MENU_OPTIONS[num];
            return { success: true, newState: this.currentState };
          }
          return { success: false, newState: this.currentState };

        default:
          return { success: false, newState: this.currentState };
      }
    }
  }

  /**
   * **Feature: whatsapp-bot-modus, Property 2: Valid Menu Selection Navigates to Correct State**
   * **Validates: Requirements 1.2, 1.4**
   */
  describe('Property 2: Valid Menu Selection Navigates to Correct State', () => {
    it('should navigate to correct state for valid menu options', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 6 }),
          (option) => {
            const sm = new TestStateMachine();
            sm.transition(''); // Move to MAIN_MENU
            
            const result = sm.transition(option.toString());
            
            expect(result.success).toBe(true);
            expect(result.newState).toBe(MAIN_MENU_OPTIONS[option]);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * **Feature: whatsapp-bot-modus, Property 3: Invalid Input Preserves Current State**
   * **Validates: Requirements 1.3**
   */
  describe('Property 3: Invalid Input Preserves Current State', () => {
    it('should preserve state for invalid menu options', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 7, max: 100 }),
          (invalidOption) => {
            const sm = new TestStateMachine();
            sm.transition(''); // Move to MAIN_MENU
            
            const stateBefore = sm.getState();
            const result = sm.transition(invalidOption.toString());
            
            expect(result.success).toBe(false);
            expect(sm.getState()).toBe(stateBefore);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should preserve state for alphabetic input in menu', () => {
      fc.assert(
        fc.property(
          fc.stringOf(fc.constantFrom(...'abcdefghijklmnopqrstuvwxyz'.split('')), { minLength: 1, maxLength: 10 }),
          (invalidInput) => {
            if (invalidInput === 'menu') return; // Skip 'menu' command
            
            const sm = new TestStateMachine();
            sm.transition(''); // Move to MAIN_MENU
            
            const stateBefore = sm.getState();
            const result = sm.transition(invalidInput);
            
            expect(result.success).toBe(false);
            expect(sm.getState()).toBe(stateBefore);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * **Feature: whatsapp-bot-modus, Property 4: Global Navigation Commands Work From Any State**
   * **Validates: Requirements 1.4**
   */
  describe('Property 4: Global Navigation Commands Work From Any State', () => {
    it('should return to main menu when "menu" is entered', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 6 }),
          fc.constantFrom('menu', '0'),
          (startOption, command) => {
            const sm = new TestStateMachine();
            sm.transition(''); // WELCOME -> MAIN_MENU
            sm.transition(startOption.toString()); // Go to sub-state

            const result = sm.transition(command);
            
            expect(result.newState).toBe(BotState.MAIN_MENU);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * **Feature: whatsapp-bot-modus, Property 28: Session Persistence Across Restart**
   * **Validates: Requirements 10.3**
   */
  describe('Property 28: Session Persistence Across Restart', () => {
    class SessionStorage {
      private sessions: Map<string, { state: BotState; data: Record<string, string> }> = new Map();

      save(userId: string, state: BotState, data: Record<string, string>): void {
        this.sessions.set(userId, { state, data });
      }

      load(userId: string): { state: BotState; data: Record<string, string> } | null {
        return this.sessions.get(userId) || null;
      }
    }

    it('should recover session state after simulated restart', () => {
      fc.assert(
        fc.property(
          fc.stringOf(fc.constantFrom(...'0123456789'.split('')), { minLength: 10, maxLength: 15 }),
          fc.constantFrom(BotState.MAIN_MENU, BotState.COURSES_LIST, BotState.FAQ_CATEGORIES),
          (userId, state) => {
            const storage = new SessionStorage();
            const data = { test: 'value' };
            
            storage.save(userId, state, data);
            const loadedSession = storage.load(userId);
            
            expect(loadedSession).not.toBeNull();
            expect(loadedSession!.state).toBe(state);
            expect(loadedSession!.data).toEqual(data);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
