import { describe, it, expect } from 'vitest';
import {
  lateTemplate1,
  lateTemplate2,
  lateTemplate3,
  onTimeTemplate,
  getReminderSubject,
} from '../lib/email-templates';

describe('Email Templates Utils (src/utils/email-templates.ts)', () => {
  describe('Template functions', () => {
    const testData = {
      name: 'Test User',
      week: 25,
      year: 2024,
      link: 'https://example.com/submit'
    };

    const templates = [
      ['lateTemplate1', lateTemplate1],
      ['lateTemplate2', lateTemplate2],
      ['lateTemplate3', lateTemplate3],
      ['onTimeTemplate', onTimeTemplate],
    ] as const;

    templates.forEach(([name, tpl]) => {
      it(`${name} should return a non-empty string when called with valid data`, () => {
        const result = tpl(testData);
        expect(typeof result).toBe('string');
        expect(result.length).toBeGreaterThan(0);
        expect(result).toContain(testData.name);
        expect(result).toContain(`Week ${testData.week}`);
        expect(result).toContain(testData.year.toString());
        expect(result).toContain(testData.link);
      });
    });
  });

  describe('getReminderSubject', () => {
    it('should generate a subject with week and year', () => {
      const data = { userName: 'Alice', weekNumber: 25, year: 2024 };
      const subject = getReminderSubject('on-time', data);
      expect(subject).toBe('Pulse Check Reminder - Week 25, 2024');
    });

    it('should handle null user name', () => {
      const data = { userName: null, weekNumber: 25, year: 2024 };
      const subject = getReminderSubject('on-time', data);
      expect(subject).toBe('Pulse Check Reminder - Week 25, 2024');
    });

    it('should generate different subjects for different reminder types', () => {
      const data = { userName: 'Bob', weekNumber: 26, year: 2024 };
      const types = ['on-time', 'late-1', 'late-2', 'late-3'] as const;
      
      const subjects = types.map(type => getReminderSubject(type, data));
      
      // Each subject should be unique
      expect(new Set(subjects).size).toBe(types.length);
      
      // Verify each subject format
      expect(subjects[0]).toBe('Pulse Check Reminder - Week 26, 2024');
      expect(subjects[1]).toBe('Pulse Check Overdue - Week 26, 2024');
      expect(subjects[2]).toBe('Second Reminder: Pulse Check Still Missing - Week 26, 2024');
      expect(subjects[3]).toBe('Final Notice: Missing Pulse Check - Week 26, 2024');
    });
  });
}); 