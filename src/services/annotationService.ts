import {
    collection,
    addDoc,
    getDocs,
    doc,
    updateDoc,
    deleteDoc,
    orderBy,
    query,
    serverTimestamp,
    Timestamp,
} from 'firebase/firestore';
import { db } from '../firebase/config';
import type { Annotation } from '../types';

const ANNOTATIONS_COLLECTION = 'annotations';

// ── Leer todas las anotaciones (todos los usuarios autenticados) ───────────────
export const getAnnotations = async (): Promise<Annotation[]> => {
    try {
        const q = query(
            collection(db, ANNOTATIONS_COLLECTION),
            orderBy('createdAt', 'asc')
        );
        const snap = await getDocs(q);
        return snap.docs.map(d => {
            const data = d.data();
            // Firestore puede devolver Timestamp o string
            const toISO = (v: unknown) =>
                v instanceof Timestamp ? v.toDate().toISOString() : (v as string) ?? '';
            return {
                id: d.id,
                title: data.title ?? '',
                content: data.content ?? '',
                createdAt: toISO(data.createdAt),
                updatedAt: toISO(data.updatedAt),
                createdBy: data.createdBy ?? '',
            } as Annotation;
        });
    } catch (error) {
        console.error('Error fetching annotations:', error);
        throw error;
    }
};

// ── Crear una anotación nueva (solo admin) ─────────────────────────────────────
export const createAnnotation = async (
    title: string,
    content: string,
    createdBy: string
): Promise<Annotation> => {
    const docRef = await addDoc(collection(db, ANNOTATIONS_COLLECTION), {
        title,
        content,
        createdBy,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
    });
    const now = new Date().toISOString();
    return { id: docRef.id, title, content, createdBy, createdAt: now, updatedAt: now };
};

// ── Actualizar una anotación (solo admin) ──────────────────────────────────────
export const updateAnnotation = async (
    id: string,
    title: string,
    content: string
): Promise<void> => {
    await updateDoc(doc(db, ANNOTATIONS_COLLECTION, id), {
        title,
        content,
        updatedAt: serverTimestamp(),
    });
};

// ── Eliminar una anotación (solo admin) ────────────────────────────────────────
export const deleteAnnotation = async (id: string): Promise<void> => {
    await deleteDoc(doc(db, ANNOTATIONS_COLLECTION, id));
};
