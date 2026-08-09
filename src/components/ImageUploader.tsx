import React, { useState, useRef } from 'react';
import { storage } from '../firebase/config';
import { ref as storageRef, uploadBytesResumable as uploadBytes, getDownloadURL as getURL } from 'firebase/storage';
import { Upload, X, Loader2 } from 'lucide-react';

interface ImageUploaderProps {
    images: string[];
    onChange: (images: string[]) => void;
    maxImages?: number;
    label?: string;
}

export default function ImageUploader({ images = [], onChange, maxImages = 10, label = "Imágenes" }: ImageUploaderProps) {
    const [uploading, setUploading] = useState(false);
    const [progress, setProgress] = useState(0);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        if (!files.length) return;

        if (images.length + files.length > maxImages) {
            alert(`Solo puedes subir hasta ${maxImages} imágenes.`);
            return;
        }

        setUploading(true);
        setProgress(0);

        const uploadedUrls: string[] = [];

        try {
            for (let i = 0; i < files.length; i++) {
                const file = files[i];
                const fileExtension = file.name.split('.').pop();
                const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${fileExtension}`;
                const imageRef = storageRef(storage, `properties/${fileName}`);

                const uploadTask = uploadBytes(imageRef, file);

                await new Promise<void>((resolve, reject) => {
                    uploadTask.on(
                        'state_changed',
                        (snapshot) => {
                            const p = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                            setProgress(Math.round(p));
                        },
                        (error) => reject(error),
                        async () => {
                            const downloadURL = await getURL(uploadTask.snapshot.ref);
                            uploadedUrls.push(downloadURL);
                            resolve();
                        }
                    );
                });
            }

            onChange([...images, ...uploadedUrls]);
        } catch (error) {
            console.error("Error uploading images:", error);
            alert("Hubo un error al subir las imágenes.");
        } finally {
            setUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const removeImage = (indexToRemove: number) => {
        onChange(images.filter((_, index) => index !== indexToRemove));
    };

    return (
        <div className="space-y-4">
            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                <span>{label} ({images.length}/{maxImages})</span>
                {uploading && (
                    <span className="text-indigo-600 flex items-center gap-2 text-xs">
                        <Loader2 className="w-3 h-3 animate-spin" /> Subiendo... {progress}%
                    </span>
                )}
            </label>

            {/* Grid de imágenes subidas */}
            {images.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {images.map((url, index) => (
                        <div key={index} className="relative group aspect-video rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                            <img src={url} alt={`Preview ${index}`} className="w-full h-full object-cover" />
                            <button
                                type="button"
                                onClick={() => removeImage(index)}
                                className="absolute top-2 right-2 p-1.5 bg-white/90 dark:bg-slate-900/90 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/40 hover:text-red-700 dark:hover:text-red-400 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200 shadow-sm"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {/* Botón de subida */}
            {images.length < maxImages && (
                <label className={`
          relative flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-xl transition-colors duration-200 cursor-pointer
          ${uploading ? 'border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-800/50 cursor-not-allowed' : 'border-indigo-300 dark:border-indigo-500/30 bg-indigo-50/30 dark:bg-indigo-500/5 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 hover:border-indigo-400 dark:hover:border-indigo-400/50'}
        `}>
                    <input
                        ref={fileInputRef}
                        type="file"
                        multiple
                        accept="image/*"
                        className="hidden"
                        onChange={handleFileChange}
                        disabled={uploading}
                    />
                    <div className="flex flex-col items-center justify-center space-y-2 text-indigo-600 dark:text-indigo-400">
                        <Upload className="w-6 h-6 mb-2" />
                        <p className="text-sm font-semibold">
                            Haz clic para subir imágenes
                        </p>
                        <p className="text-xs text-indigo-400/80 dark:text-indigo-400/60">
                            PNG, JPG, WEBP (Max {maxImages})
                        </p>
                    </div>
                </label>
            )}
        </div>
    );
}
