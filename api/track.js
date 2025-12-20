import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

const BOT_KEYWORDS = [
  'bot', 'spider', 'crawl', 'slurp', 'fetch', 'facebook', 'linkedin', 'telegram', 'whatsapp', 'discord', 'pingdom'
];

function isBot(userAgent) {
  if (!userAgent) return true; 
  const ua = userAgent.toLowerCase();
  return BOT_KEYWORDS.some(keyword => ua.includes(keyword));
}

export default async function handler(req, res) {
  try {
    const userAgent = req.headers['user-agent'] || '';
    if (isBot(userAgent)) {
   
      return res.status(200).json({ ok: true, human: false });
    }

    const ip =
      req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
      req.socket.remoteAddress ||
      'Unknown';

    const country = req.headers['x-vercel-ip-country'] || 'Unknown';
    const city = req.headers['x-vercel-ip-city'] || 'Unknown';

    
    const { error } = await supabase.from('visits').insert([
      { ip, country, city, user_agent: userAgent }
    ]);

    if (error) {
      console.error('Supabase insert error:', error);
      return res.status(500).json({ ok: false, error: error.message });
    }

    return res.status(200).json({ ok: true, human: true });
  } catch (err) {
    console.error('API error:', err);
    return res.status(500).json({ ok: false, error: err.message });
  }
}
