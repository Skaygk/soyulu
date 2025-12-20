import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

const CONTRASENA_ADMIN = process.env.ADMIN_PASSWORD;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Metodo no permitido' });
  }

  try {
    const { id, contrasena } = req.body;

    if (!contrasena || contrasena !== CONTRASENA_ADMIN) {
      return res.status(401).json({ ok: false, error: 'Contrasena incorrecta' });
    }

    if (!id) {
      return res.status(400).json({ ok: false, error: 'ID de carpeta requerido' });
    }

    const { error } = await supabase
      .from('carpetas')
      .delete()
      .eq('id', id);

    if (error) throw error;

    res.status(200).json({ ok: true, mensaje: 'Carpeta borrada correctamente' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, error: err.message });
  }
}
