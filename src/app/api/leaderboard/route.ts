import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { getMostRecentThursdayWeek } from '@/lib/utils/date';

interface User {
  id: string;
  name: string | null;
  email: string;
}

interface Submission {
  user_id: string;
  year: number;
  week_number: number;
  submitted_at: string;
  form_completion_time?: number;
}

interface Week {
  year: number;
  week_number: number;
}

interface StreakLeaderboardEntry {
  id: string;
  name: string;
  streak: number;
  isCurrentUser?: boolean;
}

interface FastestLeaderboardEntry {
  id: string;
  name: string;
  isCurrentUser?: boolean;
}

// Helper to capitalize every word
function toTitleCase(str: string): string {
  return str.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.slice(1).toLowerCase());
}

function getDisplayName(user: User): string {
  if (user.name && user.name.trim() !== '') return toTitleCase(user.name);
  // If no name, use the part before @ in email
  const [beforeAt] = user.email.split('@');
  return toTitleCase(beforeAt);
}

function calculateMaxStreak(submissions: Submission[], allWeeks: Week[], currentWeek: number): number {
  const submittedWeeks = new Set(submissions.map(s => s.week_number));
  const sortedWeeks = allWeeks
    .filter(w => w.week_number <= currentWeek)
    .sort((a, b) => a.week_number - b.week_number); // ascending

  let maxStreak = 0;
  let currentStreak = 0;
  for (let i = 0; i < sortedWeeks.length; i++) {
    const weekNum = sortedWeeks[i].week_number;
    if (submittedWeeks.has(weekNum)) {
      currentStreak++;
      maxStreak = Math.max(maxStreak, currentStreak);
    } else {
      currentStreak = 0;
    }
  }
  return maxStreak;
}

export async function GET(request: Request) {
  const supabase = await createClient();
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type') || 'streaks';

  // Get current user from session
  const { data: { user: currentUser } } = await supabase.auth.getUser();
  const currentUserId = currentUser?.id;

  // Get all users (including admins)
  const { data: users, error: usersError } = await supabase
    .from('users')
    .select('id, name, email');
  if (usersError) {
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
  }

  // Get current year and all weeks for the year
  const now = new Date();
  const currentYear = now.getFullYear();
  const { data: allWeeks, error: weeksError } = await supabase
    .from('weeks')
    .select('year, week_number')
    .eq('year', currentYear)
    .order('week_number', { ascending: true });
  if (weeksError) {
    return NextResponse.json({ error: 'Failed to fetch weeks' }, { status: 500 });
  }

  // Use getMostRecentThursdayWeek for current week
  const currentWeek = getMostRecentThursdayWeek();

  // Filter out week 16 of the current year from allWeeks for streak calculation
  const filteredWeeks = allWeeks.filter(
    w => !(w.year === currentYear && w.week_number === 16)
  );

  if (type === 'fastest') {
    // Get all submissions for the current week
    const { data: submissions, error: submissionsError } = await supabase
      .from('submissions')
      .select('user_id, year, week_number, submitted_at')
      .eq('year', currentYear)
      .eq('week_number', currentWeek)
      .not('submitted_at', 'is', null);
    if (submissionsError) {
      return NextResponse.json({ error: 'Failed to fetch submissions' }, { status: 500 });
    }

    // Map user_id to user
    const userMap = Object.fromEntries(users.map((u: User) => [u.id, u]));

    // Sort by submitted_at (earliest first)
    const leaderboard: FastestLeaderboardEntry[] = submissions
      .filter(s => userMap[s.user_id])
      .sort((a, b) => new Date(a.submitted_at).getTime() - new Date(b.submitted_at).getTime())
      .map(s => ({
        id: s.user_id,
        name: getDisplayName(userMap[s.user_id]),
        isCurrentUser: s.user_id === currentUserId,
      }));

    // Only top 10, but always include current user if they submitted
    const top = leaderboard.slice(0, 10);
    const currentUserEntry = leaderboard.find(e => e.id === currentUserId);
    if (currentUserEntry && !top.some(e => e.id === currentUserId)) {
      top.push(currentUserEntry);
    }

    return NextResponse.json({ leaderboard: top });
  }

  // Get all submissions for the current year
  const { data: submissions, error: submissionsError } = await supabase
    .from('submissions')
    .select('user_id, year, week_number, submitted_at')
    .eq('year', currentYear);
  if (submissionsError) {
    return NextResponse.json({ error: 'Failed to fetch submissions' }, { status: 500 });
  }

  // Calculate streaks for each user
  const leaderboard: StreakLeaderboardEntry[] = users.map((user: User) => {
    const userSubs = submissions.filter(s => s.user_id === user.id);
    const streak = calculateMaxStreak(userSubs, filteredWeeks, currentWeek);
    return {
      id: user.id,
      name: getDisplayName(user),
      streak,
      isCurrentUser: user.id === currentUserId,
    };
  });

  // Sort by streak descending, then by earliest submission in the latest week, then by name
  leaderboard.sort((a, b) => {
    if (b.streak !== a.streak) return b.streak - a.streak;

    // Find submissions for the latest week for both users
    const aLatest = submissions.find(
      s => s.user_id === a.id && s.week_number === currentWeek
    );
    const bLatest = submissions.find(
      s => s.user_id === b.id && s.week_number === currentWeek
    );

    if (aLatest && bLatest) {
      // Earlier submission ranks higher
      return new Date(aLatest.submitted_at).getTime() - new Date(bLatest.submitted_at).getTime();
    }
    if (aLatest) return -1; // a submitted, b did not
    if (bLatest) return 1;  // b submitted, a did not

    // Fallback: sort by previous week's submission time (with week 1 → 52 rollover)
    let previousWeek = currentWeek - 1;
    // let previousYear = currentYear;
    if (previousWeek === 0) {
      previousWeek = 52;
      // previousYear = currentYear - 1;
    }
    const aPrev = submissions.find(
      s => s.user_id === a.id && s.week_number === previousWeek /* && s.year === previousYear */
    );
    const bPrev = submissions.find(
      s => s.user_id === b.id && s.week_number === previousWeek /* && s.year === previousYear */
    );

    if (aPrev && bPrev) {
      // Earlier submission ranks higher
      return new Date(aPrev.submitted_at).getTime() - new Date(bPrev.submitted_at).getTime();
    }
    if (aPrev) return -1; // a submitted last week, b did not
    if (bPrev) return 1;  // b submitted last week, a did not

    // Still fallback: alphabetical
    return a.name.localeCompare(b.name);
  });

  // Only top 10, but always include current user if not in top
  const top = leaderboard.slice(0, 10);
  const currentUserEntry = leaderboard.find(e => e.id === currentUserId);
  if (currentUserEntry && !top.some(e => e.id === currentUserId)) {
    top.push(currentUserEntry);
  }

  return NextResponse.json({ leaderboard: top });
} 