// Engagement Plan Monitor - Vanilla JavaScript version
// Converted from React to work without build tools

const STATUS = {
  PLANNED: "Planned",
  CONCLUDED: "Concluded",
};

const BTN =
  "transition active:scale-[0.98] active:opacity-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-300";

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
    if (!q) return this.plans;
    return this.plans.filter(p => p.title.toLowerCase().includes(q));
  }

  updateActivePlan(patch) {
    const plan = this.getActivePlan();
    if (!plan) return;
    
    this.plans = this.plans.map(p => p.id === plan.id ? { ...p, ...patch } : p);
    this.savePlan({ ...plan, ...patch });
    this.notify();
  }

  updateStep(stepId, patch) {
    const plan = this.getActivePlan();
    if (!plan) return;

    const updatedPlan = {
      ...plan,
      steps: plan.steps.map(s => s.id === stepId ? { ...s, ...patch } : s)
    };
    
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
    <div class="w-[360px] shrink-0 rounded-2xl border bg-white shadow-sm" data-step-card data-step-id="${step.id}">
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
                class="${BTN} rounded-xl border px-2 py-1 text-xs hover:bg-slate-50 active:bg-slate-100 ${
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
                class="${BTN} rounded-xl border px-2 py-1 text-xs hover:bg-slate-50 active:bg-slate-100 ${
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
                class="${BTN} rounded-xl border px-2 py-1 text-xs text-slate-700 hover:bg-slate-50 active:bg-slate-100"
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
          <div>
            <div class="text-xs font-medium text-slate-700 mb-1">Date</div>
            <input
              type="date"
              class="w-full rounded-xl border px-3 py-2 text-sm"
              value="${step.date || ''}"
              data-field="date"
              data-step-id="${step.id}"
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
            class="${BTN} mt-4 w-full rounded-xl bg-slate-900 text-white px-4 py-2 hover:bg-slate-800 active:bg-slate-700"
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
        <aside class="w-[320px] border-r bg-white">
          <div class="p-4">
            <div class="text-xs font-semibold text-slate-500">Engagement Plan Monitor</div>
            <div class="mt-1 flex items-center justify-between gap-3">
              <div class="text-sm font-semibold">Plans</div>
              <button
                class="${BTN} rounded-xl bg-slate-900 text-white px-3 py-1.5 text-sm hover:bg-slate-800 active:bg-slate-700"
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
            ${filteredPlans.map(p => {
              const isActive = p.id === appState.activePlanId;
              return `
                <div
                  class="mx-2 mb-2 rounded-2xl border p-3 cursor-pointer ${
                    isActive
                      ? "bg-slate-900 text-white border-slate-900"
                      : "bg-white hover:bg-slate-50"
                  }"
                  data-action="selectPlan"
                  data-plan-id="${p.id}"
                >
                  <div class="flex items-start justify-between gap-2">
                    <div class="min-w-0">
                      <div class="text-sm font-semibold truncate ${isActive ? "text-white" : "text-slate-900"}">
                        ${p.title}
                      </div>
                      <div class="text-xs mt-1 ${isActive ? "text-slate-200" : "text-slate-500"}">
                        ${p.startDate} → ${p.endDate}
                      </div>
                    </div>
                    <button
                      class="${BTN} rounded-xl border px-2 py-1 text-[11px] ${
                        isActive
                          ? "border-white/30 hover:bg-white/10 active:bg-white/15"
                          : "hover:bg-slate-50 active:bg-slate-100"
                      }"
                      data-action="deletePlan"
                      data-plan-id="${p.id}"
                      title="Delete plan"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              `;
            }).join('')}

            ${filteredPlans.length === 0 ? `
              <div class="px-4 py-6 text-sm text-slate-500">No plans match your search.</div>
            ` : ''}
          </div>
        </aside>

        <!-- Main -->
        <main class="flex-1">
          <!-- Header -->
          <div class="sticky top-0 z-10 bg-slate-50/90 backdrop-blur border-b">
            <div class="p-5 flex flex-col gap-4">
              <div class="flex items-start justify-between gap-4">
                <div class="min-w-0 flex-1">
                  <input
                    class="w-full text-xl md:text-2xl font-semibold bg-transparent outline-none border-b border-transparent focus:border-slate-200"
                    value="${plan.title}"
                    data-field="planTitle"
                    placeholder="Engagement Plan title"
                  />
                  <div class="mt-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    <div>
                      <div class="text-xs font-medium text-slate-700 mb-1">Plan start date</div>
                      <input
                        type="date"
                        class="w-full rounded-xl border px-3 py-2 text-sm bg-white"
                        value="${plan.startDate}"
                        data-field="planStartDate"
                      />
                    </div>
                    <div>
                      <div class="text-xs font-medium text-slate-700 mb-1">Plan end date</div>
                      <input
                        type="date"
                        class="w-full rounded-xl border px-3 py-2 text-sm bg-white"
                        value="${plan.endDate}"
                        data-field="planEndDate"
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
                            class="h-full bg-slate-900 rounded-full"
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
                            class="h-full bg-slate-900 rounded-full"
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
                    class="${BTN} rounded-xl border bg-white px-3 py-2 text-sm hover:bg-slate-50 active:bg-slate-100"
                    data-action="addStepBeforeEnd"
                  >
                    Add step
                  </button>
                  <button
                    class="${BTN} rounded-xl bg-slate-900 text-white px-3 py-2 text-sm hover:bg-slate-800 active:bg-slate-700"
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
                      class="${BTN} shrink-0 w-10 h-10 rounded-full border bg-white shadow-sm hover:bg-slate-50 active:bg-slate-100 flex items-center justify-center"
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
                  class="${BTN} w-10 h-10 rounded-full border bg-white shadow-sm hover:bg-slate-50 active:bg-slate-100 flex items-center justify-center"
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
        // CRITICAL: Save scroll position BEFORE any focus/selection operations
        // Find the horizontal scroll container - it's the parent with overflow-x-auto class
        // The step card is inside this container, so we need to traverse up from the target
        let scrollContainer = targetElement.closest('.overflow-x-auto');
        
        // If not found directly, try finding it from the step card
        if (!scrollContainer) {
          const stepCard = targetElement.closest('[data-step-card]');
          if (stepCard) {
            scrollContainer = stepCard.parentElement;
          }
        }
        
        const savedScrollLeft = scrollContainer ? scrollContainer.scrollLeft : 0;
        
        // Use preventScroll to stop ALL scroll behavior during focus restoration
        targetElement.focus({ preventScroll: true });
        
        // Restore cursor position
        if (targetElement.setSelectionRange && preserveState.selectionStart !== null) {
          targetElement.setSelectionRange(preserveState.selectionStart, preserveState.selectionEnd);
        }
        
        // CRITICAL: Force restore scroll position IMMEDIATELY after focus/selection
        if (scrollContainer) {
          scrollContainer.scrollLeft = savedScrollLeft;
        }
        
        // DOUBLE CHECK: Force restore again after a tiny delay to catch any async scrolling
        setTimeout(() => {
          if (scrollContainer) {
            scrollContainer.scrollLeft = savedScrollLeft;
          }
        }, 0);
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

  // Handle button clicks using event delegation (single listener)
  root.addEventListener('click', (e) => {
    const target = e.target.closest('[data-action]');
    if (!target) return;

    const action = target.dataset.action;
    e.stopPropagation();

    switch (action) {
      case 'createPlan':
        appState.createPlan();
        break;
      case 'selectPlan':
        appState.setActivePlanId(target.dataset.planId);
        break;
      case 'deletePlan':
        e.stopPropagation();
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

  // Handle input changes using event delegation (single listener)
  root.addEventListener('input', (e) => {
    const target = e.target;
    const field = target.dataset.field;
    if (!field) return;

    const stepId = target.dataset.stepId;
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
      
      // Sync range and number inputs
      if (target.dataset.type) {
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
}

// Initialize app
appState.subscribe(render);
// Attach event listeners once at startup
attachEventListeners();
render();
