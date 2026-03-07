// Engagement Plan Monitor - Vanilla JavaScript version
// Converted from React to work without build tools

const STATUS = {
  PLANNED: "Planned",
  CONCLUDED: "Concluded",
};

const BTN =
  "transition active:scale-[0.98] active:opacity-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-300";

function uid(prefix = "id") {
  return `${prefix}_${Math.random().toString(16).slice(2)}_${Date.now().toString(16)}`;
}

function clamp(n, min, max) {
  const x = Number.isFinite(+n) ? +n : min;
  return Math.max(min, Math.min(max, x));
}

function isoDate(d) {
  return d.toISOString().slice(0, 10);
}

function makeStep(partial = {}) {
  return {
    id: uid("step"),
    type: "intermediate",
    actionTitle: "",
    actionDescription: "",
    date: "",
    progress: 50,
    successProbability: 80,
    status: STATUS.PLANNED,
    review: "",
    ...partial,
  };
}

function makeBlankPlan(partial = {}) {
  const start = new Date();
  const end = new Date(start.getTime() + 14 * 24 * 60 * 60 * 1000);

  const initial = makeStep({
    id: uid("step"),
    type: "initial",
    actionTitle: "",
    actionDescription: "",
    date: isoDate(start),
    progress: 0,
    successProbability: 50,
    status: STATUS.PLANNED,
    review: "",
  });

  const endStep = makeStep({
    id: uid("step"),
    type: "end",
    actionTitle: "",
    actionDescription: "",
    date: isoDate(end),
    progress: 100,
    successProbability: 100,
    status: STATUS.PLANNED,
    review: "",
  });

  return {
    id: uid("plan"),
    title: "New Engagement Plan",
    startDate: isoDate(start),
    endDate: isoDate(end),
    steps: [initial, endStep],
    ...partial,
  };
}

function makeExamplePlan() {
  const start = new Date();
  const end = new Date(start.getTime() + 14 * 24 * 60 * 60 * 1000);

  const initial = makeStep({
    id: uid("step"),
    type: "initial",
    actionTitle: "Kickoff call",
    actionDescription:
      "Hold a kickoff call led by Account Lead with client sponsor to align objectives, stakeholders, and cadence. Outcome: shared understanding + confirm next actions.",
    date: isoDate(start),
    progress: 0,
    successProbability: 60,
    status: STATUS.PLANNED,
    review: "",
  });

  const s2 = makeStep({
    actionTitle: "Stakeholder mapping",
    actionDescription:
      "Delivery Lead maps stakeholders and decision makers; validate with client sponsor. Outcome: clear ownership and escalation paths.",
    date: isoDate(new Date(start.getTime() + 2 * 24 * 60 * 60 * 1000)),
    progress: 20,
    successProbability: 70,
  });

  const s3 = makeStep({
    actionTitle: "Requirements workshop",
    actionDescription:
      "Facilitate workshop with client SMEs; document requirements and constraints. Outcome: reduce ambiguity; increase probability via aligned scope.",
    date: isoDate(new Date(start.getTime() + 5 * 24 * 60 * 60 * 1000)),
    progress: 45,
    successProbability: 75,
  });

  const s4 = makeStep({
    actionTitle: "Prototype + review",
    actionDescription:
      "Build prototype; review with sponsor; capture changes. Outcome: validate approach; increase probability via early feedback.",
    date: isoDate(new Date(start.getTime() + 9 * 24 * 60 * 60 * 1000)),
    progress: 70,
    successProbability: 85,
  });

  const endStep = makeStep({
    id: uid("step"),
    type: "end",
    actionTitle: "Engagement concluded",
    actionDescription:
      "Final state achieved: success criteria met, handover completed, and closeout report signed off.",
    date: isoDate(end),
    progress: 100,
    successProbability: 100,
    status: STATUS.PLANNED,
    review: "",
  });

  return {
    id: uid("plan"),
    title: "Example Engagement Plan",
    startDate: isoDate(start),
    endDate: isoDate(end),
    steps: [initial, s2, s3, s4, endStep],
  };
}

function computePlanStats(plan) {
  const steps = plan.steps || [];
  const initial = steps.find((s) => s.type === "initial");
  const end = steps.find((s) => s.type === "end");

  const concluded = steps.filter((s) => s.status === STATUS.CONCLUDED);
  const currentProgress = concluded.length ? Math.max(...concluded.map((s) => s.progress)) : 0;

  const remainingPlanned = steps.filter((s) => s.status === STATUS.PLANNED && s.type !== "end").length;
  const heuristicProbability = clamp(100 - remainingPlanned * 10, 0, 100);

  const endProb = end ? end.successProbability : 100;
  const displayedProbability = clamp(Math.min(endProb, heuristicProbability), 0, 100);

  const flags = [];
  if (plan.startDate && plan.endDate && plan.startDate > plan.endDate) {
    flags.push("Plan start date is after end date.");
  }
  for (const s of steps) {
    if (!s.date) continue;
    if (plan.startDate && s.date < plan.startDate) flags.push(`"${s.actionTitle || "(Untitled step)"}" is before plan start.`);
    if (plan.endDate && s.date > plan.endDate) flags.push(`"${s.actionTitle || "(Untitled step)"}" is after plan end.`);
  }

  const progresses = steps.map((s) => s.progress);
  const nonMonotonic = progresses.some((p, i) => i > 0 && p < progresses[i - 1]);
  if (nonMonotonic) flags.push("Progress decreases between steps. Consider increasing left → right.");
  if (initial && initial.progress !== 0) flags.push("Initial Step progress should be 0.");
  if (end && end.progress !== 100) flags.push("End Step progress should be 100.");

  return {
    currentProgress,
    displayedProbability,
    remainingPlanned,
    flags,
  };
}

// App State
class AppState {
  constructor() {
    this.plans = [];
    this.activePlanId = null;
    this.sidebarQuery = "";
    this.sidebarCollapsed = false;
    this.listeners = [];
    this.loadPlans();
  }

  async loadPlans() {
    try {
      const response = await fetch('/api/plans');
      const plans = await response.json();
      
      if (plans.length === 0) {
        // Create example plan if database is empty
        const examplePlan = makeExamplePlan();
        await this.savePlan(examplePlan);
        this.plans = [examplePlan];
      } else {
        this.plans = plans;
      }
      
      this.activePlanId = this.plans[0]?.id;
      this.notify();
    } catch (error) {
      console.error('Failed to load plans:', error);
      // Fallback to example plan
      const examplePlan = makeExamplePlan();
      this.plans = [examplePlan];
      this.activePlanId = examplePlan.id;
      this.notify();
    }
  }

  async savePlan(plan) {
    try {
      const response = await fetch(`/api/plans/${plan.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(plan)
      });
      
      if (!response.ok) {
        // If plan doesn't exist, create it
        await fetch('/api/plans', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(plan)
        });
      }
    } catch (error) {
      console.error('Failed to save plan:', error);
    }
  }

  async deletePlanById(planId) {
    try {
      await fetch(`/api/plans/${planId}`, { method: 'DELETE' });
    } catch (error) {
      console.error('Failed to delete plan:', error);
    }
  }

  subscribe(listener) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  notify() {
    this.listeners.forEach(listener => listener());
  }

  getActivePlan() {
    return this.plans.find(p => p.id === this.activePlanId) || this.plans[0];
  }

  getFilteredPlans() {
    const q = this.sidebarQuery.trim().toLowerCase();
    let filtered = q ? this.plans.filter(p => p.title.toLowerCase().includes(q)) : this.plans;
    // Sort by displayOrder (ascending), fallback to created_at
    return filtered.sort((a, b) => {
      if (a.displayOrder !== undefined && b.displayOrder !== undefined) {
        return a.displayOrder - b.displayOrder;
      }
      return 0; // Keep original order if no displayOrder
    });
  }

  async reorderPlans(planId, newIndex) {
    // Get the current filtered/sorted order
    const filteredPlans = this.getFilteredPlans();
    
    // Find the plan being moved in filtered array
    const oldIndex = filteredPlans.findIndex(p => p.id === planId);
    if (oldIndex === -1) return;

    // Create new ordered array by moving the plan
    const reorderedFiltered = [...filteredPlans];
    const [movedPlan] = reorderedFiltered.splice(oldIndex, 1);
    reorderedFiltered.splice(newIndex, 0, movedPlan);

    // Assign new displayOrder values based on new positions
    const updatedPlans = reorderedFiltered.map((plan, index) => ({
      ...plan,
      displayOrder: index
    }));

    // Update the main plans array with new displayOrder values
    this.plans = this.plans.map(plan => {
      const updated = updatedPlans.find(p => p.id === plan.id);
      return updated || plan;
    });

    // Save all updated plans to the database
    try {
      await Promise.all(
        updatedPlans.map(plan =>
          fetch(`/api/plans/${plan.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(plan)
          })
        )
      );
      
      this.notify();
    } catch (error) {
      console.error('Failed to reorder plans:', error);
    }
  }

  updateActivePlan(patch) {
    const plan = this.getActivePlan();
    if (!plan) return;
    
    const updatedPlan = { ...plan, ...patch };
    
    // If steps were updated, sync plan dates with initial and end step dates
    if (patch.steps) {
      const initialStep = updatedPlan.steps.find(s => s.type === 'initial');
      const endStep = updatedPlan.steps.find(s => s.type === 'end');
      
      if (initialStep && initialStep.date) {
        updatedPlan.startDate = initialStep.date;
      }
      if (endStep && endStep.date) {
        updatedPlan.endDate = endStep.date;
      }
    }
    
    this.plans = this.plans.map(p => p.id === plan.id ? updatedPlan : p);
    this.savePlan(updatedPlan);
    this.notify();
  }

  updateStep(stepId, patch) {
    const plan = this.getActivePlan();
    if (!plan) return;

    const updatedPlan = {
      ...plan,
      steps: plan.steps.map(s => s.id === stepId ? { ...s, ...patch } : s)
    };
    
    // Sync plan dates with initial and end step dates
    const initialStep = updatedPlan.steps.find(s => s.type === 'initial');
    const endStep = updatedPlan.steps.find(s => s.type === 'end');
    
    if (initialStep && initialStep.date) {
      updatedPlan.startDate = initialStep.date;
    }
    if (endStep && endStep.date) {
      updatedPlan.endDate = endStep.date;
    }
    
    this.plans = this.plans.map(p => p.id === plan.id ? updatedPlan : p);
    this.savePlan(updatedPlan);
    this.notify();
  }

  insertStepAt(index) {
    const plan = this.getActivePlan();
    if (!plan) return;

    const nextProgressLeft = plan.steps[index - 1]?.progress ?? 0;
    const nextProgressRight = plan.steps[index]?.progress ?? 100;
    const midProgress = clamp(Math.round((nextProgressLeft + nextProgressRight) / 2), 0, 100);

    const newStep = makeStep({
      progress: midProgress,
      successProbability: clamp(100 - (plan.steps.length - 2) * 8, 0, 100),
    });

    const steps = [...plan.steps];
    steps.splice(index, 0, newStep);
    
    this.updateActivePlan({ steps });
  }

  removeStep(stepId) {
    const plan = this.getActivePlan();
    if (!plan) return;

    this.updateActivePlan({
      steps: plan.steps.filter(s => s.id !== stepId)
    });
  }

  moveStep(stepId, dir) {
    const plan = this.getActivePlan();
    if (!plan) return;

    const idx = plan.steps.findIndex(s => s.id === stepId);
    if (idx === -1) return;

    const step = plan.steps[idx];
    if (step.type !== "intermediate") return;

    const minIdx = 1;
    const maxIdx = plan.steps.length - 2;
    const target = idx + dir;

    if (target < minIdx || target > maxIdx) return;

    const steps = [...plan.steps];
    [steps[idx], steps[target]] = [steps[target], steps[idx]];
    
    this.updateActivePlan({ steps });
  }

  async createPlan() {
    const plan = makeBlankPlan();
    this.plans = [plan, ...this.plans];
    this.activePlanId = plan.id;
    await this.savePlan(plan);
    this.notify();
  }

  async deletePlan(planId) {
    // Get the plan to show its title in the confirmation
    const plan = this.plans.find(p => p.id === planId);
    if (!plan) return;

    // Show confirmation dialog before deleting
    const planTitle = plan.title || 'Untitled Plan';
    const confirmMessage = `Are you sure you want to delete "${planTitle}"?\n\nThis will permanently remove the plan and all its steps. This action cannot be undone.`;
    
    if (!confirm(confirmMessage)) {
      return; // User cancelled, do nothing
    }

    // User confirmed, proceed with deletion
    await this.deletePlanById(planId);
    this.plans = this.plans.filter(p => p.id !== planId);
    if (this.activePlanId === planId) {
      this.activePlanId = this.plans[0]?.id;
    }
    this.notify();
  }

  setActivePlanId(id) {
    this.activePlanId = id;
    this.notify();
  }

  setSidebarQuery(query) {
    this.sidebarQuery = query;
    this.notify();
  }

  toggleSidebar() {
    this.sidebarCollapsed = !this.sidebarCollapsed;
    this.notify();
  }
}

// Create global state
const appState = new AppState();

// Render Functions
function renderStepCard(step, options) {
  const { isRemovable, canMoveLeft, canMoveRight, onMoveLeft, onMoveRight, onChange, onRemove } = options;
  const isConcluded = step.status === STATUS.CONCLUDED;
  const progressLocked = step.type === "initial" || step.type === "end";
  const successLocked = step.type === "end";
  const lockedFieldClass = "opacity-50 cursor-not-allowed";

  return `
    <div class="w-[360px] shrink-0 rounded-2xl border bg-white shadow-sm transition-colors" data-step-card data-step-id="${step.id}">
      <div class="p-4">
        <div class="flex items-start justify-between gap-3">
          <div class="min-w-0">
            <div class="flex items-center gap-2">
              <span class="inline-flex items-center rounded-full border px-2 py-0.5 text-xs text-slate-700 bg-white">
                ${step.type === "initial" ? "Initial Step" : step.type === "end" ? "End Step" : "Step"}
              </span>
              <span class="inline-flex items-center rounded-full border px-2 py-0.5 text-xs text-slate-700 bg-white">
                ${step.status}
              </span>
            </div>
            <input
              class="mt-2 w-full text-base font-semibold text-slate-900 outline-none border-b border-transparent focus:border-slate-200"
              value="${step.actionTitle || ''}"
              data-field="actionTitle"
              data-step-id="${step.id}"
              placeholder="${step.type === "initial" ? "Initial action" : step.type === "end" ? "End state" : "Action"}"
            />
          </div>

          <div class="flex items-center gap-2">
            ${step.type === "intermediate" ? `
              <button
                class="${BTN} rounded-xl border px-2 py-1 text-xs hover:bg-sky-50 active:bg-sky-100 hover:border-sky-200 ${
                  canMoveLeft ? "text-slate-700" : "text-slate-300 cursor-not-allowed"
                }"
                ${canMoveLeft ? '' : 'disabled'}
                data-action="moveLeft"
                data-step-id="${step.id}"
                title="Move left"
              >
                ←
              </button>
              <button
                class="${BTN} rounded-xl border px-2 py-1 text-xs hover:bg-sky-50 active:bg-sky-100 hover:border-sky-200 ${
                  canMoveRight ? "text-slate-700" : "text-slate-300 cursor-not-allowed"
                }"
                ${canMoveRight ? '' : 'disabled'}
                data-action="moveRight"
                data-step-id="${step.id}"
                title="Move right"
              >
                →
              </button>
            ` : ''}

            ${isRemovable ? `
              <button
                class="${BTN} rounded-xl border px-2 py-1 text-xs text-slate-700 hover:bg-sky-50 active:bg-sky-100 hover:border-sky-200"
                data-action="remove"
                data-step-id="${step.id}"
                title="Remove step"
              >
                Remove
              </button>
            ` : ''}
          </div>
        </div>

        <div class="mt-4 grid grid-cols-2 gap-3">
          <div class="relative">
            <div class="text-xs font-medium text-slate-700 mb-1">Date</div>
            <input
              type="text"
              class="w-full rounded-xl border px-3 py-2 text-sm cursor-pointer"
              value="${step.date || ''}"
              data-field="date"
              data-step-id="${step.id}"
              data-date-picker="true"
              placeholder="YYYY-MM-DD"
              readonly
            />
          </div>
          <div>
            <div class="text-xs font-medium text-slate-700 mb-1">Status</div>
            <select
              class="w-full rounded-xl border px-3 py-2 text-sm bg-white"
              data-field="status"
              data-step-id="${step.id}"
            >
              <option value="${STATUS.PLANNED}" ${step.status === STATUS.PLANNED ? 'selected' : ''}>Planned</option>
              <option value="${STATUS.CONCLUDED}" ${step.status === STATUS.CONCLUDED ? 'selected' : ''}>Concluded</option>
            </select>
          </div>
        </div>

        <div class="mt-4">
          <div class="text-xs font-medium text-slate-700 mb-1">Action description</div>
          <textarea
            class="w-full min-h-[110px] rounded-xl border px-3 py-2 text-sm"
            data-field="actionDescription"
            data-step-id="${step.id}"
            placeholder="Include: what will be done; who will do it; who the target person is; desired outcome; expected change in success probability and rationale."
          >${step.actionDescription || ''}</textarea>
          <div class="text-[11px] text-slate-500 mt-1 leading-snug">
            Include: what will be done; who will do it; who the target person is; desired outcome; expected change in success probability and rationale.
          </div>
        </div>

        <div class="mt-4 grid grid-cols-2 gap-3">
          <div>
            <div class="text-xs font-medium text-slate-700 mb-1">
              Progress (%) ${progressLocked ? '<span class="text-slate-400 font-normal">(fixed)</span>' : ''}
            </div>
            <div class="flex items-center gap-2 ${progressLocked ? lockedFieldClass : ''}">
              <input
                type="range"
                min="0"
                max="100"
                value="${step.progress}"
                ${progressLocked ? 'disabled' : ''}
                data-field="progress"
                data-step-id="${step.id}"
                data-type="range"
                class="w-full"
              />
              <input
                type="number"
                min="0"
                max="100"
                ${progressLocked ? 'disabled' : ''}
                class="w-[72px] rounded-xl border px-2 py-2 text-sm"
                value="${step.progress}"
                data-field="progress"
                data-step-id="${step.id}"
                data-type="number"
              />
            </div>
          </div>
          <div>
            <div class="text-xs font-medium text-slate-700 mb-1">
              Success probability (%) ${successLocked ? '<span class="text-slate-400 font-normal">(fixed)</span>' : ''}
            </div>
            <div class="flex items-center gap-2 ${successLocked ? lockedFieldClass : ''}">
              <input
                type="range"
                min="0"
                max="100"
                value="${step.successProbability}"
                ${successLocked ? 'disabled' : ''}
                data-field="successProbability"
                data-step-id="${step.id}"
                data-type="range"
                class="w-full"
              />
              <input
                type="number"
                min="0"
                max="100"
                ${successLocked ? 'disabled' : ''}
                class="w-[72px] rounded-xl border px-2 py-2 text-sm"
                value="${step.successProbability}"
                data-field="successProbability"
                data-step-id="${step.id}"
                data-type="number"
              />
            </div>
          </div>
        </div>

        ${isConcluded ? `
          <div class="mt-4">
            <div class="text-xs font-medium text-slate-700 mb-1">Review</div>
            <textarea
              class="w-full min-h-[110px] rounded-xl border px-3 py-2 text-sm"
              data-field="review"
              data-step-id="${step.id}"
              placeholder="Analyze results vs expectation; lessons learnt; how next steps changed."
            >${step.review || ''}</textarea>
          </div>
        ` : ''}
      </div>
    </div>
  `;
}

function render() {
  const plan = appState.getActivePlan();
  const filteredPlans = appState.getFilteredPlans();
  
  // Preserve focused element and cursor position before re-render
  const activeElement = document.activeElement;
  const isInputField = activeElement && (activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA');
  const preserveState = isInputField ? {
    field: activeElement.dataset.field,
    stepId: activeElement.dataset.stepId,
    selectionStart: activeElement.selectionStart,
    selectionEnd: activeElement.selectionEnd,
    value: activeElement.value
  } : null;
  
  if (!plan) {
    document.getElementById('root').innerHTML = `
      <div class="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div class="max-w-md w-full rounded-2xl border bg-white p-6 shadow-sm">
          <div class="text-lg font-semibold">No plans yet</div>
          <div class="text-sm text-slate-600 mt-1">Create your first engagement plan to begin.</div>
          <button
            class="${BTN} mt-4 w-full rounded-xl bg-sky-600 text-white px-4 py-2 hover:bg-sky-700 active:bg-sky-800"
            data-action="createPlan"
          >
            Create plan
          </button>
        </div>
      </div>
    `;
    // Note: Event listeners are attached once at startup, not on each render
    return;
  }

  const stats = computePlanStats(plan);

  document.getElementById('root').innerHTML = `
    <div class="min-h-screen bg-slate-50 text-slate-900">
      <div class="flex min-h-screen">
        <!-- Sidebar -->
        <aside class="fixed left-0 top-0 h-screen z-20 border-r bg-white transition-transform duration-300 ${appState.sidebarCollapsed ? '-translate-x-full' : 'translate-x-0'} w-[320px]">
          <div class="p-4">
            <div class="text-xs font-semibold text-slate-500">Engagement Plan Monitor</div>
            <div class="mt-1 flex items-center justify-between gap-3">
              <div class="text-sm font-semibold">Plans</div>
              <button
                class="${BTN} rounded-xl bg-sky-600 text-white px-3 py-1.5 text-sm hover:bg-sky-700 active:bg-sky-800"
                data-action="createPlan"
              >
                New
              </button>
            </div>
            <input
              class="mt-3 w-full rounded-xl border px-3 py-2 text-sm"
              placeholder="Search plans…"
              value="${appState.sidebarQuery}"
              data-field="sidebarQuery"
            />
          </div>

          <div class="px-2 pb-4">
            ${filteredPlans.map((p, index) => {
              const isActive = p.id === appState.activePlanId;
              // Calculate current progress for this plan
              const concluded = p.steps.filter(s => s.status === STATUS.CONCLUDED);
              const progress = concluded.length ? Math.max(...concluded.map(s => s.progress)) : 0;
              
              return `
                <div
                  class="mx-2 mb-2 rounded-2xl border p-3 cursor-move ${
                    isActive
                      ? "bg-sky-50 border-sky-200 border-l-4 border-l-sky-500"
                      : "bg-white hover:bg-slate-50"
                  }"
                  data-action="selectPlan"
                  data-plan-id="${p.id}"
                  data-draggable-plan="true"
                  data-plan-index="${index}"
                  draggable="true"
                >
                  <div class="flex items-center justify-between gap-3">
                    <div class="min-w-0 flex-1 text-center">
                      <div class="text-sm font-semibold truncate ${isActive ? "text-sky-900" : "text-slate-900"}">
                        ${p.title}
                      </div>
                      <div class="text-xs mt-1 ${isActive ? "text-sky-700" : "text-slate-500"}">
                        ${p.startDate} → ${p.endDate}
                      </div>
                    </div>
                    <div class="flex items-center gap-2 shrink-0">
                      <div class="text-2xl font-bold ${isActive ? "text-sky-700" : "text-slate-900"}">
                        ${progress}%
                      </div>
                      <button
                        class="${BTN} rounded-xl border p-2 ${
                          isActive
                            ? "border-sky-200 hover:bg-sky-100 active:bg-sky-200"
                            : "hover:bg-slate-50 active:bg-slate-100"
                        }"
                        data-action="deletePlan"
                        data-plan-id="${p.id}"
                        title="Delete plan"
                      >
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              `;
            }).join('')}

            ${filteredPlans.length === 0 ? `
              <div class="px-4 py-6 text-sm text-slate-500">No plans match your search.</div>
            ` : ''}
          </div>
        </aside>

        <!-- Sidebar Toggle Button -->
        <button
          class="${BTN} fixed left-2 top-6 z-30 rounded-xl bg-white border shadow-lg p-2 hover:bg-sky-50 active:bg-sky-100 hover:border-sky-200 transition-all duration-300 ${appState.sidebarCollapsed ? '' : 'left-[328px]'}"
          data-action="toggleSidebar"
          title="${appState.sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            ${appState.sidebarCollapsed ? `
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 5l7 7-7 7M5 5l7 7-7 7" />
            ` : `
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
            `}
          </svg>
        </button>

        <!-- Main -->
        <main class="flex-1 transition-all duration-300 ${appState.sidebarCollapsed ? 'ml-0' : 'ml-[320px]'}">
          <!-- Header -->
          <div class="sticky top-0 z-10 bg-slate-50/90 backdrop-blur border-b">
            <div class="p-5 pl-16 flex flex-col gap-4">
              <div class="flex items-center justify-between gap-4">
                <div class="min-w-0 flex-1">
                  <input
                    class="w-full text-xl md:text-2xl font-semibold bg-transparent outline-none border-b border-transparent focus:border-slate-200"
                    value="${plan.title}"
                    data-field="planTitle"
                    placeholder="Engagement Plan title"
                  />
                  <div class="mt-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    <div class="relative">
                      <div class="text-xs font-medium text-slate-700 mb-1">Plan start date</div>
                      <input
                        type="text"
                        class="w-full rounded-xl border px-3 py-2 text-sm bg-white cursor-pointer"
                        value="${plan.startDate}"
                        data-field="planStartDate"
                        data-date-picker="true"
                        placeholder="YYYY-MM-DD"
                        readonly
                      />
                    </div>
                    <div class="relative">
                      <div class="text-xs font-medium text-slate-700 mb-1">Plan end date</div>
                      <input
                        type="text"
                        class="w-full rounded-xl border px-3 py-2 text-sm bg-white cursor-pointer"
                        value="${plan.endDate}"
                        data-field="planEndDate"
                        data-date-picker="true"
                        placeholder="YYYY-MM-DD"
                        readonly
                      />
                    </div>
                    <div>
                      <div class="text-xs font-medium text-slate-700 mb-1">Plan progress</div>
                      <div class="rounded-2xl border bg-white px-3 py-2">
                        <div class="flex items-center justify-between text-sm">
                          <span class="text-slate-700">${stats.currentProgress}%</span>
                          <span class="text-slate-500">Current</span>
                        </div>
                        <div class="mt-2 h-2 rounded-full bg-slate-100 overflow-hidden">
                          <div
                            class="h-full bg-sky-600 rounded-full"
                            style="width: ${stats.currentProgress}%"
                          ></div>
                        </div>
                      </div>
                    </div>
                    <div>
                      <div class="text-xs font-medium text-slate-700 mb-1">Success probability</div>
                      <div class="rounded-2xl border bg-white px-3 py-2">
                        <div class="flex items-center justify-between text-sm">
                          <span class="text-slate-700">${stats.displayedProbability}%</span>
                          <span class="text-slate-500">
                            ${stats.remainingPlanned ? `${stats.remainingPlanned} planned step(s)` : "No pending steps"}
                          </span>
                        </div>
                        <div class="mt-2 h-2 rounded-full bg-slate-100 overflow-hidden">
                          <div
                            class="h-full bg-sky-400 rounded-full"
                            style="width: ${stats.displayedProbability}%"
                          ></div>
                        </div>
                      </div>
                    </div>
                  </div>

                  ${stats.flags.length > 0 ? `
                    <div class="mt-3 rounded-2xl border bg-white p-3">
                      <div class="text-xs font-semibold text-slate-800">Checks</div>
                      <ul class="mt-2 text-xs text-slate-600 list-disc pl-5 space-y-1">
                        ${stats.flags.slice(0, 5).map(f => `<li>${f}</li>`).join('')}
                      </ul>
                      <div class="text-[11px] text-slate-500 mt-2">
                        Tip: Aim for 0% at the Initial Step, 100% at the End Step, and a smooth increase left → right.
                      </div>
                    </div>
                  ` : ''}
                </div>

                <div class="hidden lg:flex items-center gap-2">
                  <button
                    class="${BTN} rounded-xl border bg-white px-3 py-2 text-sm hover:bg-sky-50 active:bg-sky-100 hover:border-sky-200"
                    data-action="addStepBeforeEnd"
                  >
                    Add step
                  </button>
                  <button
                    class="${BTN} rounded-xl bg-sky-600 text-white px-3 py-2 text-sm hover:bg-sky-700 active:bg-sky-800"
                    data-action="concludeEngagement"
                  >
                    Conclude engagement
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- Steps flow -->
          <div class="p-5">
            <div class="text-sm text-slate-600 mb-3">
              Steps flow left → right. Use <span class="font-semibold">+</span> between cards to insert as many intermediate steps as needed.
            </div>

            <div class="flex items-start gap-4 overflow-x-auto pb-6">
              ${plan.steps.map((step, idx) => {
                const isRemovable = step.type === "intermediate";
                const canMoveLeft = step.type === "intermediate" && idx > 1;
                const canMoveRight = step.type === "intermediate" && idx < plan.steps.length - 2;

                const parts = [];
                
                if (idx > 0) {
                  parts.push(`
                    <button
                      class="${BTN} shrink-0 w-10 h-10 rounded-full border bg-white shadow-sm hover:bg-sky-50 active:bg-sky-100 hover:border-sky-200 flex items-center justify-center"
                      data-action="insertStep"
                      data-index="${idx}"
                      title="Insert a step here"
                    >
                      <span class="text-xl leading-none">+</span>
                    </button>
                  `);
                }

                parts.push(renderStepCard(step, {
                  isRemovable,
                  canMoveLeft,
                  canMoveRight
                }));

                return parts.join('');
              }).join('')}

              <div class="shrink-0 flex flex-col items-center justify-center w-[140px]">
                <button
                  class="${BTN} w-10 h-10 rounded-full border bg-white shadow-sm hover:bg-sky-50 active:bg-sky-100 hover:border-sky-200 flex items-center justify-center"
                  data-action="insertStep"
                  data-index="${plan.steps.length - 1}"
                  title="Insert before End Step"
                >
                  <span class="text-xl leading-none">+</span>
                </button>
                <div class="mt-2 text-xs text-slate-500 text-center">Insert before end</div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  `;

  // Restore focused element and cursor position after re-render
  if (preserveState) {
    // Use requestAnimationFrame to ensure DOM has updated
    requestAnimationFrame(() => {
      let targetElement;
      
      if (preserveState.stepId) {
        // Find input by field and stepId
        targetElement = document.querySelector(
          `[data-field="${preserveState.field}"][data-step-id="${preserveState.stepId}"]`
        );
      } else {
        // Find input by field only (for plan-level fields)
        targetElement = document.querySelector(`[data-field="${preserveState.field}"]`);
      }
      
      if (targetElement) {
        // CRITICAL: For step cards, we need to ensure the card stays centered
        // Find the step card and the scroll container
        const stepCard = targetElement.closest('[data-step-card]');
        let scrollContainer = targetElement.closest('.overflow-x-auto');
        
        // If not found directly, try finding it from the step card
        if (!scrollContainer && stepCard) {
          scrollContainer = stepCard.parentElement;
        }
        
        // Use preventScroll to stop browser's native scroll behavior during focus restoration
        targetElement.focus({ preventScroll: true });
        
        // Restore cursor position
        if (targetElement.setSelectionRange && preserveState.selectionStart !== null) {
          targetElement.setSelectionRange(preserveState.selectionStart, preserveState.selectionEnd);
        }
        
        // CRITICAL: After restoring focus/cursor, ensure the step card is centered
        // This ensures typing is always visible on screen
        if (stepCard && scrollContainer) {
          // Center the card in the viewport
          stepCard.scrollIntoView({ 
            behavior: 'auto',  // Use 'auto' for instant, no animation during typing
            block: 'nearest', 
            inline: 'center' 
          });
        }
      }
    });
  }

  // Note: Event listeners are attached once at startup, not on each render
}

// Global flag to ensure event listeners are only attached once
let eventListenersAttached = false;

// Track the last scrolled step card to prevent re-scrolling during typing
let lastScrolledStepCardId = null;

// Function to scroll a step card into view (centers horizontally)
function scrollStepCardIntoView(stepCardElement) {
  if (stepCardElement && stepCardElement.dataset.stepCard !== undefined) {
    stepCardElement.scrollIntoView({ 
      behavior: 'smooth', 
      block: 'nearest', 
      inline: 'center' 
    });
    // Track which card we just scrolled to
    lastScrolledStepCardId = stepCardElement.dataset.stepId;
  }
}

function attachEventListeners() {
  // Prevent duplicate event listeners
  if (eventListenersAttached) {
    return;
  }
  eventListenersAttached = true;

  const root = document.getElementById('root');

  // Track slider drag state to enable smooth dragging without re-renders
  const sliderState = {
    isDragging: false,
    field: null,
    stepId: null,
    value: null
  };

  // Handle button clicks using event delegation (single listener)
  root.addEventListener('click', (e) => {
    const target = e.target.closest('[data-action]');
    if (!target) return;

    const action = target.dataset.action;
    e.stopPropagation();

    switch (action) {
      case 'toggleSidebar':
        appState.toggleSidebar();
        break;
      case 'createPlan':
        appState.createPlan();
        break;
      case 'selectPlan':
        appState.setActivePlanId(target.dataset.planId);
        break;
      case 'deletePlan':
        e.stopPropagation();
        e.preventDefault();
        appState.deletePlan(target.dataset.planId);
        break;
      case 'insertStep':
        appState.insertStepAt(parseInt(target.dataset.index));
        break;
      case 'addStepBeforeEnd':
        const plan = appState.getActivePlan();
        const endIndex = plan.steps.findIndex(s => s.type === 'end');
        appState.insertStepAt(endIndex);
        break;
      case 'concludeEngagement':
        const p = appState.getActivePlan();
        const end = p.steps.find(s => s.type === 'end');
        if (end) {
          appState.updateStep(end.id, { status: STATUS.CONCLUDED, review: end.review || '' });
        }
        break;
      case 'remove':
        appState.removeStep(target.dataset.stepId);
        break;
      case 'moveLeft':
        appState.moveStep(target.dataset.stepId, -1);
        break;
      case 'moveRight':
        appState.moveStep(target.dataset.stepId, 1);
        break;
    }
  });

  // Handle range slider start (mousedown/touchstart)
  root.addEventListener('mousedown', (e) => {
    if (e.target.type === 'range' && e.target.dataset.field) {
      sliderState.isDragging = true;
      sliderState.field = e.target.dataset.field;
      sliderState.stepId = e.target.dataset.stepId;
      sliderState.value = parseInt(e.target.value);
    }
  });

  root.addEventListener('touchstart', (e) => {
    if (e.target.type === 'range' && e.target.dataset.field) {
      sliderState.isDragging = true;
      sliderState.field = e.target.dataset.field;
      sliderState.stepId = e.target.dataset.stepId;
      sliderState.value = parseInt(e.target.value);
    }
  });

  // Handle range slider end (mouseup/touchend) - THIS is when we save
  const handleSliderEnd = () => {
    if (sliderState.isDragging && sliderState.stepId) {
      const patch = { [sliderState.field]: sliderState.value };
      
      // Enforce guardrails
      const plan = appState.getActivePlan();
      const step = plan.steps.find(s => s.id === sliderState.stepId);
      if (step) {
        if (step.type === 'initial' && sliderState.field === 'progress') patch.progress = 0;
        if (step.type === 'end' && sliderState.field === 'progress') patch.progress = 100;
        if (step.type === 'end' && sliderState.field === 'successProbability') patch.successProbability = 100;
      }

      appState.updateStep(sliderState.stepId, patch);
    }
    
    // Reset drag state
    sliderState.isDragging = false;
    sliderState.field = null;
    sliderState.stepId = null;
    sliderState.value = null;
  };

  root.addEventListener('mouseup', handleSliderEnd);
  root.addEventListener('touchend', handleSliderEnd);
  // Also handle case where mouse leaves window while dragging
  document.addEventListener('mouseup', handleSliderEnd);

  // Handle input changes using event delegation (single listener)
  root.addEventListener('input', (e) => {
    const target = e.target;
    const field = target.dataset.field;
    if (!field) return;

    const stepId = target.dataset.stepId;
    
    // For range sliders during drag, only update the paired number input visually
    if (target.type === 'range' && sliderState.isDragging) {
      const value = parseInt(target.value);
      sliderState.value = value;
      
      // Sync the number input visually without triggering state update
      const numberInput = root.querySelector(
        `[data-field="${field}"][data-step-id="${stepId}"][data-type="number"]`
      );
      if (numberInput) {
        numberInput.value = value;
      }
      return; // Don't update state yet, wait for mouseup
    }

    // For number inputs (progress/successProbability), don't update on input event
    // We'll handle these on blur/enter instead
    if (target.type === 'number' && (field === 'progress' || field === 'successProbability')) {
      return; // Skip immediate update, handle on blur
    }

    const value = target.type === 'number' ? parseInt(target.value) || 0 : target.value;

    if (field === 'sidebarQuery') {
      appState.setSidebarQuery(value);
    } else if (field === 'planTitle') {
      appState.updateActivePlan({ title: value });
    } else if (field === 'planStartDate') {
      appState.updateActivePlan({ startDate: value });
    } else if (field === 'planEndDate') {
      appState.updateActivePlan({ endDate: value });
    } else if (stepId) {
      const patch = { [field]: value };
      
      // Enforce guardrails
      const plan = appState.getActivePlan();
      const step = plan.steps.find(s => s.id === stepId);
      if (step) {
        if (step.type === 'initial' && field === 'progress') patch.progress = 0;
        if (step.type === 'end' && field === 'progress') patch.progress = 100;
        if (step.type === 'end' && field === 'successProbability') patch.successProbability = 100;
      }

      appState.updateStep(stepId, patch);
      
      // Sync range and number inputs (but not for progress/successProbability number inputs)
      if (target.dataset.type && target.type !== 'number') {
        const otherType = target.dataset.type === 'range' ? 'number' : 'range';
        const otherInput = root.querySelector(
          `[data-field="${field}"][data-step-id="${stepId}"][data-type="${otherType}"]`
        );
        if (otherInput) {
          otherInput.value = value;
        }
      }
    }
  });

  // Handle number input blur/enter for progress and successProbability
  root.addEventListener('blur', (e) => {
    const target = e.target;
    if (target.type !== 'number') return;
    
    const field = target.dataset.field;
    if (field !== 'progress' && field !== 'successProbability') return;
    
    const stepId = target.dataset.stepId;
    if (!stepId) return;

    const value = parseInt(target.value) || 0;
    const patch = { [field]: value };
    
    // Enforce guardrails
    const plan = appState.getActivePlan();
    const step = plan.steps.find(s => s.id === stepId);
    if (step) {
      if (step.type === 'initial' && field === 'progress') patch.progress = 0;
      if (step.type === 'end' && field === 'progress') patch.progress = 100;
      if (step.type === 'end' && field === 'successProbability') patch.successProbability = 100;
    }

    appState.updateStep(stepId, patch);
    
    // Sync the range slider
    const rangeInput = root.querySelector(
      `[data-field="${field}"][data-step-id="${stepId}"][data-type="range"]`
    );
    if (rangeInput) {
      rangeInput.value = patch[field];
    }
  }, true); // Use capture phase

  // Handle Enter key on number inputs
  root.addEventListener('keydown', (e) => {
    if (e.key !== 'Enter') return;
    
    const target = e.target;
    if (target.type !== 'number') return;
    
    const field = target.dataset.field;
    if (field !== 'progress' && field !== 'successProbability') return;
    
    target.blur(); // Trigger blur handler
  });

  // Handle clicks on step cards or input fields - scroll card into view
  // Only scroll if clicking on a DIFFERENT step card than the last one scrolled
  root.addEventListener('mousedown', (e) => {
    // Find the closest step card (whether clicking on card itself or an input inside it)
    const stepCard = e.target.closest('[data-step-card]');
    
    if (stepCard) {
      // Only scroll if this is a different card than the last one we scrolled to
      if (stepCard.dataset.stepId !== lastScrolledStepCardId) {
        // Use setTimeout to let the click complete first, then scroll
        setTimeout(() => {
          scrollStepCardIntoView(stepCard);
        }, 10);
      }
    }
  });
  
  // Handle focus on step card inputs - add sky blue shading to active card
  root.addEventListener('focusin', (e) => {
    const input = e.target;
    if (!input.dataset || !input.dataset.stepId) return;
    
    const stepCard = input.closest('[data-step-card]');
    if (stepCard) {
      // Remove active styling from all step cards
      document.querySelectorAll('[data-step-card]').forEach(card => {
        card.classList.remove('bg-sky-50', 'border-sky-200');
        card.classList.add('bg-white');
      });
      
      // Add active styling to current step card
      stepCard.classList.remove('bg-white');
      stepCard.classList.add('bg-sky-50', 'border-sky-200');
    }
  });
  
  // Handle blur on step card inputs - remove sky blue shading when focus leaves
  root.addEventListener('focusout', (e) => {
    // Use setTimeout to check if focus moved to another element in the same card
    setTimeout(() => {
      const activeElement = document.activeElement;
      const activeStepCard = activeElement?.closest('[data-step-card]');
      
      // Remove active styling from all cards that don't contain the focused element
      document.querySelectorAll('[data-step-card]').forEach(card => {
        if (card !== activeStepCard) {
          card.classList.remove('bg-sky-50', 'border-sky-200');
          card.classList.add('bg-white');
        }
      });
    }, 10);
  });
  
  // Drag-and-drop for plan reordering
  let draggedPlanId = null;
  let draggedPlanIndex = null;
  let lastDropTarget = null;
  let lastDropPosition = null; // 'before' or 'after'
  
  root.addEventListener('dragstart', (e) => {
    const planCard = e.target.closest('[data-draggable-plan="true"]');
    if (!planCard) return;
    
    draggedPlanId = planCard.dataset.planId;
    draggedPlanIndex = parseInt(planCard.dataset.planIndex, 10);
    
    // Visual feedback - make dragged item semi-transparent
    planCard.style.opacity = '0.4';
    
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', planCard.innerHTML);
  });
  
  root.addEventListener('dragover', (e) => {
    e.preventDefault();
    
    const planCard = e.target.closest('[data-draggable-plan="true"]');
    if (!planCard || !draggedPlanId) return;
    
    e.dataTransfer.dropEffect = 'move';
    
    // Show drop indicator
    const rect = planCard.getBoundingClientRect();
    const midpoint = rect.top + rect.height / 2;
    
    // Store the target for later use
    lastDropTarget = planCard;
    lastDropPosition = e.clientY < midpoint ? 'before' : 'after';
    
    // Remove all drop indicators first
    document.querySelectorAll('[data-draggable-plan="true"]').forEach(card => {
      card.classList.remove('border-t-4', 'border-t-sky-500', 'border-b-4', 'border-b-sky-500');
    });
    
    // Add indicator based on mouse position
    if (e.clientY < midpoint) {
      planCard.classList.add('border-t-4', 'border-t-sky-500');
    } else {
      planCard.classList.add('border-b-4', 'border-b-sky-500');
    }
  });
  
  root.addEventListener('dragleave', (e) => {
    const planCard = e.target.closest('[data-draggable-plan="true"]');
    if (!planCard) return;
    
    // Remove drop indicators
    planCard.classList.remove('border-t-4', 'border-t-sky-500', 'border-b-4', 'border-b-sky-500');
  });
  
  root.addEventListener('dragend', (e) => {
    const planCard = e.target.closest('[data-draggable-plan="true"]');
    if (!planCard) return;
    
    // Reset opacity
    planCard.style.opacity = '1';
    
    // Remove all drop indicators
    document.querySelectorAll('[data-draggable-plan="true"]').forEach(card => {
      card.classList.remove('border-t-4', 'border-t-sky-500', 'border-b-4', 'border-b-sky-500');
    });
    
    // If dropped on a valid target, reorder
    if (draggedPlanId && lastDropTarget && draggedPlanIndex !== null) {
      const targetIndex = parseInt(lastDropTarget.dataset.planIndex, 10);
      
      if (draggedPlanIndex !== targetIndex) {
        // Calculate new index based on drop position
        let newIndex = targetIndex;
        
        // If dropping after target and dragging from before, add 1
        if (lastDropPosition === 'after' && draggedPlanIndex < targetIndex) {
          newIndex = targetIndex;
        } else if (lastDropPosition === 'before' && draggedPlanIndex > targetIndex) {
          newIndex = targetIndex;
        } else if (lastDropPosition === 'after') {
          newIndex = targetIndex + 1;
        }
        
        // Clamp to valid range
        newIndex = Math.max(0, Math.min(newIndex, document.querySelectorAll('[data-draggable-plan="true"]').length - 1));
        
        appState.reorderPlans(draggedPlanId, newIndex);
      }
    }
    
    draggedPlanId = null;
    draggedPlanIndex = null;
    lastDropTarget = null;
    lastDropPosition = null;
  });
  
  root.addEventListener('drop', (e) => {
    e.preventDefault();
  });
  
  // Custom date picker handler
  let activeDatePicker = null;
  
  root.addEventListener('click', (e) => {
    const dateInput = e.target.closest('[data-date-picker="true"]');
    
    if (dateInput) {
      e.stopPropagation();
      showDatePicker(dateInput);
    } else if (activeDatePicker && !e.target.closest('.date-picker-calendar')) {
      // Click outside - close calendar
      closeDatePicker();
    }
  });
  
  function showDatePicker(input) {
    // Close any existing picker
    closeDatePicker();
    
    // Create calendar element
    const calendar = document.createElement('div');
    calendar.className = 'date-picker-calendar absolute z-50 bg-white border rounded-xl shadow-xl p-3 mt-1';
    calendar.style.minWidth = '280px';
    
    // Parse current date or use today
    const currentValue = input.value;
    const initialDate = currentValue ? new Date(currentValue + 'T00:00:00') : new Date();
    let viewMonth = initialDate.getMonth();
    let viewYear = initialDate.getFullYear();
    
    function renderCalendar() {
      const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                          'July', 'August', 'September', 'October', 'November', 'December'];
      
      // Create header with month/year navigation
      const header = `
        <div class="flex items-center justify-between mb-2">
          <button type="button" class="date-prev-month px-2 py-1 hover:bg-sky-50 rounded">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div class="font-semibold text-sm">${monthNames[viewMonth]} ${viewYear}</div>
          <button type="button" class="date-next-month px-2 py-1 hover:bg-sky-50 rounded">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      `;
      
      // Create day headers
      const dayHeaders = `
        <div class="grid grid-cols-7 gap-1 mb-1">
          ${['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => 
            `<div class="text-xs text-center text-slate-500 font-medium p-1">${day}</div>`
          ).join('')}
        </div>
      `;
      
      // Create calendar grid
      const firstDay = new Date(viewYear, viewMonth, 1).getDay();
      const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
      const today = new Date();
      const todayStr = isoDate(today);
      
      let daysHTML = '<div class="grid grid-cols-7 gap-1">';
      
      // Empty cells for days before month starts
      for (let i = 0; i < firstDay; i++) {
        daysHTML += '<div></div>';
      }
      
      // Days of the month
      for (let day = 1; day <= daysInMonth; day++) {
        const dateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const isSelected = dateStr === currentValue;
        const isToday = dateStr === todayStr;
        
        let classes = 'text-sm p-2 text-center rounded cursor-pointer hover:bg-sky-50';
        if (isSelected) classes += ' bg-sky-600 text-white hover:bg-sky-700';
        else if (isToday) classes += ' border border-slate-300';
        
        daysHTML += `<button type="button" class="date-select-day ${classes}" data-date="${dateStr}">${day}</button>`;
      }
      
      daysHTML += '</div>';
      
      calendar.innerHTML = header + dayHeaders + daysHTML;
      
      // Attach month navigation listeners
      calendar.querySelector('.date-prev-month').addEventListener('click', (e) => {
        e.stopPropagation();
        viewMonth--;
        if (viewMonth < 0) {
          viewMonth = 11;
          viewYear--;
        }
        renderCalendar();
      });
      
      calendar.querySelector('.date-next-month').addEventListener('click', (e) => {
        e.stopPropagation();
        viewMonth++;
        if (viewMonth > 11) {
          viewMonth = 0;
          viewYear++;
        }
        renderCalendar();
      });
      
      // Attach day selection listeners
      calendar.querySelectorAll('.date-select-day').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const selectedDate = btn.dataset.date;
          input.value = selectedDate;
          
          // Trigger change event to update state
          const changeEvent = new Event('input', { bubbles: true });
          input.dispatchEvent(changeEvent);
          
          closeDatePicker();
        });
      });
    }
    
    renderCalendar();
    
    // Position calendar below input
    const parent = input.parentElement;
    parent.style.position = 'relative';
    parent.appendChild(calendar);
    
    activeDatePicker = { input, calendar };
  }
  
  function closeDatePicker() {
    if (activeDatePicker) {
      activeDatePicker.calendar.remove();
      activeDatePicker = null;
    }
  }
}

// Initialize app
appState.subscribe(render);
// Attach event listeners once at startup
attachEventListeners();
render();
