export const config = {
  runtime: 'nodejs18.x'
};

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

const BOT_REGEX = /(bot|spider|crawl|slurp|fetch|facebook|telegram|discord|whatsapp|linkedin|preview|headless)/i;

function esBot(req) {
  const ua = req.headers['user-agent'] || '';
  const accept = req.headers['accept'] || '';

  if (!ua) return true;
  if (BOT_REGEX.test(ua)) return true;
  if (!accept.includes('text/html')) return true;

  return false;
}

async function obtenerGeo(ip) {
  try {
    const r = await fetch(`https://ipapi.co/${ip}/json/`, {
      headers: { 'User-Agent': 'sigmiza-tracker' },
      timeout: 3000
    });
    const j = await r.json();
    return {
      country: j.country_name || 'Unknown',
      city: j.city || 'Unknown'
    };
  } catch {
    return { country: 'Unknown', city: 'Unknown' };
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false });
  }

  try {
    if (esBot(req)) {
      return res.status(200).json({ ok: true, human: false });
    }

    const ip = (
      req.headers['x-forwarded-for']?.split(',')[0] ||
      req.socket.remoteAddress ||
      'Unknown'
    ).replace('::ffff:', '');

    const userAgent = req.headers['user-agent'] || 'Unknown';

    const geo = await obtenerGeo(ip);

    const { error } = await supabase.from('visits').insert([{
      ip,
      country: geo.country,
      city: geo.city,
      user_agent: userAgent
    }]);

    if (error) {
      console.error('mmm', error);
      return res.status(500).json({ ok: false });
    }

    return res.status(200).json({ ok: true, human: true });

  } catch (err) {
    console.error('pff pto', err);
    return res.status(500).json({ ok: false });
  }
}
