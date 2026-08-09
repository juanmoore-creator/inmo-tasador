import { useState, useCallback } from 'react';

// ── Types ────────────────────────────────────────────────────────────────────

export interface PDFProgress {
    current: number;
    total: number;
    phase: 'preparing' | 'capturing' | 'processing' | 'saving' | 'uploading';
}

interface PDFMetadata {
    title: string;
    author: string;
    subject: string;
    creator: string;
}

interface GeneratePDFOptions {
    containerId: string;
    fileName: string;
    metadata?: PDFMetadata;
    /** Called with the PDF blob after local save, for background upload */
    onBlobReady?: (blob: Blob, pageCount: number) => void;
}

interface UsePDFGeneratorReturn {
    generatePDF: (options: GeneratePDFOptions) => Promise<void>;
    isGenerating: boolean;
    progress: PDFProgress | null;
    error: string | null;
}

// ── Constants ────────────────────────────────────────────────────────────────

const A4_PAGE_WIDTH = 794;
const A4_PAGE_HEIGHT = 1123;
const PDF_WIDTH_MM = 210;
const PDF_HEIGHT_MM = 297;
const CHUNK_SIZE = 5; // Max pages per canvas batch (keeps under iOS 16M pixel limit)

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Detect mobile device for adaptive rendering */
const isMobileDevice = (): boolean =>
    navigator.maxTouchPoints > 0 && window.innerWidth < 768;

/** Wait for all images inside a container to finish loading */
const waitForImages = async (container: HTMLElement): Promise<void> => {
    const images = Array.from(container.querySelectorAll('img'));
    await Promise.all(
        images.map((img) => {
            if (img.complete) return Promise.resolve();
            return new Promise<void>((resolve) => {
                img.onload = () => resolve();
                img.onerror = () => resolve();
            });
        })
    );
};

/** Yield to the browser to prevent UI freeze */
const breathe = (ms = 30) => new Promise<void>((r) => setTimeout(r, ms));

// ── Hook ─────────────────────────────────────────────────────────────────────

export function usePDFGenerator(): UsePDFGeneratorReturn {
    const [isGenerating, setIsGenerating] = useState(false);
    const [progress, setProgress] = useState<PDFProgress | null>(null);
    const [error, setError] = useState<string | null>(null);

    const generatePDF = useCallback(async (options: GeneratePDFOptions) => {
        const { containerId, fileName, metadata } = options;

        setIsGenerating(true);
        setProgress({ current: 0, total: 0, phase: 'preparing' });
        setError(null);

        let container: HTMLElement | null = null;
        let originalLeft = '';

        try {
            // ── Dynamic imports ──────────────────────────────────────────
            const [html2canvas, jsPDF] = await Promise.all([
                import('html2canvas').then((m) => m.default),
                import('jspdf').then((m) => m.default),
            ]);

            // ── Prepare container ────────────────────────────────────────
            container = document.getElementById(containerId);
            if (!container) throw new Error('Render container not found');

            originalLeft = container.style.left;
            container.style.visibility = 'visible';
            container.style.left = '0px';

            await waitForImages(container);
            await breathe(200); // Layout settle

            // ── Discover pages ───────────────────────────────────────────
            const pages = Array.from(container.querySelectorAll('.print-page'));
            if (pages.length === 0) throw new Error('No pages found in container');

            const totalPages = pages.length;
            const isMobile = isMobileDevice();
            const captureScale = isMobile ? 1.5 : 2;
            const useCompression = totalPages > 10;

            setProgress({ current: 0, total: totalPages, phase: 'capturing' });

            // ── Create PDF ───────────────────────────────────────────────
            const pdf = new jsPDF({
                orientation: 'p',
                unit: 'mm',
                format: 'a4',
                compress: useCompression,
            });

            // Set metadata
            if (metadata) {
                pdf.setProperties({
                    title: metadata.title,
                    author: metadata.author,
                    subject: metadata.subject,
                    creator: metadata.creator,
                });
            }

            const sWidth = A4_PAGE_WIDTH * captureScale;
            const sHeight = A4_PAGE_HEIGHT * captureScale;

            // ── Chunked rendering ────────────────────────────────────────
            // Render in batches of CHUNK_SIZE pages to stay under canvas
            // pixel limits (iOS Safari ~16M pixels per canvas).
            const useChunked = totalPages > CHUNK_SIZE;
            let pdfPageIndex = 0;

            if (useChunked) {
                // ── CHUNKED PATH ─────────────────────────────────────────
                // Create a wrapper div for each chunk, temporarily cloning
                // page elements into it for isolated html2canvas capture (prevents mutating React DOM).
                for (let chunkStart = 0; chunkStart < totalPages; chunkStart += CHUNK_SIZE) {
                    const chunkEnd = Math.min(chunkStart + CHUNK_SIZE, totalPages);
                    const chunkPages = pages.slice(chunkStart, chunkEnd);
                    const chunkCount = chunkPages.length;

                    // Create temporary wrapper for this chunk
                    const wrapper = document.createElement('div');
                    wrapper.style.width = `${A4_PAGE_WIDTH}px`;
                    wrapper.style.position = 'absolute';
                    wrapper.style.left = '0px';
                    wrapper.style.top = '0px';

                    // Clone pages to avoid modifying the active React DOM
                    const clonedPages = chunkPages.map((p) => p.cloneNode(true) as HTMLElement);
                    clonedPages.forEach((clone) => wrapper.appendChild(clone));
                    container!.appendChild(wrapper);

                    await breathe(100);

                    const chunkCanvas = await html2canvas(wrapper, {
                        scale: captureScale,
                        useCORS: true,
                        logging: false,
                        width: A4_PAGE_WIDTH,
                        height: A4_PAGE_HEIGHT * chunkCount,
                        windowWidth: A4_PAGE_WIDTH,
                        scrollY: 0,
                        scrollX: 0,
                    });

                    // Crop chunk canvas into individual pages
                    for (let j = 0; j < chunkCount; j++) {
                        if (pdfPageIndex > 0) pdf.addPage();

                        const pageCanvas = document.createElement('canvas');
                        pageCanvas.width = sWidth;
                        pageCanvas.height = sHeight;
                        const ctx = pageCanvas.getContext('2d');

                        if (ctx) {
                            ctx.drawImage(
                                chunkCanvas,
                                0, j * sHeight, sWidth, sHeight,
                                0, 0, sWidth, sHeight
                            );
                            const dataUrl = pageCanvas.toDataURL('image/jpeg', 0.95);
                            pdf.addImage(dataUrl, 'JPEG', 0, 0, PDF_WIDTH_MM, PDF_HEIGHT_MM, undefined, 'FAST');
                        }

                        pdfPageIndex++;
                        setProgress({ current: pdfPageIndex, total: totalPages, phase: 'processing' });
                        await breathe();
                    }

                    wrapper.remove();
                }
            } else {
                // ── SINGLE-PASS PATH (fast, ≤5 pages) ───────────────────
                const totalHeight = A4_PAGE_HEIGHT * totalPages;

                const fullCanvas = await html2canvas(container, {
                    scale: captureScale,
                    useCORS: true,
                    logging: false,
                    width: A4_PAGE_WIDTH,
                    height: totalHeight,
                    windowWidth: A4_PAGE_WIDTH,
                    scrollY: 0,
                    scrollX: 0,
                });

                await breathe(100);

                for (let i = 0; i < totalPages; i++) {
                    if (i > 0) pdf.addPage();

                    const pageCanvas = document.createElement('canvas');
                    pageCanvas.width = sWidth;
                    pageCanvas.height = sHeight;
                    const ctx = pageCanvas.getContext('2d');

                    if (ctx) {
                        ctx.drawImage(
                            fullCanvas,
                            0, i * sHeight, sWidth, sHeight,
                            0, 0, sWidth, sHeight
                        );
                        const dataUrl = pageCanvas.toDataURL('image/jpeg', 0.95);
                        pdf.addImage(dataUrl, 'JPEG', 0, 0, PDF_WIDTH_MM, PDF_HEIGHT_MM, undefined, 'FAST');
                    }

                    pdfPageIndex++;
                    setProgress({ current: pdfPageIndex, total: totalPages, phase: 'processing' });
                    await breathe();
                }
            }

            // ── Save ─────────────────────────────────────────────────────
            setProgress({ current: totalPages, total: totalPages, phase: 'saving' });
            await breathe(50);
            pdf.save(fileName);

            // ── Background upload (fire-and-forget) ──────────────────────
            if (options.onBlobReady) {
                setProgress({ current: totalPages, total: totalPages, phase: 'uploading' });
                try {
                    const blob = pdf.output('blob');
                    options.onBlobReady(blob, totalPages);
                } catch (uploadErr) {
                    console.warn('PDF blob extraction failed:', uploadErr);
                }
            }
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Error desconocido al generar el PDF';
            console.error('Error generating PDF:', err);
            setError(message);
        } finally {
            if (container) {
                container.style.visibility = 'hidden';
                container.style.left = originalLeft;
            }
            setIsGenerating(false);
            // Clear progress after a short delay so UI can show completion
            setTimeout(() => setProgress(null), 500);
        }
    }, []);

    return { generatePDF, isGenerating, progress, error };
}
