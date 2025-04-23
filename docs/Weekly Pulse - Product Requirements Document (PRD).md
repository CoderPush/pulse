# **📄 Product Requirements Document (PRD)**

## **🧠 Title:**

**Weekly Pulse Tracker — Building Visibility & Culture in a Remote Company**

---

## **✨ TL;DR**

Ship a lightweight internal tool by **Friday 4/25 at 5PM** to collect weekly updates from 70+ remote team members. Employees submit updates via a seamless web form (Supabase auth, no login friction). Admins track submissions and dig into insights. Reminders and lockouts are enforced to drive habit and compliance. The system starts with 6 weeks of backfilled data to give employees an immediate sense of history and ownership.

---

## **🗓 Launch Plan & Timelines**

### **🟢 Go-Live Date: Friday, April 25, 5PM**

* Pulse opens for **Week 17**

* Reminder system activates

* Submission deadline is **Monday, April 28, 2PM**

* Late window reminders: Mon 5PM, Tue 9AM & 12PM

* Final cutoff: **Tuesday, April 29, 5PM**

### **🟠 Data Import**

* Backfill historical data for **Weeks 9 to 15**

* Week 16 was a break (no submission)

* Users will see a **history view** with their past submissions

* Admins can browse all historical data by employee/team

---

## **📋 Weekly Submission Window Logic**

| Action | Day/Time (UTC-5) |
| ----- | ----- |
| Form Opens | Friday 5PM |
| On-Time Deadline | Monday 2PM |
| Reminder \#1 | Monday 5PM |
| Reminder \#2 | Tuesday 9AM |
| Reminder \#3 | Tuesday 12PM |
| Final Submission Cutoff | Tuesday 5PM (hard close) |

After Tuesday 5PM, form is locked and late entries are not accepted.

---

## **🧩 UX & Features (Revised)**

### **✅ Authentication**

* Supabase Auth (Google \+ Magic Link)

* Clicking from a link logs the user in

* Admin configures email whitelist

### **🗂 Submission History**

* **Users see their own past weeks** (Week 9–15 initially, Week 17 forward)

* Table with: project, hours, manager, challenges, submission time

* “Download My History” feature (CSV or PDF)

### **📊 Admin Dashboard Enhancements**

* View by employee, by week, by team

* Filter: submitted vs not, on-time vs late

* Access and export any past pulse

* Summary charts: submission rate trend, average hours, tag cloud of challenges

* Import interface for initial batch (Week 9–15)

---

## **🧠 Success Metrics (Updated for Phase 1\)**

* 🚀 Pulse \#1 launched by April 25, 5PM

* 🎯 80%+ submission rate by Monday, April 28, 2PM

* 📈 Late submission rate under 10% after Tue 5PM

* 🧠 Admins and CEO able to view data same-day

* 💬 50%+ of users click into and view their submission history

---

## **✅ Phase 1 Must-Haves for Friday**

* Login via Supabase (magic link & Google)

* Mobile-first form (project, hours, manager \+ optional questions)

* Submission dashboard for admin

* Reminder system (configured schedule)

* Past data import and user history view

* Admin filters and export

* Submission lock logic

---

## **⚙️ Tech Infrastructure Summary (Locked In)**

| Component | Tech |
| ----- | ----- |
| Frontend | Next.js \+ Tailwind |
| Backend/Auth | Supabase |
| CI/CD | GitHub Actions |
| Deployment | Vercel |
| Background | Vercel Cron Jobs |
| Email | SMTP (Mailtrap for staging) |
| Messaging | Mattermost (API Reminder) |

---

## **🛠 Enhancement Phase (Post Launch)**

* Rotating question engine

* AI summary \+ weekly sentiment

* Manager auto-suggestion via directory

* Employee dashboard with charts and milestone views

* Nudge incentives (e.g., 52-week badge, perfect submission streak)

---

# **🧑‍💻 Submission Flow (First Launch – MVP)**

### **🔑 Entry Point**

* User clicks **Mattermost message or email link**  
* Link includes magic login token (Supabase)  
* On click, user is automatically logged in → redirected to the form

---

## **🧭 Screen 1: Welcome**

**Purpose:** Greet user and show context  
 **Copy:**

👋 Hi, Anna\!  
 This is your Weekly Pulse for **Week 17**. It takes \< 2 minutes.  
 Ready? Let’s go ➡️

**Buttons:**

* `Start` → Begins the flow

---

## **🧩 Screen 2: What project did you spend most of your time on?**

**Type:** Dropdown (searchable)  
 **Placeholder:** “Search or select a project…”  
 **Extras:**

* Autocomplete from recent entries

* Optional small subtext: “This helps us track team allocations.”

**Buttons:**

* `Next`

---

## **⏱ Screen 3: How many hours did you work this week?**

**Type:** Number input  
 **Validation:** Must be between 10 and 80  
 **Extras:**

* Info icon: “Don’t worry, this doesn’t replace billable tracking — just a rough pulse.”

**Buttons:**

* `Back`, `Next`

---

## **📧 Screen 4: Who's your manager right now?**

**Type:** Autocomplete text input  
 **Placeholder:** “Type a name or email…”  
 **Extras:**

* Match against known team list (if configured)

* Note: “Helps us spot confusion in reporting lines.”

**Buttons:**

* `Back`, `Next`

---

## **🔄 Screen 5: Any blockers, changes, or feedback this week?**

**Type:** Text area (multi-line, optional)  
 **Label:** “Open thoughts (optional but appreciated)”  
 **Character count:** (Max 500\)

**Buttons:**

* `Back`, `Next`

---

## **✅ Screen 6: Review & Submit**

**Copy:**

All done\! Here’s what you’re about to send.

**Review panel:**

* Project: X

* Hours: Y

* Manager: Z

* Notes: \[if filled\]

**Buttons:**

* `Back`, `Submit Now`

---

## **🎉 Screen 7: Success\!**

**Message:**

✅ Submission received\!  
 You’re helping us all stay in sync 🙌

**Link:**

* `View my history`

---

# **🎨 Mock UI Wireframes**

Here’s a basic wireframe view for key screens. (Note: Visual fidelity is basic, but it'll give your dev/design team clear direction):

---

### **Screen 1: Welcome**

\+-------------------------------------------+  
| 👋 Hi, Anna\!                              |  
| This is your Weekly Pulse for Week 17\.    |  
| It takes \< 2 minutes.                     |  
|                                           |  
|  \[ Start \]                                |  
\+-------------------------------------------+

---

### **Screen 2: Project Selection**

\+-------------------------------------------+  
| What project did you spend most time on?  |  
| \[ Search or select project...         ▼ \] |  
|                                           |  
|  \[ Next \]                                 |  
\+-------------------------------------------+

---

### **Screen 3: Hours Worked**

\+-------------------------------------------+  
| How many hours did you work this week?    |  
| \[      40 hours       \]                   |  
|                                           |  
|  \[ Back \]   \[ Next \]                      |  
\+-------------------------------------------+

---

### **Screen 4: Manager**

\+-------------------------------------------+  
| Who's your manager right now?             |  
| \[ Search name/email...                \]   |  
|                                           |  
|  \[ Back \]   \[ Next \]                      |  
\+-------------------------------------------+

---

### **Screen 5: Open Feedback**

\+-------------------------------------------+  
| Any blockers or feedback this week?       |  
| \[ Write something...                 \]     |  
|                                           |  
|  \[ Back \]   \[ Next \]                      |  
\+-------------------------------------------+

---

### **Screen 6: Review & Submit**

\+-------------------------------------------+  
| ✅ Review your answers:                   |  
| Project: Apollo                           |  
| Hours: 40                                 |  
| Manager: jane@company.com                 |  
| Notes: Had a few delays with onboarding.  |  
|                                           |  
|  \[ Back \]   \[ Submit Now \]                |  
\+-------------------------------------------+

---

### **Screen 7: Success**

\+-------------------------------------------+  
| 🎉 Submission received\!                   |  
| You're helping us all stay in sync 🙌     |  
|                                           |  
|  \[ View My History \]                      |  
\+-------------------------------------------+

---

Want these mocks as real Figma components or just images you can share with your dev/design team? I can mock it up quickly or help write the implementation specs next. Let’s keep moving\!

