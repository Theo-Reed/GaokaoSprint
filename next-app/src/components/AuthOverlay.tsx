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
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl relative">
        <h2 className="text-xl font-bold mb-4 text-gray-800">{isSignUp ? '注册账号' : '登录保存进度'}</h2>
        
        <input 
          className="w-full p-3 mb-3 border rounded-lg bg-gray-50 text-gray-900" 
          placeholder="邮箱" 
          value={email} onChange={e => setEmail(e.target.value)}
        />
        <input 
          className="w-full p-3 mb-4 border rounded-lg bg-gray-50 text-gray-900" 
          type="password" placeholder="密码 (至少6位)" 
          value={password} onChange={e => setPassword(e.target.value)}
        />

        <button 
          onClick={handleAuth} 
          disabled={loading}
          className="w-full bg-blue-600 text-white font-bold py-3 rounded-xl disabled:opacity-50 hover:bg-blue-700 transition-colors"
        >
          {loading ? '处理中...' : (isSignUp ? '注册' : '登录')}
        </button>

        {msg && <div className="text-red-500 text-sm mt-3 text-center">{msg}</div>}

        <div className="mt-4 text-center text-sm text-gray-500">
          <span onClick={() => setIsSignUp(!isSignUp)} className="underline cursor-pointer hover:text-blue-600">
            {isSignUp ? '已有账号？去登录' : '没有账号？去注册'}
          </span>
        </div>
      </div>
    </div>
  );
}
