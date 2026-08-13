import { collection, doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase/config';

// Generate a random 6-character short ID
const generateShortId = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
};

export const createShareLink = async (storagePath: string): Promise<string> => {
    try {
        const shortId = generateShortId();
        const shareRef = doc(collection(db, 'public_shares'), shortId);
        
        await setDoc(shareRef, {
            storagePath,
            createdAt: serverTimestamp()
        });

        return shortId;
    } catch (error) {
        console.error('Error creating share link:', error);
        throw error;
    }
};

export const getShareLinkData = async (shortId: string): Promise<string | null> => {
    try {
        const shareRef = doc(db, 'public_shares', shortId);
        const shareSnap = await getDoc(shareRef);
        
        if (shareSnap.exists()) {
            return shareSnap.data().storagePath;
        }
        
        return null;
    } catch (error) {
        console.error('Error fetching share link:', error);
        return null;
    }
};
