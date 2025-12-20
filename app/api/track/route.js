import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);


export async function POST(req) {
  try {
    const headers = req.headers;

    const ip =
      headers.get('x-forwarded-for')?.split(',')[0] ||
      'Unknown';

    const country = headers.get('x-vercel-ip-country') || 'Unknown';
    const city = headers.get('x-vercel-ip-city') || 'Unknown';

    await supabase.from('visits').insert([
      { ip, country, city }
    ]);

    return new Response(
      JSON.stringify({ ok: true }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: 'Tracking failed' }),
      { status: 500 }
    );
  }
}

// Evita errores si alguien hace GET manualmente
export async function GET() {
  return new Response(null, { status: 200 });
}
