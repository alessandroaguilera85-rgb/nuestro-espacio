// ============================================================
// Cliente de Supabase
// ============================================================
// El id de tu proyecto es ycjemiivjknikzmscudj, así que la URL es:
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = 'https://ycjemiivjknikzmscudj.supabase.co';

// Esta es la "publishable key" (anon key) de tu proyecto. Es pública por
// diseño — Supabase la protege con las políticas de RLS que definiste en
// sql/schema.sql, no ocultándola — así que está bien que viva en el código
// del cliente. Verifica en Project Settings → API que coincide con la tuya.
const SUPABASE_ANON_KEY = 'sb_publishable_pwupEPS80mrBGtABOEoFXQ_IkfF51PW';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Nombre del bucket de Storage donde viven fotos/audio/video.
export const BUCKET = 'media';
