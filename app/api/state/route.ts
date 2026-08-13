import { env } from "cloudflare:workers";

const CREATE = `CREATE TABLE IF NOT EXISTS app_state (id INTEGER PRIMARY KEY CHECK (id = 1), payload TEXT NOT NULL, updated_at TEXT NOT NULL)`;

export async function GET() {
  try {
    if (!env.DB) return Response.json({ state: null });
    await env.DB.prepare(CREATE).run();
    const row = await env.DB.prepare("SELECT payload FROM app_state WHERE id = 1").first<{payload:string}>();
    return Response.json({ state: row ? JSON.parse(row.payload) : null });
  } catch { return Response.json({ state: null }); }
}

export async function POST(request: Request) {
  try {
    const body = await request.json() as {state:unknown};
    if (!env.DB) return Response.json({ saved:false, local:true });
    await env.DB.prepare(CREATE).run();
    await env.DB.prepare("INSERT INTO app_state (id, payload, updated_at) VALUES (1, ?, ?) ON CONFLICT(id) DO UPDATE SET payload = excluded.payload, updated_at = excluded.updated_at").bind(JSON.stringify(body.state), new Date().toISOString()).run();
    return Response.json({ saved:true });
  } catch (error) { return Response.json({ saved:false, error:String(error) }, {status:500}); }
}
