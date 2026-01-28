'use client';
import { useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function AuthOverlay({ onLoginSuccess }: { onLoginSuccess: () => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false); // 切换 注册/登录
  const [msg, setMsg] = useState('');

  const handleAuth = async () => {
    setLoading(true);
    setMsg('');
    try {
      if (isSignUp) {
        // 注册
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        setMsg('注册成功！请检查邮箱验证链接 (或在 Supabase 关闭验证)');
        setIsSignUp(false); // 注册完切换回登录态
      } else {
        // 登录
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        onLoginSuccess();
      }
    } catch (e: any) {
      let errorMsg = e.message;
      if (errorMsg.includes('Email not confirmed')) errorMsg = '登录失败：请先去邮箱点击验证链接，或者在 Supabase 设置里关闭 Confirm Email。';
      if (errorMsg.includes('Invalid login credentials')) errorMsg = '账号或密码错误';
      if (errorMsg.includes('User already registered')) errorMsg = '该邮箱已被注册，请直接登录';
      
      setMsg(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-[60] flex items-center justify-center p-4">
      <div className="bg-white rounded-[2rem] p-8 w-full max-w-sm shadow-2xl relative border border-slate-100">
        <h2 className="text-2xl font-black mb-6 text-slate-900 tracking-tight text-center">{isSignUp ? 'Join Us' : 'Welcome Back'}</h2>
        
        <div className="space-y-4">
            <input 
            className="w-full px-4 py-3.5 border border-slate-200 rounded-2xl bg-slate-50 text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all placeholder:text-slate-400" 
            placeholder="Email Address" 
            value={email} onChange={e => setEmail(e.target.value)}
            />
            <input 
            className="w-full px-4 py-3.5 border border-slate-200 rounded-2xl bg-slate-50 text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all placeholder:text-slate-400" 
            type="password" placeholder="Password (6+ chars)" 
            value={password} onChange={e => setPassword(e.target.value)}
            />
        </div>

        <button 
          onClick={handleAuth} 
          disabled={loading}
          className="w-full bg-indigo-600 text-white font-black py-4 rounded-2xl disabled:opacity-50 hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 mt-6 active:scale-[0.98]"
        >
          {loading ? 'Processing...' : (isSignUp ? 'Create Account' : 'Sign In')}
        </button>

        {msg && <div className="text-red-500 text-sm mt-4 text-center font-medium bg-red-50 p-3 rounded-xl border border-red-100">{msg}</div>}

        <div className="mt-8 text-center text-xs text-slate-400 font-bold uppercase tracking-widest">
          <span onClick={() => setIsSignUp(!isSignUp)} className="cursor-pointer hover:text-indigo-600 transition-colors">
            {isSignUp ? 'Already have an account?' : 'No account yet?'}
          </span>
        </div>
      </div>
    </div>
  );
}
