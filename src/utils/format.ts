export const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value);
};

export const formatNumber = (value: number) => {
    return new Intl.NumberFormat('es-AR', { maximumFractionDigits: 2 }).format(value);
};

export const toDate = (timestamp: any): Date => {
    if (!timestamp) return new Date();
    if (timestamp instanceof Date) return timestamp;
    if (typeof timestamp === 'number') return new Date(timestamp);
    if (timestamp.toDate && typeof timestamp.toDate === 'function') return timestamp.toDate();
    if (timestamp.seconds !== undefined) return new Date(timestamp.seconds * 1000);
    return new Date(timestamp);
};

export const formatDate = (timestamp: any) => {
    if (!timestamp) return 'N/A';
    const date = toDate(timestamp);
    return date.toLocaleDateString('es-AR', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
    });
};
