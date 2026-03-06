-- Add display_order column to plans table for custom user-defined ordering
-- This enables drag-and-drop reordering of plans in the sidebar

ALTER TABLE plans ADD COLUMN display_order INTEGER;

-- Initialize display_order for existing plans based on creation date
UPDATE plans SET display_order = (
  SELECT COUNT(*) FROM plans p2 WHERE p2.created_at <= plans.created_at
);

-- Create index for efficient sorting
CREATE INDEX IF NOT EXISTS idx_plans_display_order ON plans(display_order);
