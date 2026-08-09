import { doc, getDoc, setDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../firebase/config';
import type { TenantConfig } from '../types/tenant';

const TENANTS_COLLECTION = 'tenants';

export const getTenant = async (tenantId: string): Promise<TenantConfig | null> => {
    try {
        const docRef = doc(db, TENANTS_COLLECTION, tenantId);
        const snap = await getDoc(docRef);
        if (!snap.exists()) return null;
        return { id: snap.id, ...snap.data() } as TenantConfig;
    } catch (error) {
        console.error('Error fetching tenant:', error);
        return null;
    }
};

export const createTenant = async (tenantId: string, tenantData: Omit<TenantConfig, 'id'>): Promise<void> => {
    try {
        const docRef = doc(db, TENANTS_COLLECTION, tenantId);
        await setDoc(docRef, {
            ...tenantData,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        });
    } catch (error) {
        console.error('Error creating tenant:', error);
        throw error;
    }
};

export const updateTenant = async (tenantId: string, updates: Partial<TenantConfig>): Promise<void> => {
    try {
        const docRef = doc(db, TENANTS_COLLECTION, tenantId);
        await setDoc(docRef, {
            ...updates,
            updatedAt: new Date().toISOString()
        }, { merge: true });
    } catch (error) {
        console.error('Error updating tenant:', error);
        throw error;
    }
};

export const uploadTenantLogo = async (tenantId: string, file: File): Promise<string> => {
    try {
        const fileExt = file.name.split('.').pop();
        const storageRef = ref(storage, `tenants/${tenantId}/logo_${Date.now()}.${fileExt}`);
        const snapshot = await uploadBytes(storageRef, file);
        const downloadURL = await getDownloadURL(snapshot.ref);
        return downloadURL;
    } catch (error) {
        console.error('Error uploading tenant logo:', error);
        throw error;
    }
};
