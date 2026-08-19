import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getUserFromRequest } from '../_lib/auth.js';
import { getSupabaseAdminClient } from '../_lib/supabase.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const supabase = getSupabaseAdminClient();
  const { user } = await getUserFromRequest(req);
  if (!user) return res.status(401).json({ error: 'Authentication required' });
  const { data: caller } = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle();
  if (!caller || !['admin', 'manager'].includes(caller.role)) return res.status(403).json({ error: 'Not authorized' });
  const { email, password, fullName } = req.body || {};
  if (!email || !password || String(password).length < 8) return res.status(400).json({ error: 'Email and a password of at least 8 characters are required' });
  const { data, error } = await supabase.auth.admin.createUser({ email: String(email).trim().toLowerCase(), password: String(password), email_confirm: true, user_metadata: { full_name: String(fullName || 'Kitchen Staff') } });
  if (error || !data.user) return res.status(400).json({ error: error?.message || 'Could not create user' });
  const { error: profileError } = await supabase.from('profiles').update({ full_name: String(fullName || 'Kitchen Staff'), role: 'kitchen' }).eq('id', data.user.id);
  if (profileError) return res.status(500).json({ error: 'User created but kitchen role could not be assigned' });
  return res.status(201).json({ id: data.user.id, email: data.user.email });
}
