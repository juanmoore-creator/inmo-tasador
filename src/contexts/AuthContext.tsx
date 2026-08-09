import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import type { User } from 'firebase/auth';
import { auth } from '../firebase/config';
import { getUserProfile, ensureUserProfile } from '../services/userService';
import type { UserRole } from '../types';

interface AuthContextType {
    user: User | null;
    role: UserRole | null;
    isAdmin: boolean;
    loading: boolean;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    role: null,
    isAdmin: false,
    loading: true,
    logout: async () => { },
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [role, setRole] = useState<UserRole | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            setUser(firebaseUser);

            if (firebaseUser) {
                try {
                    // Intentar leer el perfil; si no existe, crearlo como 'user'
                    let profile = await getUserProfile(firebaseUser.uid);
                    if (!profile) {
                        await ensureUserProfile(
                            firebaseUser.uid,
                            firebaseUser.email ?? '',
                            'user'
                        );
                        profile = await getUserProfile(firebaseUser.uid);
                    }
                    setRole(profile?.role ?? 'user');
                } catch (err) {
                    console.error('Error loading user role:', err);
                    setRole('user');
                }
            } else {
                setRole(null);
            }

            setLoading(false);
        });

        return unsubscribe;
    }, []);

    const logout = async () => {
        try {
            await signOut(auth);
            setRole(null);
        } catch (error) {
            console.error("Error signing out", error);
        }
    };

    const isAdmin = role === 'admin';

    return (
        <AuthContext.Provider value={{ user, role, isAdmin, loading, logout }}>
            {!loading && children}
        </AuthContext.Provider>
    );
};
