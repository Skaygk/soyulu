import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

const USUARIOS = process.env.USUARIOS || '';

function limpiarEntrada(texto) {
  if (typeof texto !== 'string') return '';
  return texto
    .replace(/<script.*?>.*?<\/script>/gi, '')
    .replace(/<\/?[^>]+(>|$)/g, '')
    .slice(0, 10000000);
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Metodo no permitido' });
  }

  const { titulo, autor, contenido, usuario, contrasena } = req.body || {};

  if (!titulo || !autor || !contenido || !usuario || !contrasena) {
    return res.status(400).json({ ok: false, error: 'Todos los campos son obligatorios' });
  }

  const usuariosValidos = USUARIOS.split(',').map(u => u.split(':'));
  const accesoValido = usuariosValidos.some(
    ([u, p]) => u === usuario && p === contrasena
  );

  if (!accesoValido) {
    return res.status(401).json({ ok: false, error: 'Usuario o contraseña incorrectos' });
  }

  const tituloLimpio = limpiarEntrada(titulo);
  const autorLimpio = limpiarEntrada(autor);
  const contenidoLimpio = limpiarEntrada(contenido);

  try {
    const { error } = await supabase.from('carpetas_usuarios').insert([
      {
        titulo: tituloLimpio,
        autor: autorLimpio,
        contenido: contenidoLimpio,
        subido_por: usuario
      }
    ]);

    if (error) throw error;

    res.status(200).json({ ok: true, subido_por: usuario });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, error: 'Error al guardar carpeta' });
  }
}
