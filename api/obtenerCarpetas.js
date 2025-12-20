import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ ok: false, error: 'Metodo no permitido' });
  }

  try {
    const { data, error } = await supabase
      .from('carpetas_usuarios')
      .select('*')
      .order('id', { ascending: false });

    if (error) throw error;

    res.status(200).json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, error: err.message });
  }
}
