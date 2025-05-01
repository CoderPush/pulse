# **📄 Product Requirements Document (PRD)**

## **🧠 Title:**

**Weekly Pulse Tracker — Building Visibility & Culture in a Remote Company**

---

## **✨ TL;DR**

A lightweight internal tool to collect weekly updates from remote team members. Employees submit updates via a seamless web form (Supabase auth, no login friction). Admins track submissions and dig into insights. Reminders and lockouts are enforced to drive habit and compliance.

---

## **📋 Weekly Submission Window**

| Action | Day/Time (UTC) |
| ----- | ----- |
| Form Opens | Friday 5PM |
| On-Time Deadline | Monday 2PM |
| First Reminder | Monday 5PM |
| Second Reminder | Tuesday 9AM |
| Final Cutoff | Tuesday 5PM |

After Tuesday 5PM, form is locked and late entries are not accepted.

---

## **🧩 Current Features**

### **✅ Authentication**
* Supabase Auth (Google + Magic Link)
* Seamless login experience
* Admin-configured email whitelist

### **📝 Weekly Submission**
* Multi-step form interface
* Project and hours tracking
* Manager feedback collection
* Mobile-responsive design

### **🗂 Submission History** (In Development)
* View past submissions
* Table with: project, hours, manager, challenges
* "Download My History" feature (CSV/PDF)

### **📊 Admin Dashboard** (In Development)
* View by employee, week, team
* Filter: submitted vs not, on-time vs late
* Access and export submissions
* Summary charts and analytics

---

## **🧠 Success Metrics**

* 🎯 80%+ submission rate by deadline
* 📈 Late submission rate under 10%
* 🧠 Same-day data access for admins
* 💬 50%+ user history view engagement

---

## **✅ Implementation Status**

### **Completed**
* Login via Supabase
* Mobile-first form
* Basic form validation
* Project and hours tracking
* Manager feedback collection

### **In Progress**
* Submission dashboard
* Reminder system
* Historical data view
* Admin filters and export
* Submission lock logic

---

## **⚙️ Tech Infrastructure**

| Component | Tech |
| ----- | ----- |
| Frontend | Next.js + Tailwind |
| Backend/Auth | Supabase |
| CI/CD | GitHub Actions |
| Deployment | Vercel |
| Background | Vercel Cron Jobs |
| Email | Resend (Production) |
| Email | Mailtrap (Staging) |

---

## **🛠 Future Enhancements**

* Rotating question engine
* AI summary + weekly sentiment
* Manager auto-suggestion
* Employee dashboard with charts
* Achievement system

---

# **🧑‍💻 Submission Flow**

## **Screen 1: Welcome**
👋 Hi, {name}!  
This is your Weekly Pulse. It takes < 2 minutes.  
Ready? Let's go ➡️

## **Screen 2: Project Selection**
* Search or select primary project
* Autocomplete from recent entries
* Option to add new project

## **Screen 3: Hours Worked**
* Number input (10-80 hours)
* Clear validation feedback
* Helper text for accuracy

## **Screen 4: Manager**
* Manager name/email input
* Team member lookup
* Reporting line clarity

## **Screen 5: Feedback**
* Optional but encouraged
* Multi-line text input
* Character limit: 500

## **Screen 6: Review**
* Summary of all inputs
* Option to edit any field
* Clear submission button

## **Screen 7: Success**
* Confirmation message
* Link to view history
* Preview next week's deadline

# **🎨 Mock UI Wireframes**

Here's a basic wireframe view for key screens. (Note: Visual fidelity is basic, but it'll give your dev/design team clear direction):

---

### **Screen 1: Welcome**
\+-------------------------------------------+  
| 👋 Hi, {name}!                              |  
| This is your Weekly Pulse.                   |  
| It takes < 2 minutes.                        |  
|                                           |  
|  \[ Start \]                                 |  
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

Want these mocks as real Figma components or just images you can share with your dev/design team? I can mock it up quickly or help write the implementation specs next. Let's keep moving\!

