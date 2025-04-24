import fs from 'fs/promises';
import path from 'path';
import { Submission } from '@/types/submission';

const STORAGE_DIR = path.join(process.cwd(), 'data');
const SUBMISSIONS_FILE = path.join(STORAGE_DIR, 'submissions.json');

// Ensure storage directory exists
async function ensureStorage() {
  try {
    await fs.access(STORAGE_DIR);
  } catch {
    await fs.mkdir(STORAGE_DIR, { recursive: true });
  }
}

// Initialize submissions file if it doesn't exist
async function initializeSubmissions() {
  try {
    await fs.access(SUBMISSIONS_FILE);
  } catch {
    await fs.writeFile(SUBMISSIONS_FILE, JSON.stringify({ submissions: [] }, null, 2));
  }
}

// Save a new submission
export async function saveSubmission(submission: Omit<Submission, 'id' | 'created_at'>): Promise<Submission> {
  await ensureStorage();
  await initializeSubmissions();

  const data = await fs.readFile(SUBMISSIONS_FILE, 'utf-8');
  const { submissions } = JSON.parse(data);

  // Add timestamp and ID
  const newSubmission: Submission = {
    ...submission,
    id: Date.now().toString(),
    created_at: new Date().toISOString(),
  };

  submissions.push(newSubmission);

  await fs.writeFile(SUBMISSIONS_FILE, JSON.stringify({ submissions }, null, 2));
  return newSubmission;
}

// Get all submissions
export async function getSubmissions(): Promise<Submission[]> {
  await ensureStorage();
  await initializeSubmissions();

  const data = await fs.readFile(SUBMISSIONS_FILE, 'utf-8');
  return JSON.parse(data).submissions;
}

// Get submissions by week
export async function getSubmissionsByWeek(weekNumber: number): Promise<Submission[]> {
  const submissions = await getSubmissions();
  return submissions.filter(s => s.week_number === weekNumber);
}

// Get user's submissions
export async function getUserSubmissions(email: string): Promise<Submission[]> {
  const submissions = await getSubmissions();
  return submissions.filter(s => s.email === email);
} 