-- Engagement Plans table
CREATE TABLE IF NOT EXISTS plans (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  start_date TEXT NOT NULL,
  end_date TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Steps table
CREATE TABLE IF NOT EXISTS steps (
  id TEXT PRIMARY KEY,
  plan_id TEXT NOT NULL,
  type TEXT NOT NULL CHECK(type IN ('initial', 'intermediate', 'end')),
  action_title TEXT NOT NULL,
  action_description TEXT,
  date TEXT,
  progress INTEGER DEFAULT 0 CHECK(progress >= 0 AND progress <= 100),
  success_probability INTEGER DEFAULT 50 CHECK(success_probability >= 0 AND success_probability <= 100),
  status TEXT DEFAULT 'Planned' CHECK(status IN ('Planned', 'Concluded')),
  review TEXT,
  step_order INTEGER NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (plan_id) REFERENCES plans(id) ON DELETE CASCADE
);

-- Indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_steps_plan_id ON steps(plan_id);
CREATE INDEX IF NOT EXISTS idx_steps_order ON steps(plan_id, step_order);
CREATE INDEX IF NOT EXISTS idx_plans_dates ON plans(start_date, end_date);
