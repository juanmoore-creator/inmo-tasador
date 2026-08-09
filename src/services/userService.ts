import {
    collection,
    doc,
    getDoc,
    getDocs,
    setDoc,
    orderBy,
    query,
} from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { db, functions } from '../firebase/config';
import type { AppUser, UserRole } from '../types';

const USERS_COLLECTION = 'users';

// ── Leer el perfil de un usuario ──────────────────────────────────────────────
export const getUserProfile = async (uid: string): Promise<AppUser | null> => {
    try {
        const docRef = doc(db, USERS_COLLECTION, uid);
        const snap = await getDoc(docRef);
        if (!snap.exists()) return null;
        return { uid: snap.id, ...snap.data() } as AppUser;
    } catch (error) {
        console.error('Error fetching user profile:', error);
        return null;
    }
};

// ── Crear o actualizar el perfil básico de un usuario (al registrarse) ────────
// Self-service signup: creates a personal tenant with default InmoTasador branding.
export const ensureUserProfile = async (
    uid: string,
    email: string,
    role: UserRole = 'user'
): Promise<void> => {
    const docRef = doc(db, USERS_COLLECTION, uid);
    const snap = await getDoc(docRef);
    if (!snap.exists()) {
        const tenantId = `tenant_${uid}`;
        const tenantRef = doc(db, 'tenants', tenantId);

        // 1. Create user profile linked to their tenant FIRST
        await setDoc(docRef, {
            email,
            role,
            tenantId,
            tenantRole: 'owner',
            createdAt: new Date().toISOString(),
            disabled: false,
        });

        // 2. Create personal tenant configuration for this user
        await setDoc(tenantRef, {
            branding: {
                companyName: 'InmoTasador',
                companyLegalName: '',
                logoUrl: '',
                logoDarkUrl: '',
                logoLightUrl: '',
                colors: {
                    primary: '#3F11B2',
                    primaryDark: '#2D0C80',
                    primaryLight: '#5A2ED9',
                    accent: '#C5A059'
                }
            },
            institutional: {
                holderName: '',
                professionalTitle: '',
                registrationBody: '',
                registrationNumber: '',
                phone: '',
                email: email,
                address: '',
                city: '',
                website: ''
            },
            settings: {
                defaultCurrency: 'USD',
                locale: 'es-AR',
                timezone: 'America/Buenos_Aires'
            },
            plan: 'free',
            status: 'active',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        });
    }
};

// ── Obener todos los usuarios (solo admin) ────────────────────────────────────
export const getAllUsers = async (): Promise<AppUser[]> => {
    try {
        const q = query(
            collection(db, USERS_COLLECTION),
            orderBy('createdAt', 'desc')
        );
        const snap = await getDocs(q);
        return snap.docs.map(d => ({ uid: d.id, ...d.data() } as AppUser));
    } catch (error) {
        console.error('Error fetching all users:', error);
        throw error;
    }
};

// ── Crear un usuario nuevo via Cloud Function (admin only) ────────────────────
export interface CreateUserPayload {
    email: string;
    password: string;
    displayName?: string;
    role: UserRole;
}

export const createUserViaFunction = async (
    payload: CreateUserPayload
): Promise<{ uid: string; email: string }> => {
    const fn = httpsCallable<CreateUserPayload, { uid: string; email: string }>(
        functions,
        'createUser'
    );
    const result = await fn(payload);
    return result.data;
};
