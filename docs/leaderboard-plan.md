# Leaderboard Feature Plan

## Overview

Implement a Duolingo-style leaderboard in the app, ranking users by:
- **Longest Streaks** (consecutive weekly pulse)
- **Top 10 Fastest Submissions** (users who submit the fastest after a weekly pulse open)

**Privacy:**  
Leaderboard will use real user stats, but will not display real emails or sensitive information. Usernames will be anonymized (e.g., display name, generated handle, or masked email).

---

## Goals

- Motivate users by showing their rank among peers.
- Encourage healthy competition.
- Protect user privacy by not exposing real emails or sensitive data.

---

## Data Requirements

- **User Identifier:** Anonymized (e.g., display name, generated username, or masked email).
- **Avatar:** Optional, can use a default or generated avatar.
- **Streak Count:** For longest streaks leaderboard.
- **Submission Time:** For fastest submission leaderboard.
- **Current User Highlight:** Clearly indicate the current user's position, even if not in the top 10.

---

## UI/UX

- Duolingo-style vertical leaderboard.
- Show top 10 users (configurable).
- Highlight top 3 with special icons/colors.
- Show current user's rank and stats, even if outside top 10.
- Optionally, allow toggling between "Longest Streaks" and "Fastest Submissions."

---

## Backend/API

- Endpoint to fetch leaderboard data:
  - `/api/leaderboard?type=streaks`
  - `/api/leaderboard?type=fastest`
- Endpoint returns:
  - List of anonymized users with stats.
  - Current user's rank and stats.

### Longest Streak Calculation Logic

- **Current Week Determination:**
  - The backend uses the same logic as the frontend (`getMostRecentThursdayWeek`) to determine the "current week" for streak calculations. This ensures consistency across the app.
- **Streak Calculation:**
  - For each user, fetch all their submissions for the current year.
  - Build a set of all weeks in the current year up to and including the current week.
  - Starting from the current week and moving backwards, count consecutive weeks where the user has a submission.
  - The count stops at the first week with no submission, giving the user's current streak.
- **Leaderboard Construction:**
  - All users are ranked by their streak (descending), then by name (ascending).
  - The top 10 users are included in the leaderboard response.
  - The current user is always included in the response (marked with `isCurrentUser: true`), even if not in the top 10, and is not duplicated if already present.

---

## Privacy Considerations

- Never expose real emails or sensitive identifiers.
- Use display names, generated usernames, or masked emails (e.g., `j***@gmail.com`).
- Optionally, allow users to opt out of appearing on the leaderboard.

---

## Implementation Steps

1. **Design Data Model:**  
   Update user model to support anonymized display names if needed.

2. **Backend Logic:**  
   - Calculate streaks and fastest submissions as described above.
   - Build API endpoints to serve leaderboard data.

3. **Frontend:**  
   - Create leaderboard UI component/page.
   - Fetch and display leaderboard data.
   - Highlight current user.

4. **Testing:**  
   - Ensure privacy is maintained.
   - Test with various user data scenarios.

---

## Future Enhancements

- Add weekly/monthly leaderboards.
- Add badges or rewards for top performers.
- Allow users to customize their display name/avatar.

--- 