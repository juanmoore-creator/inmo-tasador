import React, { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase/config';
import ThemeToggle from '../components/ThemeToggle';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            await signInWithEmailAndPassword(auth, email, password);
        } catch (err: any) {
            setError(err.message || 'Authentication failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-100 dark:bg-slate-950 flex items-center justify-center p-4 transition-colors duration-300 relative">
            <div className="absolute top-4 right-4 sm:top-6 sm:right-6">
                <ThemeToggle />
            </div>
            <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-xl dark:shadow-2xl border border-slate-200 dark:border-white/10 p-8 relative z-10">
                <h2 className="text-3xl font-bold text-slate-800 dark:text-white mb-2 text-center text-balance">
                    Iniciar Sesión
                </h2>
                <p className="text-slate-500 dark:text-slate-400 text-center mb-8">
                    InmoTasador
                </p>

                {error && (
                    <div className="bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 p-3 rounded-xl text-sm mb-6 border border-red-100 dark:border-red-900/50">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Email</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-950 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors focus-visible:outline-none"
                            placeholder="tu@email.com"
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Contraseña</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-950 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors focus-visible:outline-none"
                            placeholder="••••••••"
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/40 active:scale-[0.98] transition-all duration-200 disabled:opacity-50"
                    >
                        {loading ? 'Cargando...' : 'Ingresar'}
                    </button>
                </form>

            </div>
        </div>
    );
}
