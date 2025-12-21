import { createClient } from '@supabase/supabase-js';
import { SpeedInsights } from "@vercel/speed-insights/next";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

const PASSWORD = process.env.ADMIN_PASSWORD;

export default async function handler(req, res) {
  const auth = req.headers.authorization;

  if (!PASSWORD || auth !== PASSWORD) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { data, error } = await supabase
    .from('visits')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  return res.status(200).json(data);
}
