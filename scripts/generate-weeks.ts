import postgres from 'postgres';
import { config } from 'dotenv';
import { resolve } from 'path';
import { getWeekNumber } from '../src/utils/date';

// Load environment variables
config({ path: resolve(process.cwd(), '.env') });

const generateWeeks = async (year: number) => {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is not defined');
  }

  const client = postgres(process.env.DATABASE_URL, { max: 1 });

  try {
    console.log(`⏳ Generating weeks for year ${year}...`);

    // Clear existing weeks for the year
    await client`
      DELETE FROM public.weeks WHERE year = ${year}
    `;

    // Generate weeks for the year
    for (let weekNumber = 1; weekNumber <= 52; weekNumber++) {
      // Calculate week start (Monday) and end (Sunday)
      const weekStart = new Date(year, 0, 1 + (weekNumber - 1) * 7);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 6);

      // Calculate submission windows
      const submissionStart = new Date(weekStart);
      submissionStart.setDate(submissionStart.getDate() + 4); // Friday
      submissionStart.setHours(17, 0, 0, 0); // 5PM UTC+7

      const submissionEnd = new Date(weekEnd);
      submissionEnd.setDate(submissionEnd.getDate() + 1); // Monday
      submissionEnd.setHours(14, 0, 0, 0); // 2PM UTC+7

      const lateSubmissionEnd = new Date(submissionEnd);
      lateSubmissionEnd.setDate(lateSubmissionEnd.getDate() + 1); // Tuesday
      lateSubmissionEnd.setHours(17, 0, 0, 0); // 5PM UTC+7

      await client`
        INSERT INTO public.weeks (
          year,
          week_number,
          start_date,
          end_date,
          submission_start,
          submission_end,
          late_submission_end
        ) VALUES (
          ${year},
          ${weekNumber},
          ${weekStart.toISOString()},
          ${weekEnd.toISOString()},
          ${submissionStart.toISOString()},
          ${submissionEnd.toISOString()},
          ${lateSubmissionEnd.toISOString()}
        )
      `;

      console.log(`✅ Generated week ${weekNumber} for ${year}`);
    }

    console.log(`✅ Successfully generated all weeks for ${year}`);
  } catch (error) {
    console.error('❌ Failed to generate weeks:', error);
    throw error;
  } finally {
    await client.end();
  }
};

// Run for current year and next year
const currentYear = new Date().getFullYear();
Promise.all([
  generateWeeks(currentYear),
  generateWeeks(currentYear + 1)
]).catch((err) => {
  console.error('Failed to generate weeks:', err);
  process.exit(1);
}); 