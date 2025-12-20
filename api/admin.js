import { createClient } from '@supabase/supabase-js';

const PASSWORD = process.env.ADMIN_PASSWORD; // define tu contraseña en Vercel

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

export default async function handler(req, res) {
  if (req.headers.authorization !== PASSWORD) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { data } = await supabase.from('visits').select('*').order('created_at', { ascending: false });
  res.json(data);
}
