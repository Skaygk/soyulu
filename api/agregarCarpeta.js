import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

const USUARIOS = process.env.USUARIOS ? process.env.USUARIOS.split(',') : [];

function validarUsuario(usuario, contrasena) {
  for (const u of USUARIOS) {
    const [user, pass] = u.split(':');
    if (user === usuario && pass === contrasena) return true;
  }
  return false;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Metodo no permitido' });
  }

  const { titulo, autor, contenido, usuario, contrasena } = req.body;

  if (!titulo || !autor || !contenido || !usuario || !contrasena) {
    return res.status(400).json({ ok: false, error: 'Todos los campos son obligatorios' });
  }

  if (!validarUsuario(usuario, contrasena)) {
    return res.status(401).json({ ok: false, error: 'Usuario o contrasena incorrectos' });
  }

  try {
    const { error } = await supabase.from('carpetas_usuarios').insert([
      { titulo, autor, contenido, subido_por: usuario }
    ]);

    if (error) throw error;

    return res.status(200).json({ ok: true, subido_por: usuario });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ ok: false, error: err.message });
  }
}
