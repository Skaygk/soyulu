import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

const BOT_KEYWORDS = [
  'bot','spider','crawl','slurp','fetch',
  'facebook','linkedin','telegram','whatsapp',
  'discord','pingdom','preview','headless'
];

function isBot(req) {
  const ua = (req.headers['user-agent'] || '').toLowerCase();
  const accept = req.headers['accept'] || '';
  const secChUa = req.headers['sec-ch-ua'];

  if (!ua) return true;
  if (BOT_KEYWORDS.some(k => ua.includes(k))) return true;
  if (!accept.includes('text/html')) return true;
  if (!secChUa) return true;

  return false;
}

export default async function handler(req, res) {
  try {
    if (isBot(req)) {
      return res.status(200).json({ ok: true, human: false });
    }

    const ip = (
      req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
      req.socket.remoteAddress ||
      'Unknown'
    ).replace('::ffff:', '');

    const country = req.headers['x-vercel-ip-country'] || 'Unknown';
    const city = req.headers['x-vercel-ip-city'] || 'Unknown';
    const userAgent = req.headers['user-agent'] || 'Unknown';

    const { error } = await supabase.from('visits').insert([{
      ip,
      country,
      city,
      user_agent: userAgent
    }]);

    if (error) {
      console.error('Supabase insert error:', error);
      return res.status(500).json({ ok: false });
    }

    return res.status(200).json({ ok: true, human: true });
  } catch (err) {
    console.error('API error:', err);
    return res.status(500).json({ ok: false });
  }
}
