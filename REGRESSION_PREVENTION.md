# Regression Prevention Strategy
## Engagement Plan Monitor - Quality Assurance Plan

**Created:** February 23, 2026  
**Status:** 🟢 Active  
**Project:** Engagement Plan Monitor  
**Repository:** https://github.com/amper8and/engagement_planner

---

## 🎯 PURPOSE

This document provides a comprehensive strategy to prevent regressions when making changes to the Engagement Plan Monitor application. It ensures that fixes in one area don't break functionality in other areas.

**Key Principle:** *Every change must be tested against ALL critical paths before deployment.*

---

## 📋 PRE-DEPLOYMENT CHECKLIST

### ⚠️ MANDATORY - Complete ALL items before deployment

#### 1. Code Review
- [ ] Changes are focused and minimal
- [ ] No unrelated code modifications
- [ ] Comments explain WHY (not just what) for complex logic
- [ ] No console.log() statements left in production code
- [ ] No TODO comments for critical functionality
- [ ] Event listeners don't create duplicates
- [ ] State updates trigger proper re-renders

#### 2. Database Integrity
- [ ] Run migrations locally: `npm run db:migrate:local`
- [ ] Verify migrations work: Check tables exist
- [ ] Test data loads correctly
- [ ] No breaking schema changes without migration
- [ ] Verify foreign key cascades work correctly

#### 3. Critical Path Tests (Manual)

##### 3.1 Plan Management
- [ ] **Create Plan**: Click "New" button creates ONE plan only
- [ ] **Select Plan**: Clicking a plan in sidebar switches to it
- [ ] **Delete Plan**: Delete button removes plan and updates UI
- [ ] **Edit Plan**: Title, start date, end date all save correctly
- [ ] **Plan Persistence**: Refresh page, all plans still exist

##### 3.2 Step Management
- [ ] **Add Step**: "+" button inserts step at correct position
- [ ] **Remove Step**: Remove button deletes intermediate step
- [ ] **Reorder Steps**: Left/right arrows move steps correctly
- [ ] **Edit Step**: All fields save (title, description, date, status, progress, probability, review)
- [ ] **Step Guardrails**: Initial step = 0%, End step = 100%
- [ ] **Step Persistence**: Refresh page, all steps persist with correct data

##### 3.3 Progress & Probability Tracking
- [ ] **Progress Calculation**: Shows highest progress from concluded steps
- [ ] **Success Probability**: Updates based on remaining planned steps
- [ ] **Validation Flags**: Date conflicts and progress issues show correctly
- [ ] **Status Changes**: Marking step as Concluded updates metrics

##### 3.4 UI & Interaction
- [ ] **Search Functionality**: Sidebar search filters plans correctly
- [ ] **Responsive Layout**: Sidebar and main content display properly
- [ ] **Button States**: Disabled buttons appear correctly
- [ ] **Input Sync**: Range and number inputs stay synchronized
- [ ] **Conclude Engagement**: Button marks End step as Concluded

#### 4. Manual Testing (Local)
```bash
# Start local development server
cd /home/user/webapp
npm run build
pm2 start ecosystem.config.cjs

# Verify server is running
curl http://localhost:3000

# Check PM2 status
pm2 list
pm2 logs engagement-planner --nostream
```

**Test Scenarios:**
1. **Create 3 new plans** - verify only 3 plans appear in sidebar
2. **Add 5 intermediate steps** to one plan - verify all 5 appear
3. **Reorder steps** - drag left/right and verify order persists
4. **Mark steps as Concluded** - verify progress updates
5. **Search plans** - verify filtering works
6. **Delete plan** - verify deletion and cleanup
7. **Refresh browser** - verify ALL data persists

#### 5. API Testing
```bash
# Test all API endpoints
curl http://localhost:3000/api/plans
curl http://localhost:3000/api/plans/:id
curl -X POST http://localhost:3000/api/plans -H "Content-Type: application/json" -d '{...}'
curl -X PUT http://localhost:3000/api/plans/:id -H "Content-Type: application/json" -d '{...}'
curl -X DELETE http://localhost:3000/api/plans/:id
```

#### 6. Backup & Safety
- [ ] Export current production data (if applicable)
- [ ] Save backup file locally
- [ ] Verify backup file is valid JSON
- [ ] Git commit with clear message describing the fix
- [ ] Git push to GitHub

#### 7. Deployment
```bash
# Build project
npm run build

# Verify build succeeded
ls -lh dist/

# Deploy to Cloudflare Pages
npx wrangler pages deploy dist --project-name webapp

# Note the deployment URL
```

#### 8. Post-Deployment Verification
- [ ] Visit production URL: https://webapp-5fs.pages.dev
- [ ] Test creating a plan - should create only ONE plan
- [ ] Test all CRUD operations (Create, Read, Update, Delete)
- [ ] Verify data persists across page refreshes
- [ ] Check browser console for errors
- [ ] Test on mobile device (responsive layout)
- [ ] Verify all buttons and inputs work

#### 9. Rollback Plan (if issues found)
- [ ] Have previous deployment URL ready
- [ ] Know how to revert git commits: `git revert <hash>`
- [ ] Can redeploy previous version quickly
- [ ] Have backup data file ready if needed

---

## 🧪 AUTOMATED TEST FRAMEWORK

### Critical Path Test Script

Create `tests/critical-paths.test.js`:

```javascript
/**
 * Critical Path Tests for Engagement Plan Monitor
 * These tests MUST pass before any deployment
 */

const BASE_URL = 'http://localhost:3000';

const CRITICAL_TESTS = {
  // Test 1: Server Health
  async testServerHealth() {
    const response = await fetch(BASE_URL);
    return response.status === 200;
  },

  // Test 2: Get All Plans
  async testGetPlans() {
    const response = await fetch(`${BASE_URL}/api/plans`);
    const data = await response.json();
    return Array.isArray(data);
  },

  // Test 3: Create Plan (Single Creation)
  async testCreatePlan() {
    const planData = {
      id: `test_${Date.now()}`,
      title: 'TEST_PLAN',
      startDate: '2026-02-23',
      endDate: '2026-03-09',
      steps: [
        {
          id: `step_initial_${Date.now()}`,
          type: 'initial',
          actionTitle: 'Initial Step',
          actionDescription: 'Test initial step',
          date: '2026-02-23',
          progress: 0,
          successProbability: 50,
          status: 'Planned',
          review: ''
        },
        {
          id: `step_end_${Date.now()}`,
          type: 'end',
          actionTitle: 'End Step',
          actionDescription: 'Test end step',
          date: '2026-03-09',
          progress: 100,
          successProbability: 100,
          status: 'Planned',
          review: ''
        }
      ]
    };

    const createResponse = await fetch(`${BASE_URL}/api/plans`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(planData)
    });
    
    if (!createResponse.ok) return false;

    // Verify plan was created
    const getResponse = await fetch(`${BASE_URL}/api/plans/${planData.id}`);
    const plan = await getResponse.json();

    // Cleanup
    await fetch(`${BASE_URL}/api/plans/${planData.id}`, { method: 'DELETE' });

    return plan.id === planData.id && plan.steps.length === 2;
  },

  // Test 4: Update Plan
  async testUpdatePlan() {
    // Create a test plan first
    const planData = {
      id: `test_${Date.now()}`,
      title: 'TEST_PLAN_UPDATE',
      startDate: '2026-02-23',
      endDate: '2026-03-09',
      steps: [
        {
          id: `step_${Date.now()}`,
          type: 'initial',
          actionTitle: 'Initial',
          actionDescription: '',
          date: '2026-02-23',
          progress: 0,
          successProbability: 50,
          status: 'Planned',
          review: ''
        },
        {
          id: `step_end_${Date.now()}`,
          type: 'end',
          actionTitle: 'End',
          actionDescription: '',
          date: '2026-03-09',
          progress: 100,
          successProbability: 100,
          status: 'Planned',
          review: ''
        }
      ]
    };

    await fetch(`${BASE_URL}/api/plans`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(planData)
    });

    // Update the plan
    planData.title = 'UPDATED_TITLE';
    const updateResponse = await fetch(`${BASE_URL}/api/plans/${planData.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(planData)
    });

    if (!updateResponse.ok) {
      await fetch(`${BASE_URL}/api/plans/${planData.id}`, { method: 'DELETE' });
      return false;
    }

    // Verify update
    const getResponse = await fetch(`${BASE_URL}/api/plans/${planData.id}`);
    const updated = await getResponse.json();

    // Cleanup
    await fetch(`${BASE_URL}/api/plans/${planData.id}`, { method: 'DELETE' });

    return updated.title === 'UPDATED_TITLE';
  },

  // Test 5: Delete Plan
  async testDeletePlan() {
    const planData = {
      id: `test_${Date.now()}`,
      title: 'TEST_PLAN_DELETE',
      startDate: '2026-02-23',
      endDate: '2026-03-09',
      steps: [
        {
          id: `step_${Date.now()}`,
          type: 'initial',
          actionTitle: 'Initial',
          actionDescription: '',
          date: '2026-02-23',
          progress: 0,
          successProbability: 50,
          status: 'Planned',
          review: ''
        },
        {
          id: `step_end_${Date.now()}`,
          type: 'end',
          actionTitle: 'End',
          actionDescription: '',
          date: '2026-03-09',
          progress: 100,
          successProbability: 100,
          status: 'Planned',
          review: ''
        }
      ]
    };

    await fetch(`${BASE_URL}/api/plans`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(planData)
    });

    // Delete the plan
    const deleteResponse = await fetch(`${BASE_URL}/api/plans/${planData.id}`, {
      method: 'DELETE'
    });

    if (!deleteResponse.ok) return false;

    // Verify deletion
    const getResponse = await fetch(`${BASE_URL}/api/plans/${planData.id}`);
    return getResponse.status === 404;
  }
};

// Run all critical tests
async function runCriticalTests() {
  console.log('🧪 Running Critical Path Tests for Engagement Plan Monitor...\n');
  
  const results = {};
  let passed = 0;
  let failed = 0;

  for (const [testName, testFn] of Object.entries(CRITICAL_TESTS)) {
    try {
      console.log(`Running ${testName}...`);
      const result = await testFn();
      results[testName] = result;
      if (result) {
        console.log(`✅ ${testName}: PASSED`);
        passed++;
      } else {
        console.log(`❌ ${testName}: FAILED`);
        failed++;
      }
    } catch (error) {
      console.log(`💥 ${testName}: ERROR - ${error.message}`);
      results[testName] = false;
      failed++;
    }
  }

  console.log(`\n📊 Results: ${passed} passed, ${failed} failed\n`);
  
  if (failed > 0) {
    console.log('🚫 DEPLOYMENT BLOCKED - Fix failing tests before deploying');
    process.exit(1);
  } else {
    console.log('✅ ALL TESTS PASSED - Safe to deploy');
    process.exit(0);
  }
}

// Run if executed directly
if (require.main === module) {
  runCriticalTests();
}

module.exports = { runCriticalTests, CRITICAL_TESTS };
```

---

## 🏗️ CODE QUALITY STANDARDS

### 1. Event Listener Management

**⚠️ CRITICAL RULE:** Event listeners must NEVER be duplicated.

```javascript
// ❌ BAD: Attaching listeners on every render
function render() {
  document.getElementById('root').innerHTML = '...';
  attachEventListeners(); // WRONG! Creates duplicates
}

// ✅ GOOD: Attach listeners once, use event delegation
let eventListenersAttached = false;

function attachEventListeners() {
  if (eventListenersAttached) return;
  eventListenersAttached = true;
  
  // Use event delegation on a parent element
  document.getElementById('root').addEventListener('click', (e) => {
    const target = e.target.closest('[data-action]');
    if (!target) return;
    // Handle action...
  });
}

// Attach once at startup
attachEventListeners();
```

### 2. State Management Principles

**Rule 1: Single Source of Truth**
- All application state lives in `AppState` class
- Never store state in DOM or global variables
- Always update state through AppState methods

**Rule 2: Immutable Updates**
```javascript
// ❌ BAD: Mutating state directly
appState.plans[0].title = 'New Title';

// ✅ GOOD: Updating through proper methods
appState.updateActivePlan({ title: 'New Title' });
```

**Rule 3: Defensive Programming**
```javascript
// Always validate data before use
const plan = appState.getActivePlan();
if (!plan) return;

const steps = plan.steps || [];
const progress = clamp(step.progress, 0, 100);
```

### 3. Code Change Impact Analysis

Before ANY code change, ask these questions:

1. **What components does this affect?**
   - Direct: The function/module being changed
   - Indirect: Components that depend on it

2. **What data flows through this code?**
   - Input sources (user input, API, state)
   - Transformations (calculations, formatting)
   - Output destinations (DOM, API, state)

3. **What could break?**
   - Event listener duplication
   - State synchronization
   - Data persistence
   - UI rendering
   - Other features

4. **How will I verify it works?**
   - Manual testing checklist
   - Automated tests
   - Production verification

### 4. Git Workflow Best Practices

```bash
# Always work on feature branches
git checkout -b fix/multiple-plan-creation

# Make focused, atomic commits
git add public/static/app.js
git commit -m "fix: Prevent duplicate event listeners causing multiple plan creation

- Add eventListenersAttached flag to prevent duplicate listeners
- Move attachEventListeners call to startup only
- Remove attachEventListeners calls from render function
- Fixes issue where clicking 'New' created multiple plans"

# Test before merging
npm run build
pm2 restart engagement-planner
# Manual verification

# Merge to main
git checkout main
git merge fix/multiple-plan-creation
```

### 5. Commit Message Format

```
<type>: <short description>

<detailed explanation>
- Bullet point 1
- Bullet point 2

Fixes #<issue-number>
```

**Types:**
- `fix:` Bug fixes
- `feat:` New features
- `refactor:` Code restructuring
- `docs:` Documentation changes
- `test:` Test additions/changes
- `chore:` Maintenance tasks

---

## ⚠️ COMMON PITFALLS

### 1. Duplicate Event Listeners
**Problem:** Clicking a button triggers the action multiple times.

**Symptoms:**
- Creating one plan results in multiple plans
- Buttons trigger actions 2x, 3x, or more times
- Actions multiply after each re-render

**Root Cause:** Event listeners are attached on every render without cleanup.

**Solution:**
- Attach event listeners ONCE at startup
- Use event delegation on parent elements
- Add guard flag to prevent duplicate attachment
- Never call `attachEventListeners()` in `render()`

### 2. State Not Persisting
**Problem:** Data disappears after page refresh.

**Symptoms:**
- Plans/steps lost on refresh
- Changes don't save to database
- API calls failing silently

**Solution:**
- Check browser console for API errors
- Verify database migrations applied
- Check network tab for failed requests
- Ensure `savePlan()` is called after changes

### 3. UI Not Updating
**Problem:** Changes don't reflect in the UI.

**Symptoms:**
- Editing fields doesn't update display
- Creating/deleting items doesn't update list
- State changes but DOM stays the same

**Solution:**
- Verify `notify()` is called after state changes
- Check that render() is subscribed to state
- Ensure `innerHTML` is being set correctly

### 4. Database Schema Mismatches
**Problem:** Frontend expects different field names than database provides.

**Example:**
- Frontend uses `startDate` but database has `start_date`

**Solution:**
- Always map database fields to frontend format in API routes
- Use consistent naming conventions
- Document field mappings

---

## 📊 SUCCESS METRICS

### A deployment is successful when:

1. ✅ **All pre-deployment checklist items completed**
2. ✅ **No new errors in production**
3. ✅ **All critical paths work**:
   - Plan creation (single plan only)
   - Plan editing and deletion
   - Step management
   - Data persistence
   - Progress/probability calculations
4. ✅ **No user-reported regressions**
5. ✅ **Performance is acceptable** (page load < 2s)

---

## 🆘 EMERGENCY PROCEDURES

### If a deployment breaks production:

1. **Identify the Issue**
   - Check browser console for errors (F12)
   - Check network tab for failed API calls
   - Review recent git commits: `git log --oneline -5`
   - Check Cloudflare Pages logs

2. **Quick Rollback Options**
   - Use previous Cloudflare Pages deployment URL
   - Revert git commits: `git revert <commit-hash>`
   - Redeploy previous version: `git checkout <previous-commit> && npm run build && wrangler pages deploy dist`

3. **Fix and Redeploy**
   - Fix the issue in code
   - Complete the pre-deployment checklist
   - Test thoroughly locally
   - Deploy the fix
   - Verify in production

4. **Post-Mortem**
   - Document what went wrong
   - Update this checklist to prevent recurrence
   - Add new test cases if needed

---

## 📚 RELATED DOCUMENTS

- `README.md` - Project overview and deployment info
- `package.json` - Scripts and dependencies
- `wrangler.jsonc` - Cloudflare configuration
- `migrations/` - Database schema changes

---

## 🔄 CONTINUOUS IMPROVEMENT

This document should be updated when:
- New critical paths are identified
- New bugs are discovered and fixed
- Testing procedures improve
- New features are added
- Team learns from production issues

**Last Updated:** February 23, 2026  
**Version:** 1.0  
**Status:** 🟢 Active  
**Next Review:** March 23, 2026
