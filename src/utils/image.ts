export const imageCache = new Map<string, string>();

// Stable session ID — survives re-renders but not page reloads
const sessionId = Math.random().toString(36).slice(2, 10);

export const getSafeImageUrl = (url?: string) => {
    if (!url) return '';
    if (url.startsWith('data:')) return url;
    // Firebase Storage URLs already have a unique token — don't add cache-buster
    if (url.includes('token=')) return url;
    if (!imageCache.has(url)) {
        const separator = url.includes('?') ? '&' : '?';
        imageCache.set(url, `${url}${separator}c=${sessionId}`);
    }
    return imageCache.get(url)!;
};

/**
 * Carga una imagen y genera una versión de la misma tintada completamente de blanco
 * usando Canvas API. Esto evita el uso de filtros CSS que no son soportados por html2canvas.
 */
export const getWhiteTintedImageUrl = async (url: string): Promise<string> => {
    if (!url) return '';
    
    return new Promise((resolve) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        
        img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            
            if (!ctx) {
                resolve(url);
                return;
            }
            
            ctx.drawImage(img, 0, 0);
            
            try {
                const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                const data = imgData.data;
                
                // Verificar si la imagen tiene al menos algún píxel con transparencia.
                // Si es completamente sólida (como un JPG o un PNG sin canal alfa),
                // no debemos tintarla a blanco porque se convertiría en un bloque blanco liso.
                let hasAlpha = false;
                for (let i = 3; i < data.length; i += 4) {
                    if (data[i] < 255) {
                        hasAlpha = true;
                        break;
                    }
                }
                
                if (hasAlpha) {
                    // Convertir todos los píxeles no transparentes a blanco (RGBA: 255, 255, 255, alpha)
                    for (let i = 0; i < data.length; i += 4) {
                        if (data[i + 3] > 0) { // Si el píxel tiene opacidad
                            data[i] = 255;     // R
                            data[i + 1] = 255; // G
                            data[i + 2] = 255; // B
                        }
                    }
                    ctx.putImageData(imgData, 0, 0);
                    resolve(canvas.toDataURL());
                } else {
                    // Si es sólida, devolvemos la URL original para conservar el logo original
                    resolve(url);
                }
            } catch (err) {
                // Si falla por CORS o algún error de lectura, retornamos la URL original
                console.warn('Error transformando los bytes de la imagen a blanco:', err);
                resolve(url);
            }
        };
        
        img.onerror = () => {
            console.warn('Error cargando la imagen para tintado:', url);
            resolve(url);
        };
        
        img.src = url;
    });
};

