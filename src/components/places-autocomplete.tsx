"use client";

import { useEffect, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { Loader2, MapPin } from "lucide-react";

type PlaceResult = {
  address: string;
  placeId: string;
  lat: number;
  lng: number;
};

type Props = {
  value: string;
  onChange: (place: PlaceResult) => void;
  onError?: (error: string) => void;
  disabled?: boolean;
};

type AutocompleteInstance = {
  addListener: (event: string, callback: () => void) => void;
  getPlace: () => {
    place_id?: string;
    formatted_address?: string;
    geometry?: {
      location: {
        lat: () => number;
        lng: () => number;
      };
    };
  };
};

let scriptLoadPromise: Promise<void> | null = null;

function loadGoogleMapsScript(apiKey: string): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  const win = window as unknown as { google?: { maps?: { places?: unknown } } };
  if (win.google?.maps?.places) return Promise.resolve();
  if (scriptLoadPromise) return scriptLoadPromise;

  scriptLoadPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(
      `script[src*="maps.googleapis.com/maps/api/js"]`
    );
    if (existing) {
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", () => {
        scriptLoadPromise = null;
        reject(new Error("Google Maps script failed to load"));
      });
      return;
    }

    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&loading=async`;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => {
      scriptLoadPromise = null;
      reject(new Error("Failed to load Google Maps script"));
    };
    document.head.appendChild(script);
  });
  return scriptLoadPromise;
}

export function PlacesAutocomplete({ value, onChange, onError, disabled }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<AutocompleteInstance | null>(null);
  const [scriptState, setScriptState] = useState<"loading" | "loaded" | "error">(
    () => {
      const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
      if (!apiKey || apiKey === "your_google_maps_api_key_here") return "error";
      return "loading";
    }
  );
  const [inputValue, setInputValue] = useState(value);

  useEffect(() => {
    if (scriptState === "error") {
      onError?.("Maps autocomplete unavailable. You can still type the address.");
    }
  }, [scriptState, onError]);

  useEffect(() => {
    if (scriptState === "loaded" || scriptState === "error") return;
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!apiKey || apiKey === "your_google_maps_api_key_here") return;

    loadGoogleMapsScript(apiKey)
      .then(() => setScriptState("loaded"))
      .catch(() => setScriptState("error"));
  }, [scriptState]);

  useEffect(() => {
    if (scriptState !== "loaded" || !inputRef.current || autocompleteRef.current) return;

    const mapsApi = window as unknown as {
      google?: { maps?: { places?: { Autocomplete: unknown } } };
    };
    const Autocomplete = mapsApi.google?.maps?.places?.Autocomplete as unknown as
      new (input: HTMLInputElement, opts: { types: string[]; fields: string[] }) => AutocompleteInstance;

    if (!Autocomplete) return;

    const autocomplete = new Autocomplete(inputRef.current, {
      types: ["address"],
      fields: ["place_id", "formatted_address", "geometry"],
    });

    autocomplete.addListener("place_changed", () => {
      const place = autocomplete.getPlace();
      if (place.place_id && place.formatted_address && place.geometry?.location) {
        const lat = place.geometry.location.lat();
        const lng = place.geometry.location.lng();
        onChange({
          address: place.formatted_address,
          placeId: place.place_id,
          lat,
          lng,
        });
        setInputValue(place.formatted_address);
      }
    });

    autocompleteRef.current = autocomplete;
  }, [scriptState, onChange]);

  const handleManualChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInputValue(val);
    onChange({ address: val, placeId: "", lat: 0, lng: 0 });
  };

  return (
    <div className="relative">
      <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none z-10">
        {scriptState === "loaded" ? (
          <MapPin className="w-5 h-5 text-indigo-400" />
        ) : (
          <Loader2 className="w-5 h-5 animate-spin text-slate-500" />
        )}
      </div>
      <Input
        ref={inputRef}
        value={inputValue}
        onChange={handleManualChange}
        placeholder="e.g. 123 Main St, New York, NY"
        className="bg-slate-950 border-slate-700 text-white h-12 pl-10"
        disabled={disabled || scriptState === "loading"}
      />
      {scriptState === "error" && (
        <p className="text-xs text-amber-400 mt-1">
          Maps autocomplete unavailable. Type address manually.
        </p>
      )}
    </div>
  );
}
