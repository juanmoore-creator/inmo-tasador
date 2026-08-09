import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import {
    collection, addDoc, getDocs, deleteDoc, doc,
    query, orderBy, Timestamp
} from 'firebase/firestore';
import { storage, db } from '../firebase/config';
import type { ReportTemplateId } from '../types';

// ── Types ────────────────────────────────────────────────────────────────────

export interface PDFVersion {
    id: string;
    valuationId: string;
    tenantId: string;
    storageUrl: string;
    storagePath: string;
    fileName: string;
    templateId: ReportTemplateId;
    generatedBy: string;
    generatedByName: string;
    generatedAt: number;
    fileSizeBytes: number;
    pageCount: number;
    edits?: Record<string, any>;
}

export interface UploadPDFParams {
    blob: Blob;
    valuationId: string;
    tenantId: string;
    fileName: string;
    templateId: ReportTemplateId;
    userId: string;
    userName: string;
    pageCount: number;
    edits?: Record<string, any>;
}

const MAX_VERSIONS = 5;

// ── Service ──────────────────────────────────────────────────────────────────

/**
 * Upload a PDF to Firebase Storage and save metadata to Firestore.
 * Automatically cleans up old versions beyond MAX_VERSIONS.
 */
export async function uploadPDFVersion(params: UploadPDFParams): Promise<PDFVersion> {
    const {
        blob, valuationId, tenantId, fileName,
        templateId, userId, userName, pageCount, edits
    } = params;

    const timestamp = Date.now();
    const storagePath = `tenants/${tenantId}/pdfs/${valuationId}/${timestamp}.pdf`;

    // Upload to Firebase Storage
    const storageRef = ref(storage, storagePath);
    await uploadBytes(storageRef, blob, {
        contentType: 'application/pdf',
        customMetadata: {
            valuationId,
            templateId,
            generatedBy: userId,
        },
    });

    const storageUrl = await getDownloadURL(storageRef);

    // Save metadata to Firestore
    const versionData = {
        valuationId,
        tenantId,
        storageUrl,
        storagePath,
        fileName,
        templateId,
        generatedBy: userId,
        generatedByName: userName,
        generatedAt: timestamp,
        fileSizeBytes: blob.size,
        pageCount,
        edits: edits || null,
        createdAt: Timestamp.now(),
    };

    const colRef = collection(db, 'valuations', valuationId, 'pdf_versions');
    const docRef = await addDoc(colRef, versionData);

    // Cleanup old versions
    await cleanupOldVersions(valuationId);

    return {
        id: docRef.id,
        ...versionData,
        generatedAt: timestamp,
    } as PDFVersion;
}

/**
 * Get all PDF versions for a valuation, sorted by newest first.
 */
export async function getPDFVersions(valuationId: string): Promise<PDFVersion[]> {
    const colRef = collection(db, 'valuations', valuationId, 'pdf_versions');
    const q = query(colRef, orderBy('generatedAt', 'desc'));
    const snapshot = await getDocs(q);

    return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
    })) as PDFVersion[];
}

/**
 * Download a specific PDF version.
 * Opens the download URL in a new tab or triggers a fetch+download.
 */
export async function downloadPDFVersion(version: PDFVersion): Promise<void> {
    try {
        // Fetch the PDF blob and trigger download
        const response = await fetch(version.storageUrl);
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = version.fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    } catch (error) {
        console.error('Error downloading PDF version:', error);
        // Fallback: open URL directly
        window.open(version.storageUrl, '_blank');
    }
}

/**
 * Delete a specific PDF version from Storage and Firestore.
 */
export async function deletePDFVersion(version: PDFVersion): Promise<void> {
    // Delete from Firebase Storage
    try {
        const storageRef = ref(storage, version.storagePath);
        await deleteObject(storageRef);
    } catch (error) {
        // Storage file might already be deleted — continue with Firestore cleanup
        console.warn('Storage deletion failed (file may not exist):', error);
    }

    // Delete from Firestore
    const docRef = doc(db, 'valuations', version.valuationId, 'pdf_versions', version.id);
    await deleteDoc(docRef);
}

/**
 * Remove the oldest versions beyond MAX_VERSIONS.
 */
async function cleanupOldVersions(valuationId: string): Promise<void> {
    const versions = await getPDFVersions(valuationId);

    if (versions.length <= MAX_VERSIONS) return;

    // Delete oldest versions (array is sorted newest-first)
    const toDelete = versions.slice(MAX_VERSIONS);

    await Promise.all(toDelete.map(v => deletePDFVersion(v)));
}
