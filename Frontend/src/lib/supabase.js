import { createClient } from '@supabase/supabase-js';

// Reemplaza esto con tus credenciales de Supabase
const supabaseUrl = 'https://lnpvjkdhbonnvelemusa.supabase.co';
const supabaseKey = 'sb_publishable_j-OA_8oPUwLsBtr87tspDA_N0pTzQs5';

export const supabase = createClient(supabaseUrl, supabaseKey);