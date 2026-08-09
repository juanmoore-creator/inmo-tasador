import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getAllUsers, createUserViaFunction } from '../services/userService';
import {
    getAnnotations,
    createAnnotation,
    updateAnnotation,
    deleteAnnotation,
} from '../services/annotationService';
import { getAllValuations } from '../services/valuationService';
import type { AppUser, Annotation, SavedValuation } from '../types';
import {
    Users, FileText, BookOpen, Plus, Trash2, Edit2, Check,
    Loader2, AlertCircle, Shield, Eye, ChevronDown,
} from 'lucide-react';

// ─────────────────────────────────────────────────────────────
// Shared styles
// ─────────────────────────────────────────────────────────────
const inputClass =
    'w-full bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 rounded-lg px-3 py-2.5 text-sm text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 dark:focus:border-indigo-400 outline-none transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500';

// ─────────────────────────────────────────────────────────────
// Sub-panel: Gestión de Usuarios
// ─────────────────────────────────────────────────────────────
function UsersPanel() {
    const { user: currentUser } = useAuth();
    const [users, setUsers] = useState<AppUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showForm, setShowForm] = useState(false);

    // New user form
    const [newEmail, setNewEmail] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [newName, setNewName] = useState('');
    const [creating, setCreating] = useState(false);
    const [createError, setCreateError] = useState('');
    const [createSuccess, setCreateSuccess] = useState('');

    useEffect(() => {
        getAllUsers()
            .then(setUsers)
            .catch(() => setError('Error al cargar usuarios.'))
            .finally(() => setLoading(false));
    }, []);

    const handleCreateUser = async (e: React.FormEvent) => {
        e.preventDefault();
        setCreating(true);
        setCreateError('');
        setCreateSuccess('');
        try {
            const result = await createUserViaFunction({
                email: newEmail,
                password: newPassword,
                displayName: newName,
                role: 'user',
            });
            setCreateSuccess(`Usuario creado: ${result.email}`);
            setNewEmail('');
            setNewPassword('');
            setNewName('');
            setShowForm(false);
            // Reload list
            const updated = await getAllUsers();
            setUsers(updated);
        } catch (err: any) {
            setCreateError(err?.message ?? 'Error al crear el usuario.');
        } finally {
            setCreating(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Header row */}
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">Usuarios Registrados</h3>
                    <p className="text-xs text-slate-400 mt-0.5">{users.length} usuario{users.length !== 1 ? 's' : ''} en la plataforma</p>
                </div>
                <button
                    onClick={() => { setShowForm(!showForm); setCreateError(''); setCreateSuccess(''); }}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl transition-all shadow-sm hover:shadow-md active:scale-95"
                >
                    <Plus className="w-4 h-4" />
                    Nuevo usuario
                </button>
            </div>

            {createSuccess && (
                <div className="flex items-center gap-2 p-3 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-900/30 rounded-xl text-emerald-700 dark:text-emerald-400 text-sm">
                    <Check className="w-4 h-4 shrink-0" />
                    {createSuccess}
                </div>
            )}

            {/* Create user form */}
            {showForm && (
                <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl p-5 animate-in slide-in-from-top-2 duration-200">
                    <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-4">Crear nuevo usuario</h4>
                    <form onSubmit={handleCreateUser} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 block mb-1">Nombre</label>
                                <input
                                    type="text"
                                    value={newName}
                                    onChange={e => setNewName(e.target.value)}
                                    className={inputClass}
                                    placeholder="Nombre completo"
                                />
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 block mb-1">Email *</label>
                                <input
                                    type="email"
                                    value={newEmail}
                                    onChange={e => setNewEmail(e.target.value)}
                                    className={inputClass}
                                    placeholder="correo@ejemplo.com"
                                    required
                                />
                            </div>
                            <div className="md:col-span-2">
                                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 block mb-1">Contraseña *</label>
                                <input
                                    type="password"
                                    value={newPassword}
                                    onChange={e => setNewPassword(e.target.value)}
                                    className={inputClass}
                                    placeholder="Mínimo 6 caracteres"
                                    required
                                    minLength={6}
                                />
                            </div>
                        </div>

                        {createError && (
                            <div className="flex items-start gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30 rounded-lg text-red-600 dark:text-red-400 text-sm">
                                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                                {createError}
                            </div>
                        )}

                        <div className="flex gap-3 justify-end">
                            <button
                                type="button"
                                onClick={() => setShowForm(false)}
                                className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-all"
                            >
                                Cancelar
                            </button>
                            <button
                                type="submit"
                                disabled={creating}
                                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg transition-all disabled:opacity-60 flex items-center gap-2"
                            >
                                {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                                {creating ? 'Creando...' : 'Crear usuario'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Users table */}
            {loading ? (
                <div className="flex justify-center py-10"><Loader2 className="w-7 h-7 animate-spin text-indigo-500" /></div>
            ) : error ? (
                <div className="flex items-center gap-2 p-4 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30 rounded-xl text-red-600 dark:text-red-400 text-sm">
                    <AlertCircle className="w-4 h-4 shrink-0" />{error}
                </div>
            ) : (
                <div className="overflow-x-auto -mx-4 md:mx-0">
                    <div className="min-w-[500px] md:min-w-0 overflow-hidden border border-slate-200 dark:border-slate-700 rounded-xl">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="bg-slate-50 dark:bg-slate-800/50">
                                    <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Usuario</th>
                                    <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider hidden md:table-cell">Creado</th>
                                    <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Rol</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {users.map(u => (
                                    <tr key={u.uid} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-xs font-bold text-indigo-600 dark:text-indigo-400">
                                                    {(u.displayName || u.email).charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <p className="font-medium text-slate-800 dark:text-slate-200">{u.displayName || '—'}</p>
                                                    {/* Para el usuario actual, siempre usar el email de Firebase Auth (fuente de verdad) */}
                                                    <p className="text-xs text-slate-400">
                                                        {u.uid === currentUser?.uid ? (currentUser.email ?? u.email) : u.email}
                                                    </p>
                                                </div>
                                            </div>
                                            {u.uid === currentUser?.uid && (
                                                <span className="ml-11 text-[10px] text-indigo-500 font-semibold">(tú)</span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-slate-400 hidden md:table-cell">
                                            {u.createdAt ? new Date(u.createdAt).toLocaleDateString('es-AR', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full ${
                                                u.role === 'admin'
                                                    ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400'
                                                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                                            }`}>
                                                {u.role === 'admin' && <Shield className="w-3 h-3" />}
                                                {u.role}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}

// ─────────────────────────────────────────────────────────────
// Sub-panel: Anotaciones de Ayuda
// ─────────────────────────────────────────────────────────────
function AnnotationsPanel() {
    const { user } = useAuth();
    const [annotations, setAnnotations] = useState<Annotation[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // New annotation form
    const [showForm, setShowForm] = useState(false);
    const [formTitle, setFormTitle] = useState('');
    const [formContent, setFormContent] = useState('');
    const [saving, setSaving] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);

    // Delete confirm
    const [pendingDelete, setPendingDelete] = useState<string | null>(null);
    const [deleting, setDeleting] = useState(false);

    useEffect(() => {
        load();
    }, []);

    const load = () => {
        setLoading(true);
        getAnnotations()
            .then(setAnnotations)
            .catch(() => setError('Error al cargar anotaciones.'))
            .finally(() => setLoading(false));
    };

    const openCreate = () => {
        setEditingId(null);
        setFormTitle('');
        setFormContent('');
        setShowForm(true);
    };

    const openEdit = (ann: Annotation) => {
        setEditingId(ann.id);
        setFormTitle(ann.title);
        setFormContent(ann.content);
        setShowForm(true);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;
        setSaving(true);
        try {
            if (editingId) {
                await updateAnnotation(editingId, formTitle, formContent);
            } else {
                await createAnnotation(formTitle, formContent, user.uid);
            }
            setShowForm(false);
            load();
        } catch {
            setError('Error al guardar la anotación.');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!pendingDelete) return;
        setDeleting(true);
        try {
            await deleteAnnotation(pendingDelete);
            setAnnotations(prev => prev.filter(a => a.id !== pendingDelete));
            setPendingDelete(null);
        } catch {
            setError('Error al eliminar.');
        } finally {
            setDeleting(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">Anotaciones de Ayuda</h3>
                    <p className="text-xs text-slate-400 mt-0.5">Visible para todos los usuarios desde el botón "?"</p>
                </div>
                <button
                    onClick={openCreate}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl transition-all shadow-sm hover:shadow-md active:scale-95"
                >
                    <Plus className="w-4 h-4" />
                    Nueva nota
                </button>
            </div>

            {error && (
                <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30 rounded-xl text-red-600 dark:text-red-400 text-sm">
                    <AlertCircle className="w-4 h-4 shrink-0" />{error}
                </div>
            )}

            {/* Form */}
            {showForm && (
                <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl p-5 animate-in slide-in-from-top-2 duration-200">
                    <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-4">
                        {editingId ? 'Editar anotación' : 'Nueva anotación'}
                    </h4>
                    <form onSubmit={handleSave} className="space-y-4">
                        <div>
                            <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 block mb-1">Título *</label>
                            <input
                                type="text"
                                value={formTitle}
                                onChange={e => setFormTitle(e.target.value)}
                                className={inputClass}
                                placeholder="Ej: Criterio de homogeneización"
                                required
                            />
                        </div>
                        <div>
                            <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 block mb-1">Contenido *</label>
                            <textarea
                                value={formContent}
                                onChange={e => setFormContent(e.target.value)}
                                className={`${inputClass} resize-y min-h-[120px]`}
                                placeholder="Escribe la nota de ayuda..."
                                required
                            />
                        </div>
                        <div className="flex gap-3 justify-end">
                            <button
                                type="button"
                                onClick={() => setShowForm(false)}
                                className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-all"
                            >
                                Cancelar
                            </button>
                            <button
                                type="submit"
                                disabled={saving}
                                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg transition-all disabled:opacity-60 flex items-center gap-2"
                            >
                                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                                {saving ? 'Guardando...' : 'Guardar'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* List */}
            {loading ? (
                <div className="flex justify-center py-10"><Loader2 className="w-7 h-7 animate-spin text-indigo-500" /></div>
            ) : annotations.length === 0 ? (
                <div className="text-center py-10 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl">
                    <BookOpen className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                    <p className="text-slate-400 text-sm">No hay anotaciones aún. Crea la primera.</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {annotations.map(ann => (
                        <div key={ann.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-4">
                            <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0 flex-1">
                                    <h4 className="font-semibold text-slate-800 dark:text-slate-200 text-sm">{ann.title}</h4>
                                    <p className="text-xs text-slate-400 mt-0.5 line-clamp-2 whitespace-pre-wrap">{ann.content}</p>
                                </div>
                                <div className="flex items-center gap-1 shrink-0">
                                    <button
                                        onClick={() => openEdit(ann)}
                                        className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all"
                                        title="Editar"
                                    >
                                        <Edit2 className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                        onClick={() => setPendingDelete(ann.id)}
                                        className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-500 transition-all"
                                        title="Eliminar"
                                    >
                                        <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            </div>
                            <p className="text-[10px] text-slate-400 mt-2">
                                Actualizado: {new Date(ann.updatedAt).toLocaleDateString('es-AR', { day: 'numeric', month: 'short', year: 'numeric' })}
                            </p>
                        </div>
                    ))}
                </div>
            )}

            {/* Delete confirm */}
            {pendingDelete && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => !deleting && setPendingDelete(null)} />
                    <div className="relative bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-sm p-6 animate-in fade-in zoom-in-95 duration-200">
                        <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2 text-center">¿Eliminar anotación?</h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400 text-center mb-6">Esta acción no se puede deshacer.</p>
                        <div className="flex gap-3">
                            <button onClick={() => setPendingDelete(null)} disabled={deleting} className="flex-1 py-2.5 px-4 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-all disabled:opacity-50">
                                Cancelar
                            </button>
                            <button onClick={handleDelete} disabled={deleting} className="flex-1 py-2.5 px-4 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-semibold transition-all disabled:opacity-70 flex items-center justify-center gap-2">
                                {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                                {deleting ? 'Eliminando...' : 'Eliminar'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// ─────────────────────────────────────────────────────────────
// Sub-panel: Todas las Tasaciones
// ─────────────────────────────────────────────────────────────
function AllValuationsPanel({ onSelectValuation }: { onSelectValuation: (v: SavedValuation) => void }) {
    const [valuations, setValuations] = useState<SavedValuation[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [expandedId, setExpandedId] = useState<string | null>(null);

    useEffect(() => {
        getAllValuations()
            .then(setValuations)
            .catch(() => setError('Error al cargar las tasaciones.'))
            .finally(() => setLoading(false));
    }, []);

    if (loading) return <div className="flex justify-center py-10"><Loader2 className="w-7 h-7 animate-spin text-indigo-500" /></div>;
    if (error) return (
        <div className="flex items-center gap-2 p-4 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30 rounded-xl text-red-600 dark:text-red-400 text-sm">
            <AlertCircle className="w-4 h-4 shrink-0" />{error}
        </div>
    );
    if (valuations.length === 0) return (
        <div className="text-center py-10 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl">
            <FileText className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
            <p className="text-slate-400 text-sm">No hay tasaciones en la plataforma.</p>
        </div>
    );

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">Todas las Tasaciones</h3>
                    <p className="text-xs text-slate-400 mt-0.5">{valuations.length} tasación{valuations.length !== 1 ? 'es' : ''} en la plataforma</p>
                </div>
                {/* Temporary Migration Button */}
                <button
                    onClick={async () => {
                        if (!confirm('¿Migrar tasaciones antiguas a tenantId="default"?')) return;
                        setLoading(true);
                        try {
                            const { collection, getDocs, updateDoc, doc } = await import('firebase/firestore');
                            const { db } = await import('../firebase/config');
                            const snap = await getDocs(collection(db, 'valuations'));
                            let count = 0;
                            for (const d of snap.docs) {
                                const data = d.data();
                                if (!data.tenantId) {
                                    await updateDoc(doc(db, 'valuations', d.id), { tenantId: 'default' });
                                    count++;
                                }
                            }
                            alert(`Migración completada. ${count} tasaciones actualizadas.`);
                            const updated = await getAllValuations();
                            setValuations(updated);
                        } catch (err: any) {
                            alert('Error en migración: ' + err.message);
                        } finally {
                            setLoading(false);
                        }
                    }}
                    className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold rounded-xl"
                >
                    Migrar Tenant Default
                </button>
            </div>

            <div className="space-y-3">
                {valuations.map(v => {
                    const isExpanded = expandedId === v.id;
                    return (
                        <div key={v.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
                            <div
                                className="flex items-center justify-between p-4 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                                onClick={() => setExpandedId(isExpanded ? null : v.id)}
                            >
                                <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                                        <h4 className="font-semibold text-slate-800 dark:text-slate-200 text-sm">
                                            {v.clientName || 'Sin cliente'}
                                        </h4>
                                        <span className="text-[10px] font-semibold bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-900/40 rounded-full px-2 py-0.5 truncate max-w-[160px]">
                                            👤 {(v as any).userId}
                                        </span>
                                    </div>
                                    <p className="text-xs text-slate-400 line-clamp-1">{v.target?.address || '—'}</p>
                                </div>
                                <div className="flex items-center gap-3 ml-4 shrink-0">
                                    <div className="text-right">
                                        <p className="text-xs text-slate-400">Valor</p>
                                        <p className="text-sm font-bold text-indigo-600 dark:text-indigo-400">
                                            {v.valuation?.market ? `U$S ${v.valuation.market.toLocaleString()}` : 'N/A'}
                                        </p>
                                    </div>
                                    <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                                </div>
                            </div>

                            {isExpanded && (
                                <div className="border-t border-slate-100 dark:border-slate-800 p-4 animate-in slide-in-from-top-1 duration-150 space-y-3">
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-xs">
                                        <div>
                                            <p className="text-slate-400 mb-0.5">Corredor</p>
                                            <p className="font-medium text-slate-700 dark:text-slate-300">{v.corredorName || '—'}</p>
                                        </div>
                                        <div>
                                            <p className="text-slate-400 mb-0.5">Comparables</p>
                                            <p className="font-medium text-slate-700 dark:text-slate-300">{v.comparables?.length ?? 0}</p>
                                        </div>
                                        <div>
                                            <p className="text-slate-400 mb-0.5">Fecha</p>
                                            <p className="font-medium text-slate-700 dark:text-slate-300">
                                                {v.date ? new Date(v.date).toLocaleDateString('es-AR') : '—'}
                                            </p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => onSelectValuation(v)}
                                        className="flex items-center gap-2 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors"
                                    >
                                        <Eye className="w-3.5 h-3.5" />
                                        Abrir en mis tasaciones
                                    </button>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────
// Main AdminPanel
// ─────────────────────────────────────────────────────────────
type AdminTab = 'users' | 'valuations' | 'annotations';

interface AdminPanelProps {
    onSelectValuation: (v: SavedValuation) => void;
}

export default function AdminPanel({ onSelectValuation }: AdminPanelProps) {
    const [activeTab, setActiveTab] = useState<AdminTab>('users');

    const tabs: { id: AdminTab; label: string; icon: React.ReactNode }[] = [
        { id: 'users', label: 'Usuarios', icon: <Users className="w-4 h-4" /> },
        { id: 'valuations', label: 'Tasaciones', icon: <FileText className="w-4 h-4" /> },
        { id: 'annotations', label: 'Notas de Ayuda', icon: <BookOpen className="w-4 h-4" /> },
    ];

    return (
        <div className="space-y-6">
            {/* Panel header */}
            <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 rounded-2xl p-6 text-white shadow-lg shadow-indigo-600/20">
                <div className="flex items-center gap-3 mb-1">
                    <Shield className="w-6 h-6 text-indigo-200" />
                    <h2 className="text-lg font-bold">Panel de Administración</h2>
                </div>
                <p className="text-indigo-200 text-sm">Gestión de usuarios, tasaciones y contenido de ayuda</p>
            </div>

            {/* Tabs */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                <div className="flex border-b border-slate-200 dark:border-slate-800">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-2 px-5 py-4 text-sm font-semibold transition-all flex-1 justify-center border-b-2 ${
                                activeTab === tab.id
                                    ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 bg-indigo-50/50 dark:bg-indigo-600/5'
                                    : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                            }`}
                        >
                            {tab.icon}
                            <span className="hidden sm:inline">{tab.label}</span>
                        </button>
                    ))}
                </div>

                <div className="p-6">
                    {activeTab === 'users' && <UsersPanel />}
                    {activeTab === 'valuations' && <AllValuationsPanel onSelectValuation={onSelectValuation} />}
                    {activeTab === 'annotations' && <AnnotationsPanel />}
                </div>
            </div>
        </div>
    );
}
