import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShieldCheck, UserRound } from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { useAuth } from '@/auth/AuthContext';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

export default function ProfilePage() {
  const navigate = useNavigate();
  const { user, profile, isStaff, refreshProfile, signOut } = useAuth();
  const [name, setName] = useState(profile?.full_name || '');
  const [address, setAddress] = useState(profile?.delivery_address || '');
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => setName(profile?.full_name || ''), [profile?.full_name]);
  useEffect(() => setAddress(profile?.delivery_address || ''), [profile?.delivery_address]);

  const saveProfile = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!user) return;
    if (!name.trim() || !address.trim()) {
      toast.error('Please add your full name and delivery address.');
      return;
    }
    setSaving(true);
    const { error } = await supabase.from('profiles').update({ full_name: name.trim(), delivery_address: address.trim() }).eq('id', user.id);
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    await refreshProfile();
    toast.success('Profile updated');
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/login', { replace: true });
  };

  const deleteAccount = async () => {
    if (!window.confirm('Permanently delete your account? This cannot be undone.')) return;
    if (!window.confirm('Final confirmation: delete this login and profile permanently?')) return;
    setDeleting(true);
    try {
      const { error: deleteError } = await supabase.rpc('delete_own_account');
      if (deleteError) throw deleteError;
      await supabase.auth.signOut({ scope: 'local' });
      navigate('/login', { replace: true });
      toast.success('Account deleted');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to delete account');
    } finally { setDeleting(false); }
  };

  return <MainLayout>
    <section className="bg-[#0d0914] px-4 py-12 text-[#f8f5ff]">
      <div className="container mx-auto max-w-3xl">
        <p className="text-sm font-bold uppercase tracking-[.2em] text-[#00c8f0]">{profile?.full_name && profile?.delivery_address ? 'Your account' : 'One last step'}</p>
        <h1 className="mt-2 text-4xl font-black uppercase sm:text-5xl">{profile?.full_name && profile?.delivery_address ? 'My Profile' : 'Complete your profile'}</h1>
        {(!profile?.full_name || !profile?.delivery_address) && <p className="mt-3 max-w-xl text-white/75">Add your name and delivery address to finish creating your 90's Burger account.</p>}
      </div>
    </section>
    <div className="container mx-auto max-w-3xl px-4 py-10">
      <div className="overflow-hidden rounded-3xl border border-black/10 bg-white shadow-sm">
        <div className="flex flex-col gap-5 border-b bg-[#f8f5ff] p-6 sm:flex-row sm:items-center">
          <div className="grid h-20 w-20 shrink-0 place-items-center rounded-full bg-[#f0008f] text-white"><UserRound className="h-10 w-10" /></div>
          <div><h2 className="text-2xl font-black">{profile?.full_name || user?.email?.split('@')[0] || 'Customer'}</h2><p className="mt-1 text-muted-foreground">{user?.email}</p><span className="mt-3 inline-flex items-center gap-1 rounded-full bg-white px-3 py-1 text-xs font-bold uppercase"><ShieldCheck className="h-3.5 w-3.5 text-[#f0008f]" />{profile?.role || 'customer'}</span></div>
        </div>
        <form onSubmit={saveProfile} className="space-y-5 p-6">
          <div><Label htmlFor="profile-name">Full name *</Label><Input id="profile-name" required autoComplete="name" className="mt-2 h-12" value={name} onChange={e => setName(e.target.value)} placeholder="Your full name" /></div>
          <div><Label htmlFor="profile-address">Delivery address *</Label><Textarea id="profile-address" required autoComplete="street-address" className="mt-2 min-h-28" value={address} onChange={e => setAddress(e.target.value)} placeholder="Street, building, floor and apartment" /></div>
          <div><Label>Email</Label><Input className="mt-2 h-12 bg-muted" value={user?.email || ''} disabled /></div>
          <div><Label>Account ID</Label><Input className="mt-2 h-12 bg-muted font-mono text-xs" value={user?.id || ''} disabled /></div>
          <div className="flex flex-col gap-3 border-t pt-5 sm:flex-row"><Button type="submit" disabled={saving} className="rounded-full bg-[#f0008f] px-7 text-white hover:bg-[#c60076]">{saving ? 'Saving…' : 'Save profile'}</Button>{isStaff && <Link to="/admin"><Button type="button" variant="outline" className="rounded-full">Open dashboard</Button></Link>}<Button type="button" variant="ghost" onClick={handleSignOut} className="sm:ml-auto">Sign out</Button></div>
        </form>
        <div className="border-t border-red-100 bg-fuchsia-50/50 p-6"><h3 className="font-bold text-red-700">Danger zone</h3><p className="mt-1 text-sm text-red-700/70">Permanently remove this Auth user and their profile.</p><Button type="button" variant="destructive" disabled={deleting} onClick={deleteAccount} className="mt-4 rounded-full">{deleting ? 'Deleting...' : 'Delete account'}</Button></div>
      </div>
    </div>
  </MainLayout>;
}
