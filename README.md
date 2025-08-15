# Pulse 

[![Next.js](https://img.shields.io/badge/Next.js-15.3.1-black)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.1.0-blue)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8.3-blue)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-Local-orange)](https://supabase.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.1.4-38B2AC)](https://tailwindcss.com/)

Pulse is a modern, AI-powered web application that revolutionizes team progress tracking and feedback collection through weekly check-ins and daily task management. Built with Next.js 15, React 19, and powered by AWS Bedrock, Pulse provides a seamless experience to maintain consistent communication, track project hours, and gather valuable insights.

## 🚀 Key Features
### 📅 Daily Tasks Management
- **AI-Powered Task Parsing**: Natural language input that automatically extracts task details
- **Task Extraction**: Parses project names, hours, categories, and descriptions from free text
- **Flexible Input Formats**: Support for manual entry, bulk import, and AI parsing
- **Project & Bucket Categorization**: Organize tasks by project and work type

### 📊 Weekly Pulse System
- **Multi-Step Submission Forms**: Streamlined weekly check-in process
- **Project Hours Tracking**: Comprehensive time allocation across multiple projects

### 🎯 Advanced Analytics & Reporting
- **Dashboard Visualizations**: Charts showing effort distribution across projects and categories
- **Time-based Filtering**: Weekly and monthly views with detailed breakdowns
- **Export Capabilities**: PDF and CSV export for reporting and analysis

## 🏗️ Architecture & Technology Stack

### Frontend
- **Next.js 15**: App Router with Turbopack for fast development
- **React 19**: Latest React features with concurrent rendering
- **TypeScript**: Full type safety and developer experience
- **Tailwind CSS 4**: Modern utility-first CSS framework
- **shadcn/ui**: Accessible component primitives

### AI & Backend
- **AWS Bedrock**: Claude and other advanced language models
- **CopilotKit**: AI assistant framework for seamless integration
- **Supabase**: Local PostgreSQL database with real-time capabilities

### Testing & Quality
- **Vitest**: Fast unit testing framework
- **Playwright**: End-to-end testing with multiple browser support

## 📁 Project Structure

```
pulse/
├── src/
│   ├── app/                          # Next.js 15 App Router
│   │   ├── (authenticated)/          # Protected routes
│   │   │   ├── daily-tasks/          # Daily task management
│   │   │   ├── submissions/          # Weekly submissions
│   │   │   └── ...                   # Other authenticated features
│   │   ├── api/                      # API routes
│   │   │   ├── copilotkit/           # AI chatbot endpoint
│   │   │   ├── parse-daily-tasks/    # Task parsing API
│   │   │   └── ai-weekly-insight/    # AI insights generation
│   │   └── admin/                    # Administrative interfaces
│   ├── components/                    # Reusable React components
│   │   ├── CopilotProvider.tsx       # AI assistant provider
│   │   ├── DailyPulseAIAssistant.tsx # Daily task AI interface
│   │   └── WeeklyPulseForm.tsx       # Weekly form with AI integration
│   ├── lib/                          # Utility libraries
│   └── types/                        # TypeScript type definitions
├── supabase/                         # Database migrations & config
├── e2e/                             # End-to-end tests
└── docs/                            # Project documentation
```

## 🚀 Getting Started

### Prerequisites
- **Node.js**: 18.x or later
- **PostgreSQL**: 15.x (via Supabase)
- **pnpm**: Package manager
- **Supabase CLI**: For local development

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd pulse
```

2. Install dependencies:
```bash
pnpm install
```

3. **Environment Setup**
   ```bash
   # Copy environment templates
   cp .env.example .env
   cp supabase/.env.example supabase/.env
   
   ```

4. **Start Local Supabase**
   ```bash
   supabase start
   ```

5. **Initialize Database**
   ```bash
   # ⚠️ WARNING: This resets your local database
   supabase db reset
   ```

6. **Start Development Server**
   ```bash
   pnpm dev
   ```

7. **Access the application**

Frontend: http://localhost:3000
Admin Dashboard: http://localhost:3000/admin

## 🤖 AI Features Deep Dive

### CopilotKit Integration
Pulse uses CopilotKit to provide an intelligent AI assistant that helps users complete forms and manage tasks:

- **Context Awareness**: The AI remembers user preferences and previous submissions
- **Natural Language Processing**: Users can describe tasks in plain English
- **Smart Form Filling**: AI automatically populates form fields based on conversation
- **Multi-step Guidance**: Breaks down complex forms into manageable conversations

### Daily Task AI Assistant
The AI-powered daily task system allows users to:

```typescript
// Example: Natural language task input
"Fixed login bug @project-alpha #bugfix 1.5h
Code review for new feature @project-beta #feature 2 hours"
```

**AI automatically extracts:**
- **Date**: Task completion date
- **Project**: Associated project name
- **Category**: Work type (bugfix, feature, etc.)
- **Hours**: Time spent
- **Description**: Task details

### Weekly Pulse AI Assistant
The weekly form AI assistant provides:

- **Previous Submission Recall**: Shows last week's data for reference
- **Smart Pre-filling**: Automatically populates form fields
- **Conversational Guidance**: Walks users through form completion
- **Context Preservation**: Maintains conversation state throughout the session

## 📅 Daily Tasks System

### Core Features
- **AI-Powered Parsing**: Natural language input processing
- **Calendar View**: Visual submission tracking with color-coded status
- **Dashboard Analytics**: Hours distribution, project breakdowns, and trends
- **Flexible Input Methods**: Multiple ways to add and edit tasks

### Task Management Workflow
1. **Input**: Users enter tasks via AI assistant or manual forms
2. **Parsing**: AI extracts structured data from natural language
3. **Review**: Tasks are grouped by date with editing capabilities
4. **Submission**: Tasks are saved to the database
5. **Analytics**: Dashboard provides insights and reporting


## Testing

This project uses Vitest for unit testing and Playwright for end-to-end (E2E) testing.

### Unit Tests (Vitest)

- **Run all unit tests:**
  ```bash
  pnpm test:run
  ```
- **Run unit tests in watch mode:**
  ```bash
  pnpm test
  ```
- **Run unit tests with UI:**
  ```bash
  pnpm test:ui
  ```
- **Generate coverage report:**
  ```bash
  pnpm test:coverage
  ```

### End-to-End Tests (Playwright)

- **Run all E2E tests:**
  ```bash
  pnpm test:e2e
  ```
- **Run E2E tests with UI mode:**
  ```bash
  pnpm test:e2e:ui
  ```
- **Run E2E tests in debug mode:**
  ```bash
  pnpm test:e2e:debug
  ```
- **Run E2E tests specifically for Chromium:**
  ```bash
  pnpm test:e2e:chromium
  ```
- **Generate code for E2E tests:**
  ```bash
  pnpm test:e2e:codegen
  ```