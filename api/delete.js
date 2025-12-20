import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

const ADMIN_PASS = process.env.ADMIN_PASSWORD;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Método no permitido' });
  }

  const auth = req.headers.authorization;
  if (auth !== ADMIN_PASS) {
    return res.status(401).json({ ok: false, error: 'Contraseña incorrecta' });
  }

  try {
    const { error } = await supabase.from('visits').delete().neq('id', 0);
    if (error) throw error;

    res.status(200).json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, error: err.message });
  }
}
