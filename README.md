# Engagement Plan Monitor

A comprehensive project engagement planning and monitoring tool built with Hono and Cloudflare Pages.

## Project Overview

**Engagement Plan Monitor** is a web application that helps teams plan, track, and monitor project engagements through structured steps and milestones. It provides real-time progress tracking, success probability calculations, and visual insights into engagement health.

### Key Features

- **Plan Management**: Create, edit, and manage multiple engagement plans
- **Step-by-Step Tracking**: Break down engagements into initial, intermediate, and end steps
- **Progress Monitoring**: Track completion progress across all steps
- **Success Probability**: Calculate and visualize success likelihood based on completed steps
- **Status Management**: Mark steps as Planned or Concluded
- **Review System**: Document outcomes and learnings for concluded steps
- **Data Persistence**: All data stored in Cloudflare D1 SQLite database
- **Responsive Design**: Beautiful Tailwind CSS interface with Noto Sans font
- **Real-time Validation**: Automatic checks for date consistency and progress flow

## URLs

- **Production**: https://webapp-5fs.pages.dev
- **Latest Deployment**: https://8f94ff10.webapp-5fs.pages.dev
- **GitHub Repository**: https://github.com/amper8and/engagement_planner

## Technology Stack

- **Backend**: Hono framework (lightweight, fast edge runtime)
- **Frontend**: Vanilla JavaScript with Tailwind CSS
- **Database**: Cloudflare D1 (distributed SQLite)
- **Deployment**: Cloudflare Pages (edge network)
- **Font**: Google Fonts - Noto Sans

## Data Architecture

### Database Schema

**Plans Table**:
- `id` (TEXT, PRIMARY KEY): Unique plan identifier
- `title` (TEXT): Plan title
- `start_date` (TEXT): Plan start date (ISO format)
- `end_date` (TEXT): Plan end date (ISO format)
- `created_at` (DATETIME): Creation timestamp
- `updated_at` (DATETIME): Last update timestamp

**Steps Table**:
- `id` (TEXT, PRIMARY KEY): Unique step identifier
- `plan_id` (TEXT, FOREIGN KEY): Reference to parent plan
- `type` (TEXT): Step type - 'initial', 'intermediate', or 'end'
- `action_title` (TEXT): Short title of the action
- `action_description` (TEXT): Detailed description
- `date` (TEXT): Scheduled date for the step
- `progress` (INTEGER): Progress percentage (0-100)
- `success_probability` (INTEGER): Success likelihood (0-100)
- `status` (TEXT): 'Planned' or 'Concluded'
- `review` (TEXT): Post-completion review notes
- `step_order` (INTEGER): Order within the plan
- `created_at` (DATETIME): Creation timestamp
- `updated_at` (DATETIME): Last update timestamp

### API Endpoints

- `GET /api/plans` - Fetch all plans with their steps
- `GET /api/plans/:id` - Fetch a single plan with steps
- `POST /api/plans` - Create a new plan
- `PUT /api/plans/:id` - Update an existing plan
- `DELETE /api/plans/:id` - Delete a plan (cascades to steps)

## User Guide

### Creating a New Plan

1. Click "New" button in the sidebar
2. Enter plan title, start date, and end date
3. The system creates a plan with Initial and End steps automatically

### Managing Steps

**Adding Steps**:
- Click the "+" button between existing steps to insert a new step
- Click "Add step" button to add a step before the End step

**Editing Steps**:
- Click on any field to edit (title, description, date, status)
- Adjust progress and success probability using sliders or number inputs
- Initial step progress is fixed at 0%, End step at 100%

**Reordering Steps**:
- Use ← → arrows on intermediate steps to move them
- Steps flow left to right chronologically

**Removing Steps**:
- Click "Remove" button on any intermediate step
- Initial and End steps cannot be removed

### Understanding Metrics

**Plan Progress**: Shows the highest progress percentage among concluded steps

**Success Probability**: Calculated heuristically based on:
- Number of remaining planned steps (decreases probability)
- End step success probability (upper limit)
- Displayed as minimum of these factors

**Validation Checks**: The system automatically flags:
- Start date after end date
- Steps scheduled outside plan dates
- Non-monotonic progress (decreasing left to right)
- Incorrect progress on Initial (should be 0%) or End steps (should be 100%)

### Concluding an Engagement

1. Complete all intermediate steps and mark as "Concluded"
2. Add review notes for each concluded step
3. Click "Conclude engagement" button
4. This marks the End step as Concluded

## Development

### Local Development

```bash
# Install dependencies
npm install

# Apply database migrations locally
npm run db:migrate:local

# Build the project
npm run build

# Start development server
npm run dev:sandbox

# Or use PM2
pm2 start ecosystem.config.cjs
```

### Database Management

```bash
# Apply migrations to local database
npm run db:migrate:local

# Apply migrations to production
npm run db:migrate:prod

# Execute SQL on local database
npm run db:console:local

# Execute SQL on production
npm run db:console:prod
```

### Deployment

```bash
# Build and deploy to production
npm run deploy:prod

# Or manually
npm run build
wrangler pages deploy dist --project-name webapp
```

## Project Structure

```
webapp/
├── src/
│   └── index.tsx              # Hono backend with API routes
├── public/
│   └── static/
│       ├── app.js             # Frontend JavaScript
│       └── style.css          # Custom CSS
├── migrations/
│   └── 0001_initial_schema.sql # Database schema
├── dist/                      # Build output (generated)
├── ecosystem.config.cjs       # PM2 configuration
├── wrangler.jsonc            # Cloudflare configuration
├── package.json              # Dependencies and scripts
└── README.md                 # This file
```

## Deployment Status

✅ **Active** - Currently deployed and running on Cloudflare Pages

**Last Deployed**: February 24, 2026

**Database**: Cloudflare D1 `webapp-production` (ID: 3a16985e-be79-4aee-ab2c-63d705e89766)

**Region**: WNAM (Western North America)

## Features Completed

- ✅ Plan creation, editing, and deletion
- ✅ Step management (add, remove, reorder)
- ✅ Progress and success probability tracking
- ✅ Status management (Planned/Concluded)
- ✅ Review system for concluded steps
- ✅ Real-time validation and checks
- ✅ Responsive sidebar with plan search and collapse/expand toggle
- ✅ **Fixed sidebar positioning** - doesn't scroll with main content
- ✅ **Collapsible sidebar** - toggle button to expand/collapse for more workspace
- ✅ **Progression percentage in sidebar plan cards** - at-a-glance completion status
- ✅ D1 database integration
- ✅ Full CRUD API
- ✅ Persistent data storage
- ✅ Beautiful UI with Tailwind CSS
- ✅ **Fixed**: Multiple plan creation bug (event listener duplication)
- ✅ **Fixed**: Cursor jumping when typing (focus/selection preservation)
- ✅ **Fixed**: Step cards alignment (top-aligned)  
- ✅ **Fixed**: Active card always centered and visible during typing

## Recent Updates

### February 24, 2026 - Delete Confirmation Dialog
- **Fixed**: Delete plan button now requires confirmation before deletion
- **Issue**: Previously, clicking the trash icon would immediately delete the plan without warning
- **Solution**: Added confirmation dialog that displays the plan title and warns about permanent data loss
- **UX Improvement**: Prevents accidental deletion of engagement plans and their associated steps
- **Safety**: Critical improvement to protect user data from unintentional removal
- **Commit**: `23437d9`

### February 24, 2026 - Sidebar Toggle Button Alignment Fix
- **Fixed**: Sidebar toggle button alignment to prevent overlap with header text
- **Changes**:
  - Button position: Moved from `top-2` to `top-6` for better vertical alignment
  - Content padding: Added `pl-16` to main content area to create proper spacing
  - Header alignment: Changed from `items-start` to `items-center` for consistent vertical centering
- **Result**: Clean, professional header layout with no overlap between toggle button and "Engagement" heading
- **Commit**: `0c4654d`

### February 23, 2026 - Collapsible Fixed Sidebar
- **Added**: Sidebar is now fixed and doesn't scroll with main content
- **Added**: Toggle button to collapse/expand sidebar for more workspace
- **Features**:
  - Fixed positioning: Sidebar stays in place while scrolling
  - Smooth transitions: 300ms animation when collapsing/expanding
  - Dynamic button: Chevron icon changes direction (>> when collapsed, << when expanded)
  - Responsive layout: Main content adjusts width automatically
  - State management: sidebarCollapsed state in AppState
- **Benefits**:
  - More screen space when sidebar collapsed
  - Sidebar always accessible with one click
  - Professional sliding animation
  - Better focus on engagement cards when needed

### February 23, 2026 - Improved Sidebar Plan Cards
- **Enhanced**: Bigger, bolder progression percentage for better visibility
- **Improved**: Replaced "Delete" text button with compact trash icon
- **Refined**: Centered title and dates for professional appearance
- **Changes**:
  - Percentage size: Doubled from small (text-xs) to large (text-2xl font-bold)
  - Delete button: Now uses trash bin SVG icon instead of text (saves ~40px space)
  - Layout: Title and dates centered, percentage and delete button grouped on right
  - Visual hierarchy: Percentage is now the dominant visual element
- **Result**: Clean, professional sidebar cards with at-a-glance completion status

### February 23, 2026 - Progression Percentage in Sidebar
- **Added**: Progression percentage display in sidebar plan mini-cards
- **Feature**: Each plan card now shows completion percentage next to the title
- **Calculation**: Uses maximum progress of all concluded steps (same as main view)
- **Benefit**: At-a-glance view of engagement completion status without opening each plan
- **Example**: "Example Engagement Plan 45%"

### February 23, 2026 - Active Card Always Visible (v6 - FINAL CORRECT FIX)
- **Fixed**: Active card now stays consistently centered and visible during all typing
- **Issue**: When typing in cards like "Follow up", the card would be positioned off-screen so users couldn't see what they were typing
- **Root Cause**: Previous approach tried to PRESERVE scroll position, which meant cards that started off-screen stayed off-screen during typing
- **The Misunderstanding**: "No recentering" was interpreted as "preserve scroll position" but actually means "keep active card centered and visible"
- **Correct Solution**: After cursor restoration, **ALWAYS center the active card**
  - Removed: savedScrollLeft save/restore logic
  - Removed: Double enforcement attempts
  - Added: `stepCard.scrollIntoView()` after cursor restoration
  - Uses `behavior: 'auto'` for instant positioning (no animation)
  - Uses `inline: 'center'` to keep card in viewport center
- **Result - CONSISTENT BEHAVIOR**:
  - ✅ Click any card → centers immediately
  - ✅ Type in any field → card stays centered and visible
  - ✅ Active card is ALWAYS on screen during typing
  - ✅ User can always see what they're typing
  - ✅ Consistent positioning - same center point every time
  - ✅ No cards positioned off-screen during interaction

### February 23, 2026 - CRITICAL Scroll Position Lock (v3)
- **Fixed**: FORCIBLY lock scroll position during cursor restoration to prevent ANY movement
- **Solution**: Aggressive scroll position preservation - save scrollLeft before, force restore after
- **Note**: This version only worked for title field, extended in v4 above

**Testing Instructions:**
1. Open the app and select a plan with multiple steps (e.g., "Example Engagement Plan")
2. **Test consistent centering**:
   - Click on the first step card (e.g., "Kickoff call") → should center
   - Type something → card stays centered and visible
   - Click on a different card (e.g., "Follow up meeting") → should center
   - Type "123" → card stays centered and visible, you can see "123"
3. **Test all three text fields** (all should keep card centered):
   - Type in Action Title → card stays centered
   - Type in Action Description → card stays centered
   - Change status to "Concluded", type in Review → card stays centered
4. **Key validation**: At NO point should an active card be off-screen where you can't see what you're typing

### February 23, 2026 - Previous Scroll Fix Attempts (v1-v2)
- v2: Attempted to track last scrolled card ID to prevent re-scrolling same card
- v1: Attempted to use click-based scroll with mousedown listener
- Both approaches failed because they didn't address the underlying cursor restoration scroll issue
- **Implementation**:
  - Added `data-step-card` attribute to step card containers
  - Created dedicated `scrollStepCardIntoView()` function
  - Added mousedown event listener that detects clicks and scrolls parent card
  - Removed all focus event scroll logic
  - Removed `isRestoringFocus` flag (no longer needed)
  - Cursor restoration uses `preventScroll: true`
- **Result**:
  - ✅ Click anywhere on step card → card centers in viewport
  - ✅ Click input field → parent card centers in viewport
  - ✅ Type in any field → ZERO scroll, viewport completely stable
  - ✅ Simple, maintainable code
  - ✅ Works for all input types

### February 23, 2026 - Previous Scroll Fix Attempts (Superseded)
- Attempted to use `isRestoringFocus` flag and `preventScroll: true`
- These approaches were overly complex and fought with browser behavior
- Replaced with clean click-based solution above

### February 23, 2026 - UI/UX Polish Release
- **Fixed**: Step cards now top-aligned for professional appearance (was center-aligned)
- **Fixed**: Inputs off-screen auto-scroll into view on initial focus
- **Implementation**: Changed flex alignment from `items-center` to `items-start`
- **Implementation**: Added focus event listener with scrollIntoView
- **Result**: Cleaner card layout, smart initial scroll

### February 23, 2026 - UX Improvement Release
- **Fixed**: Cursor jumping/loss of focus when typing in plan title and input fields
- **Root Cause**: Full DOM re-render on every keystroke destroyed and recreated all input elements
- **Solution**: Preserve active element focus and cursor position before render, restore after DOM updates
- **Result**: Smooth, uninterrupted typing experience in all input fields

### February 23, 2026 - Bug Fix Release
- **Fixed**: Multiple plans being created when clicking "New" button once
- **Root Cause**: Event listeners were being attached on every render, causing duplicates
- **Solution**: Implemented guard flag and moved event listener attachment to startup only
- **Added**: Comprehensive regression prevention strategy document (see `REGRESSION_PREVENTION.md`)

## Quality Assurance

This project includes a comprehensive regression prevention strategy. Before making any changes:
1. **Read** `REGRESSION_PREVENTION.md` for the complete checklist
2. **Test** all critical paths before deployment
3. **Verify** the fix locally before pushing to production

Key principles:
- Event listeners must only be attached once at startup
- Use event delegation pattern for dynamic content
- Test ALL modules after ANY change
- Complete the pre-deployment checklist

## Future Enhancements

- 📋 Export plans to PDF/Excel
- 👥 Multi-user support with authentication
- 📊 Advanced analytics and reporting
- 📅 Calendar view integration
- 🔔 Notifications and reminders
- 📝 Template library for common engagement types
- 🎯 Risk assessment tools
- 📈 Historical trend analysis

## License

MIT License - See GitHub repository for details

## Support

For issues or questions, please open an issue on the [GitHub repository](https://github.com/amper8and/engagement_planner).
