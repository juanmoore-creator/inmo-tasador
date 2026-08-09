import { useEffect, useRef, useState } from 'react';

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string;

// Singleton: load the Google Maps script only once
let scriptLoadPromise: Promise<void> | null = null;

function loadGoogleMapsScript(): Promise<void> {
    if (scriptLoadPromise) return scriptLoadPromise;

    // If already loaded
    if (window.google?.maps?.places) {
        scriptLoadPromise = Promise.resolve();
        return scriptLoadPromise;
    }

    scriptLoadPromise = new Promise<void>((resolve, reject) => {
        const existingScript = document.getElementById('google-maps-script');
        if (existingScript) {
            existingScript.addEventListener('load', () => resolve());
            existingScript.addEventListener('error', () => reject(new Error('Google Maps script failed to load')));
            return;
        }

        const script = document.createElement('script');
        script.id = 'google-maps-script';
        script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places`;
        script.async = true;
        script.defer = true;
        script.onload = () => resolve();
        script.onerror = () => reject(new Error('Google Maps script failed to load'));
        document.head.appendChild(script);
    });

    return scriptLoadPromise;
}

interface AddressAutocompleteProps {
    value: string;
    onChange: (value: string) => void;
    onSelect: (address: string, lat: number, lng: number) => void;
    placeholder?: string;
    required?: boolean;
    className?: string;
}

export default function AddressAutocomplete({
    value,
    onChange,
    onSelect,
    placeholder = 'Escribí una dirección...',
    required,
    className,
}: AddressAutocompleteProps) {
    const inputRef = useRef<HTMLInputElement>(null);
    const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
    const [ready, setReady] = useState(false);

    // Load script once on mount
    useEffect(() => {
        loadGoogleMapsScript()
            .then(() => setReady(true))
            .catch((err) => console.error('AddressAutocomplete: failed to load Google Maps', err));
    }, []);

    // Attach autocomplete once the script is ready and the input is mounted
    useEffect(() => {
        if (!ready || !inputRef.current) return;
        if (autocompleteRef.current) return; // already attached

        autocompleteRef.current = new window.google.maps.places.Autocomplete(inputRef.current, {
            types: ['address'],
        });

        autocompleteRef.current.addListener('place_changed', () => {
            const place = autocompleteRef.current!.getPlace();
            const formattedAddress = place.formatted_address || place.name || '';
            const lat = place.geometry?.location?.lat() ?? 0;
            const lng = place.geometry?.location?.lng() ?? 0;

            // Update internal value then call onSelect
            onChange(formattedAddress);
            onSelect(formattedAddress, lat, lng);
        });

        return () => {
            // Clean up listener on unmount
            if (autocompleteRef.current) {
                window.google.maps.event.clearInstanceListeners(autocompleteRef.current);
                autocompleteRef.current = null;
            }
        };
    }, [ready]); // eslint-disable-line react-hooks/exhaustive-deps

    return (
        <input
            ref={inputRef}
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={ready ? placeholder : 'Cargando autocompletado...'}
            required={required}
            className={className}
            autoComplete="off"
        />
    );
}
