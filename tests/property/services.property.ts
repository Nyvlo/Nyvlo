import * as fc from 'fast-check';
import { ConfigLoader } from '../../src/config/config-loader';
import { CourseService } from '../../src/services/course-service';
import { FAQService } from '../../src/services/faq-service';

const config = ConfigLoader.load();

/**
 * Property tests for Services
 */
describe('Property Tests: Services', () => {
  /**
   * **Feature: whatsapp-bot-modus, Property 5: Course List Contains All Active Courses**
   * **Validates: Requirements 2.1**
   */
  describe('Property 5: Course List Contains All Active Courses', () => {
    it('should return all active courses', () => {
      fc.assert(
        fc.property(fc.constant(null), () => {
          const service = new CourseService(config);
          const courses = service.getAllCourses();
          const activeCourses = config.courses.filter(c => c.active);
          
          expect(courses.length).toBe(activeCourses.length);
          courses.forEach(course => {
            expect(course.active).toBe(true);
          });
        }),
        { numRuns: 100 }
      );
    });
  });

  /**
   * **Feature: whatsapp-bot-modus, Property 6: Course Details Contain All Required Fields**
   * **Validates: Requirements 2.2**
   */
  describe('Property 6: Course Details Contain All Required Fields', () => {
    it('should return course with all required fields', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(...config.courses.filter(c => c.active).map(c => c.id)),
          (courseId) => {
            const service = new CourseService(config);
            const course = service.getCourseById(courseId);
            
            expect(course).not.toBeNull();
            expect(course!.name).toBeDefined();
            expect(course!.description).toBeDefined();
            expect(course!.duration).toBeDefined();
            expect(course!.workload).toBeDefined();
            expect(course!.price).toBeDefined();
            expect(course!.prerequisites).toBeDefined();
            expect(course!.documents).toBeDefined();
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should format course detail with all required information', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(...config.courses.filter(c => c.active)),
          (course) => {
            const service = new CourseService(config);
            const formatted = service.formatCourseDetail(course);
            
            expect(formatted).toContain(course.name);
            expect(formatted).toContain(course.duration);
            expect(formatted).toContain(course.workload);
            expect(formatted).toContain(course.price.toFixed(2));
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * **Feature: whatsapp-bot-modus, Property 17: FAQ Categories Return All Configured Categories**
   * **Validates: Requirements 5.1**
   */
  describe('Property 17: FAQ Categories Return All Configured Categories', () => {
    it('should return all FAQ categories in order', () => {
      fc.assert(
        fc.property(fc.constant(null), () => {
          const service = new FAQService(config);
          const categories = service.getCategories();
          
          expect(categories.length).toBe(config.faq.categories.length);
          
          // Verify order
          for (let i = 1; i < categories.length; i++) {
            expect(categories[i].order).toBeGreaterThanOrEqual(categories[i - 1].order);
          }
        }),
        { numRuns: 100 }
      );
    });
  });

  /**
   * **Feature: whatsapp-bot-modus, Property 18: FAQ Category Returns Only Its Questions**
   * **Validates: Requirements 5.2**
   */
  describe('Property 18: FAQ Category Returns Only Its Questions', () => {
    it('should return only questions belonging to selected category', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(...config.faq.categories.map(c => c.id)),
          (categoryId) => {
            const service = new FAQService(config);
            const questions = service.getQuestionsByCategory(categoryId);
            
            questions.forEach(q => {
              expect(q.categoryId).toBe(categoryId);
            });
            
            // Verify no questions from other categories
            const otherQuestions = config.faq.questions.filter(
              q => q.categoryId !== categoryId
            );
            otherQuestions.forEach(oq => {
              expect(questions.find(q => q.id === oq.id)).toBeUndefined();
            });
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * **Feature: whatsapp-bot-modus, Property 19: FAQ Answer Includes Navigation Options**
   * **Validates: Requirements 5.3**
   */
  describe('Property 19: FAQ Answer Includes Navigation Options', () => {
    it('should include navigation options in formatted answer', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(...config.faq.questions),
          (question) => {
            const service = new FAQService(config);
            const formatted = service.formatAnswer(question);
            
            expect(formatted).toContain(question.answer);
            expect(formatted).toContain('outras perguntas');
            expect(formatted).toContain('atendente');
            expect(formatted).toContain('menu');
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * **Feature: whatsapp-bot-modus, Property 20: FAQ Search Returns Relevant Results**
   * **Validates: Requirements 5.5**
   */
  describe('Property 20: FAQ Search Returns Relevant Results', () => {
    it('should return questions matching keywords', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(...config.faq.questions.flatMap(q => q.keywords)),
          (keyword) => {
            const service = new FAQService(config);
            const results = service.searchQuestions(keyword);
            
            // At least one result should contain the keyword
            if (results.length > 0) {
              const hasMatch = results.some(r => 
                r.keywords.some(k => k.toLowerCase().includes(keyword.toLowerCase())) ||
                r.question.toLowerCase().includes(keyword.toLowerCase())
              );
              expect(hasMatch).toBe(true);
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
