import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { serveStatic } from 'hono/cloudflare-workers'

type Bindings = {
  DB: D1Database;
}

const app = new Hono<{ Bindings: Bindings }>()

// Enable CORS for API routes
app.use('/api/*', cors())

// Serve static files
app.use('/static/*', serveStatic({ root: './public' }))

// API Routes - Get all plans
app.get('/api/plans', async (c) => {
  const { DB } = c.env

  const { results: plans } = await DB.prepare(`
    SELECT * FROM plans ORDER BY created_at DESC
  `).all()

  // Get steps for all plans
  const plansWithSteps = await Promise.all(
    plans.map(async (plan: any) => {
      const { results: steps } = await DB.prepare(`
        SELECT * FROM steps WHERE plan_id = ? ORDER BY step_order ASC
      `).bind(plan.id).all()

      return {
        id: plan.id,
        title: plan.title,
        startDate: plan.start_date,
        endDate: plan.end_date,
        steps: steps.map((s: any) => ({
          id: s.id,
          type: s.type,
          actionTitle: s.action_title,
          actionDescription: s.action_description,
          date: s.date,
          progress: s.progress,
          successProbability: s.success_probability,
          status: s.status,
          review: s.review
        }))
      }
    })
  )

  return c.json(plansWithSteps)
})

// API Routes - Get single plan
app.get('/api/plans/:id', async (c) => {
  const { DB } = c.env
  const planId = c.req.param('id')

  const plan = await DB.prepare(`
    SELECT * FROM plans WHERE id = ?
  `).bind(planId).first()

  if (!plan) {
    return c.json({ error: 'Plan not found' }, 404)
  }

  const { results: steps } = await DB.prepare(`
    SELECT * FROM steps WHERE plan_id = ? ORDER BY step_order ASC
  `).bind(planId).all()

  return c.json({
    id: plan.id,
    title: plan.title,
    startDate: plan.start_date,
    endDate: plan.end_date,
    steps: steps.map((s: any) => ({
      id: s.id,
      type: s.type,
      actionTitle: s.action_title,
      actionDescription: s.action_description,
      date: s.date,
      progress: s.progress,
      successProbability: s.success_probability,
      status: s.status,
      review: s.review
    }))
  })
})

// API Routes - Create plan
app.post('/api/plans', async (c) => {
  const { DB } = c.env
  const body = await c.req.json()

  const { id, title, startDate, endDate, steps } = body

  await DB.prepare(`
    INSERT INTO plans (id, title, start_date, end_date)
    VALUES (?, ?, ?, ?)
  `).bind(id, title, startDate, endDate).run()

  // Insert steps
  for (let i = 0; i < steps.length; i++) {
    const step = steps[i]
    await DB.prepare(`
      INSERT INTO steps (
        id, plan_id, type, action_title, action_description, 
        date, progress, success_probability, status, review, step_order
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      step.id,
      id,
      step.type,
      step.actionTitle || '',
      step.actionDescription || '',
      step.date || '',
      step.progress || 0,
      step.successProbability || 50,
      step.status || 'Planned',
      step.review || '',
      i
    ).run()
  }

  return c.json({ success: true, id })
})

// API Routes - Update plan
app.put('/api/plans/:id', async (c) => {
  const { DB } = c.env
  const planId = c.req.param('id')
  const body = await c.req.json()

  const { title, startDate, endDate, steps } = body

  await DB.prepare(`
    UPDATE plans SET title = ?, start_date = ?, end_date = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).bind(title, startDate, endDate, planId).run()

  // Delete existing steps and recreate
  await DB.prepare(`DELETE FROM steps WHERE plan_id = ?`).bind(planId).run()

  // Insert new steps
  for (let i = 0; i < steps.length; i++) {
    const step = steps[i]
    await DB.prepare(`
      INSERT INTO steps (
        id, plan_id, type, action_title, action_description, 
        date, progress, success_probability, status, review, step_order
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      step.id,
      planId,
      step.type,
      step.actionTitle || '',
      step.actionDescription || '',
      step.date || '',
      step.progress || 0,
      step.successProbability || 50,
      step.status || 'Planned',
      step.review || '',
      i
    ).run()
  }

  return c.json({ success: true })
})

// API Routes - Delete plan
app.delete('/api/plans/:id', async (c) => {
  const { DB } = c.env
  const planId = c.req.param('id')

  await DB.prepare(`DELETE FROM plans WHERE id = ?`).bind(planId).run()
  // Steps will be deleted automatically due to CASCADE

  return c.json({ success: true })
})

// Main page
app.get('/', (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Engagement Plan Monitor</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link href="https://fonts.googleapis.com/css2?family=Noto+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
        <style>
          body {
            font-family: 'Noto Sans', ui-sans-serif, system-ui, -apple-system, 'Segoe UI';
          }
        </style>
    </head>
    <body class="bg-slate-50 min-h-screen">
        <div id="root"></div>
        <script src="/static/app.js"></script>
    </body>
    </html>
  `)
})

export default app
