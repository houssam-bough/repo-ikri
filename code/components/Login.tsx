import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useLanguage } from '../hooks/useLanguage';

const Login: React.FC = () => {
    const [email, setEmail] = useState('farmer1@ikri.com');
    const [password, setPassword] = useState('password');
    const { login } = useAuth();
    const { t } = useLanguage();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await login(email, password);
        } catch (error) {
            console.error(error);
            alert(t('login.invalidCredentials'));
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <h2 className="text-2xl font-bold text-center text-slate-800">{t('login.title')}</h2>
            <div>
                <label htmlFor="login-email" className="block text-sm font-medium text-slate-700">
                    {t('login.emailLabel')}
                </label>
                <input
                    id="login-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="mt-1 block w-full px-3 py-2 bg-white text-slate-900 border border-slate-300 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                />
            </div>
            <div>
                {/* FIX: Removed invalid `value` prop from label. The label element does not have a `value` attribute. */}
                <label htmlFor="login-password" className="block text-sm font-medium text-slate-700">
                    {t('login.passwordLabel')}
                </label>
                <input
                    id="login-password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="mt-1 block w-full px-3 py-2 bg-white text-slate-900 border border-slate-300 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                />
            </div>
             <div className="text-xs text-slate-500">
                <p>{t('login.hint')}</p>
             </div>
            <button
                type="submit"
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-all duration-300"
            >
                {t('login.signInButton')}
            </button>
        </form>
    );
};

export default Login;
