'use client';

import { useEffect, useRef, useState } from 'react';
import { IoLocationOutline } from 'react-icons/io5';

export interface LocationData {
  formatted_address: string;
  place_id: string;
  lat: number;
  lng: number;
}

interface LocationAutocompleteProps {
  value: LocationData | null;
  onChange: (location: LocationData | null) => void;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  error?: string;
}

export default function LocationAutocomplete({
  value,
  onChange,
  placeholder = 'e.g., Toronto, Ontario',
  disabled = false,
  required = false,
  error,
}: LocationAutocompleteProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const [inputValue, setInputValue] = useState(value?.formatted_address || '');

  useEffect(() => {
    // Wait for Google Maps API to load
    if (!window.google || !inputRef.current) {
      return;
    }

    // Initialize autocomplete
    autocompleteRef.current = new google.maps.places.Autocomplete(inputRef.current, {
      types: ['(regions)'], // Cities, postal codes, etc.
      fields: ['formatted_address', 'geometry', 'place_id', 'name'],
    });

    // Listen for place selection
    const listener = autocompleteRef.current.addListener('place_changed', () => {
      const place = autocompleteRef.current?.getPlace();

      if (!place || !place.geometry || !place.geometry.location) {
        console.warn('No place details available');
        return;
      }

      const locationData: LocationData = {
        formatted_address: place.formatted_address || place.name || '',
        place_id: place.place_id || '',
        lat: place.geometry.location.lat(),
        lng: place.geometry.location.lng(),
      };

      setInputValue(locationData.formatted_address);
      onChange(locationData);
    });

    // Cleanup
    return () => {
      if (listener) {
        google.maps.event.removeListener(listener);
      }
    };
  }, [onChange]);

  // Update input when value changes externally
  useEffect(() => {
    if (value?.formatted_address !== inputValue) {
      setInputValue(value?.formatted_address || '');
    }
  }, [value]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);

    // Clear location data if user manually types
    if (newValue === '') {
      onChange(null);
    }
  };

  const handleClear = () => {
    setInputValue('');
    onChange(null);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  return (
    <div className="relative">
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          className={`w-full px-4 py-3 pr-12 bg-[#1a1a2e] border-2 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-[#08d9d6] focus:shadow-[0_0_20px_rgba(8,217,214,0.3)] transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
            error ? 'border-red-500' : 'border-[#08d9d6]/30'
          }`}
        />

        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
          {inputValue && !disabled && (
            <button
              type="button"
              onClick={handleClear}
              className="text-gray-400 hover:text-white transition-colors"
              aria-label="Clear location"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
          <IoLocationOutline className="text-[#08d9d6] text-xl" />
        </div>
      </div>

      {error && (
        <p className="mt-2 text-sm text-red-500">{error}</p>
      )}
    </div>
  );
}
