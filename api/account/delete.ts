import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getSupabaseAdminClient } from '../_lib/supabase.js';
import { getAccessToken } from '../_lib/auth.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'DELETE') {
    res.setHeader('Allow', 'DELETE');
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const token = getAccessToken(req);
    if (!token) { res.status(401).json({ error: 'Authentication required' }); return; }

    const supabase = getSupabaseAdminClient();
    const { data, error: authError } = await supabase.auth.getUser(token);
    if (authError || !data.user) {
      console.error('Account deletion token validation failed:', authError?.message);
      res.status(401).json({ error: authError?.message || 'Invalid or expired session' });
      return;
    }

    // Deleting auth.users cascades to profiles. Order and analytics references are
    // configured ON DELETE SET NULL so business history remains intact.
    const { error: deleteError } = await supabase.auth.admin.deleteUser(data.user.id);
    if (deleteError) { res.status(500).json({ error: deleteError.message }); return; }

    res.status(200).json({ deleted: true });
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Unable to delete account' });
  }
}
