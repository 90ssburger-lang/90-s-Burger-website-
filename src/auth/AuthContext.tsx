import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { AuthError, Session, User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import type { AppRole, Profile } from '@/types';

interface AuthResult { error: string | null; role?: AppRole }
interface SignUpResult extends AuthResult { requiresEmailVerification: boolean }
interface AuthContextValue {
  user: User | null; session: Session | null; profile: Profile | null; loading: boolean;
  roles: AppRole[]; isAdmin: boolean; isStaff: boolean;
  signUp: (email:string,password:string,fullName?:string)=>Promise<SignUpResult>;
  signIn: (email:string,password:string)=>Promise<AuthResult>;
  signInWithGoogle: (returnTo?:string)=>Promise<AuthResult>;
  resetPassword: (email:string)=>Promise<AuthResult>;
  signOut: ()=>Promise<AuthResult>; refreshProfile: ()=>Promise<Profile|null>;
}
const AuthContext=createContext<AuthContextValue|undefined>(undefined);

const friendly=(error:AuthError|null):string|null=>{
 if(!error)return null; const message=error.message.toLowerCase();
 if(message.includes('invalid login credentials'))return 'Invalid email or password. Use “Forgot password?” to set a new password.';
 if(message.includes('email not confirmed'))return 'Your email is not confirmed. Confirm it in Supabase Authentication or use the verification email.';
 if(message.includes('already registered'))return 'An account with this email already exists.';
 if(message.includes('rate limit')||message.includes('too many'))return 'Too many attempts. Wait a few minutes and try again.';
 if(message.includes('network')||message.includes('fetch'))return 'Could not reach the authentication server. Check your connection.';
 return error.message;
};

export function AuthProvider({children}:{children:ReactNode}){
 const [user,setUser]=useState<User|null>(null);const [session,setSession]=useState<Session|null>(null);const [profile,setProfile]=useState<Profile|null>(null);const [loading,setLoading]=useState(true);
 const loadProfile=useCallback(async(userId:string)=>{const {data,error}=await supabase.from('profiles').select('*').eq('id',userId).maybeSingle();if(error){console.error('Profile lookup failed',error);return null}return data as Profile|null},[]);
 const applySession=useCallback(async(next:Session|null)=>{setSession(next);setUser(next?.user??null);if(next?.user)setProfile(await loadProfile(next.user.id));else setProfile(null);setLoading(false)},[loadProfile]);
 useEffect(()=>{let active=true;supabase.auth.getSession().then(({data})=>{if(active)void applySession(data.session)}).catch(()=>{if(active)void applySession(null)});const {data:{subscription}}=supabase.auth.onAuthStateChange((_event,next)=>{if(active)setTimeout(()=>void applySession(next),0)});return()=>{active=false;subscription.unsubscribe()}},[applySession]);
 const refreshProfile=useCallback(async()=>{if(!user)return null;const next=await loadProfile(user.id);setProfile(next);return next},[user,loadProfile]);
 const signIn=useCallback(async(email:string,password:string)=>{const {data,error}=await supabase.auth.signInWithPassword({email:email.trim().toLowerCase(),password});if(error)return{error:friendly(error)};const nextProfile=data.user?await loadProfile(data.user.id):null;setSession(data.session);setUser(data.user);setProfile(nextProfile);return{error:null,role:nextProfile?.role??'customer'}},[loadProfile]);
 const signInWithGoogle=useCallback(async(returnTo='/profile')=>{try{window.sessionStorage.setItem('oauth_return_to',returnTo);const {error}=await supabase.auth.signInWithOAuth({provider:'google',options:{redirectTo:`${window.location.origin}/login`,queryParams:{access_type:'offline',prompt:'select_account'}}});return{error:error?friendly(error):null}}catch(error){return{error:error instanceof Error?error.message:'Could not start Google sign in.'}}},[]);
 const signUp=useCallback(async(email:string,password:string,fullName='')=>{const {data,error}=await supabase.auth.signUp({email:email.trim().toLowerCase(),password,options:{data:{full_name:fullName},emailRedirectTo:window.location.origin}});return{error:friendly(error),requiresEmailVerification:Boolean(data.user&&!data.session)}},[]);
 const resetPassword=useCallback(async(email:string)=>{const {error}=await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(),{redirectTo:`${window.location.origin}/login?reset=1`});return{error:friendly(error)}},[]);
 const signOut=useCallback(async()=>{const {error}=await supabase.auth.signOut();if(!error){setUser(null);setSession(null);setProfile(null)}return{error:friendly(error)}},[]);
 const role=profile?.role??'customer';const value=useMemo(()=>({user,session,profile,loading,roles:user?[role]:[],isAdmin:role==='admin',isStaff:role==='admin'||role==='manager',signUp,signIn,signInWithGoogle,resetPassword,signOut,refreshProfile}),[user,session,profile,loading,role,signUp,signIn,signInWithGoogle,resetPassword,signOut,refreshProfile]);
 return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
export function useAuth(){const context=useContext(AuthContext);if(!context)throw new Error('useAuth must be used within AuthProvider');return context}
