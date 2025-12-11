import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useLanguage } from '../hooks/useLanguage';
import { Button } from '@/components/ui/button'

interface LoginProps {
    onSwitchToRegister?: () => void;
}

const Login: React.FC<LoginProps> = ({ onSwitchToRegister }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const { login } = useAuth();
    const { t } = useLanguage();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await login(email, password);
        } catch (error) {
            console.error(error);
            if (error instanceof Error) {
                if (error.message === 'Account pending approval') {
                    alert(t('login.accountPendingApproval'));
                } else if (error.message === 'User not found') {
                    alert(t('login.userNotFound'));
                } else if (error.message === 'Invalid password') {
                    alert(t('login.invalidPassword'));
                } else {
                    alert(t('login.generalError'));
                }
            } else {
                alert(t('login.generalError'));
            }
        }
    };

    return (
        <div className="w-full flex justify-center">
            <div className="max-w-md w-full px-4 py-12">
                {/* Header Section */}
                <div className="text-center mb-8">
                    <h2 className="text-3xl font-bold text-slate-800 mb-2">{t('login.title')}</h2>
                    <p className="text-slate-600">Accédez à votre compte IKRI</p>
                </div>

                {/* Form Card */}
                <div className="bg-white rounded-2xl shadow-xl p-8 space-y-6 border border-slate-100">
                    <form onSubmit={handleSubmit} className="space-y-5">
                        {/* Email Input */}
                        <div>
                            <label htmlFor="login-email" className="block text-sm font-semibold text-slate-700 mb-2">
                                {t('login.emailLabel')}
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <svg className="h-5 w-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                                    </svg>
                                </div>
                                <input
                                    id="login-email"
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    placeholder="votre@email.com"
                                    className="block w-full pl-10 pr-3 py-3 bg-slate-50 text-slate-900 border border-slate-200 rounded-lg shadow-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200 sm:text-sm"
                                />
                            </div>
                        </div>

                        {/* Password Input */}
                        <div>
                            <label htmlFor="login-password" className="block text-sm font-semibold text-slate-700 mb-2">
                                {t('login.passwordLabel')}
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <svg className="h-5 w-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                    </svg>
                                </div>
                                <input
                                    id="login-password"
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    placeholder="••••••••"
                                    className="block w-full pl-10 pr-3 py-3 bg-slate-50 text-slate-900 border border-slate-200 rounded-lg shadow-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200 sm:text-sm"
                                />
                            </div>
                        </div>

                        {/* Submit Button */}
                        <Button
                            type="submit"
                            className="w-full py-3 px-4 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
                        >
                            {t('login.signInButton')}
                        </Button>
                    </form>

                    {/* Switch to Register */}
                    {onSwitchToRegister && (
                        <div className="mt-6 text-center">
                            <p className="text-sm text-slate-600">
                                Vous n'avez pas de compte ?{' '}
                                <button
                                    type="button"
                                    onClick={onSwitchToRegister}
                                    className="font-semibold text-emerald-600 hover:text-emerald-700 transition-colors duration-200"
                                >
                                    Inscrivez-vous
                                </button>
                            </p>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="mt-6 text-center">
                    <p className="text-sm text-slate-600">
                        Plateforme de location de matériel agricole
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Login;
