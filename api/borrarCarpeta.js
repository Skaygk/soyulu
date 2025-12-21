import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);
const PASSWORD_ADMIN = process.env.ADMIN_PASSWORD;

export default async function handler(req,res){
  if(req.method !== 'POST') return res.status(405).json({ok:false,error:'Metodo no permitido'});

  const { id, password } = req.body;
  if(password !== PASSWORD_ADMIN) return res.status(401).json({ok:false,error:'Contraseña incorrecta, deja de joder'});

  try {
    const { error } = await supabase.from('carpetas_usuarios').delete().eq('id', id);
    if(error) throw error;
    res.status(200).json({ok:true});
  } catch(err) {
    console.error(err);
    res.status(500).json({ok:false,error:err.message});
  }
}
