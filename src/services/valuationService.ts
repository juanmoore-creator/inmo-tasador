import { collection, addDoc, getDocs, query, where, orderBy, doc, deleteDoc, setDoc, onSnapshot, getDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import type { SavedValuation } from '../types';

const VALUATIONS_COLLECTION = 'valuations';

// IDs generados localmente antes del primer guardado (ej: "val-1234567890")
const isLocalId = (id: string) => id.startsWith('val-');

export const saveValuation = async (userId: string, tenantId: string, valuation: SavedValuation): Promise<string> => {
    try {
        // Si ya tiene un ID real de Firestore, actualizar el documento existente
        if (valuation.id && !isLocalId(valuation.id)) {
            const { id, ...valuationWithoutId } = valuation;
            const docRef = doc(db, VALUATIONS_COLLECTION, id);
            await setDoc(docRef, {
                ...valuationWithoutId,
                userId,
                tenantId,
                updatedAt: new Date().toISOString()
            }, { merge: true });
            return id;
        }

        // Primera vez: crear un documento nuevo
        const { id, ...valuationWithoutId } = valuation;
        const docRef = await addDoc(collection(db, VALUATIONS_COLLECTION), {
            ...valuationWithoutId,
            userId,
            tenantId,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        });
        return docRef.id;
    } catch (error) {
        console.error("Error saving valuation:", error);
        throw error;
    }
};

export const getUserValuations = async (userId: string, tenantId: string): Promise<SavedValuation[]> => {
    try {
        const q = query(
            collection(db, VALUATIONS_COLLECTION),
            where('userId', '==', userId),
            where('tenantId', '==', tenantId),
            orderBy('createdAt', 'desc')
        );

        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({
            ...doc.data(),
            id: doc.id
        } as SavedValuation));
    } catch (error) {
        console.error("Error fetching valuations:", error);
        throw error;
    }
};

export const deleteValuation = async (valuationId: string): Promise<void> => {
    try {
        await deleteDoc(doc(db, VALUATIONS_COLLECTION, valuationId));
    } catch (error) {
        console.error("Error deleting valuation:", error);
        throw error;
    }
};

// ── Admin: obtener TODAS las tasaciones de la plataforma ──────────────────────
export const getAllValuations = async (): Promise<SavedValuation[]> => {
    try {
        const q = query(
            collection(db, VALUATIONS_COLLECTION),
            orderBy('createdAt', 'desc')
        );
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({
            ...doc.data(),
            id: doc.id
        } as SavedValuation));
    } catch (error) {
        console.error("Error fetching all valuations:", error);
        throw error;
    }
};

// ── Sincronización en tiempo real para Extensión SrapIA ─────────────────────
export const subscribeUserValuations = (
    userId: string,
    tenantId: string,
    callback: (valuations: SavedValuation[]) => void
) => {
    const q = query(
        collection(db, VALUATIONS_COLLECTION),
        where('userId', '==', userId),
        where('tenantId', '==', tenantId),
        orderBy('createdAt', 'desc')
    );

    return onSnapshot(q, (snapshot) => {
        const valuations = snapshot.docs.map(doc => ({
            ...doc.data(),
            id: doc.id
        } as SavedValuation));
        callback(valuations);
    }, (error) => {
        console.error("Error subscribing to valuations:", error);
    });
};

export const getValuationById = async (id: string, tenantId: string): Promise<SavedValuation | null> => {
  try {
    const docRef = doc(db, VALUATIONS_COLLECTION, id);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      const data = docSnap.data() as Omit<SavedValuation, 'id'>;
      if (data.tenantId !== tenantId) {
        throw new Error('Unauthorized');
      }
      return { id: docSnap.id, ...data };
    }
    return null;
  } catch (error) {
    console.error('Error al obtener tasación por ID:', error);
    throw error;
  }
};
