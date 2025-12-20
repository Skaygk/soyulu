import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

export default async function handler(req, res) {
 
  if (req.method === 'GET') {
    return res.status(200).json({ ok: true });
  }


  if (req.method === 'POST') {
    const ip =
      req.headers['x-forwarded-for']?.split(',')[0] ||
      req.socket.remoteAddress ||
      'Unknown';

    const country = req.headers['x-vercel-ip-country'] || 'Unknown';
    const city = req.headers['x-vercel-ip-city'] || 'Unknown';

    await supabase.from('visits').insert([{ ip, country, city }]);

    return res.status(200).json({ ok: true });
  }

  
  return res.status(200).end();
}
