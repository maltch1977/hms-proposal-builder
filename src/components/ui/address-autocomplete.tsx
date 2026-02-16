"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { setOptions, importLibrary } from "@googlemaps/js-api-loader";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Check, MapPin, Search } from "lucide-react";

export interface AddressFields {
  street: string;
  city: string;
  state: string;
  zip: string;
}

interface PlaceSearchProps {
  clientName: string;
  onSelect: (name: string, address: AddressFields) => void;
  onConfirm: () => void;
  onReset: () => void;
  onManualEntry?: () => void;
  confirmed: boolean;
  selectedAddress: AddressFields;
}

let loadPromise: Promise<void> | null = null;

function ensureGoogleLoaded(): Promise<void> {
  if (typeof google !== "undefined" && google.maps?.places) {
    return Promise.resolve();
  }
  if (!loadPromise) {
    setOptions({
      key: process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY || "",
      libraries: ["places"],
    });
    loadPromise = importLibrary("places").then(() => {});
  }
  return loadPromise!;
}

function formatAddressOneLine(addr: AddressFields): string {
  const parts = [addr.street];
  const cityState = [addr.city, addr.state].filter(Boolean).join(", ");
  if (cityState) parts.push(cityState);
  if (addr.zip) parts[parts.length - 1] += " " + addr.zip;
  return parts.filter(Boolean).join(", ");
}

function parseAddressComponents(components: google.maps.GeocoderAddressComponent[]): AddressFields {
  let street = "";
  let city = "";
  let state = "";
  let zip = "";

  for (const component of components) {
    const types = component.types;
    if (types.includes("street_number")) {
      street = component.long_name + " " + street;
    } else if (types.includes("route")) {
      street = street + component.long_name;
    } else if (types.includes("locality")) {
      city = component.long_name;
    } else if (types.includes("administrative_area_level_1")) {
      state = component.short_name;
    } else if (types.includes("postal_code")) {
      zip = component.long_name;
    }
  }

  return { street: street.trim(), city, state, zip };
}

export function PlaceSearch({
  clientName,
  onSelect,
  onConfirm,
  onReset,
  onManualEntry,
  confirmed,
  selectedAddress,
}: PlaceSearchProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const [ready, setReady] = useState(false);
  const [hasSelected, setHasSelected] = useState(false);

  useEffect(() => {
    ensureGoogleLoaded().then(() => setReady(true));
  }, []);

  // Initialize autocomplete whenever we're in the search state
  useEffect(() => {
    if (!ready || !inputRef.current) return;

    // Clean up previous instance
    if (autocompleteRef.current) {
      google.maps.event.clearInstanceListeners(autocompleteRef.current);
      autocompleteRef.current = null;
    }

    // Only block Enter when no suggestion is highlighted;
    // allow it when user has arrow-keyed to a selection
    const input = inputRef.current;
    const blockEnter = (e: KeyboardEvent) => {
      if (e.key === "Enter") {
        const highlighted = document.querySelector(".pac-item-selected");
        if (!highlighted) {
          e.preventDefault();
          e.stopImmediatePropagation();
        }
      }
    };
    input.addEventListener("keydown", blockEnter, true);

    const ac = new google.maps.places.Autocomplete(inputRef.current, {
      componentRestrictions: { country: "us" },
      types: ["establishment"],
      fields: ["name", "address_components"],
    });

    ac.addListener("place_changed", () => {
      const place = ac.getPlace();
      if (!place?.name || !place?.address_components?.length) return;

      const addr = parseAddressComponents(place.address_components);
      setHasSelected(true);
      onSelect(place.name, addr);
    });

    autocompleteRef.current = ac;

    return () => {
      input.removeEventListener("keydown", blockEnter, true);
      google.maps.event.clearInstanceListeners(ac);
      autocompleteRef.current = null;
    };
  // Re-initialize when returning to search state
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, confirmed, hasSelected]);

  // Confirmed — show locked-in summary
  if (confirmed) {
    return (
      <div className="rounded-lg border border-border bg-muted/30 p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-hms-navy" />
            <div>
              <p className="font-medium text-foreground">{clientName}</p>
              <p className="text-sm text-muted-foreground">
                {formatAddressOneLine(selectedAddress)}
              </p>
            </div>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              setHasSelected(false);
              onReset();
            }}
            className="shrink-0 text-muted-foreground hover:text-foreground"
          >
            Change
          </Button>
        </div>
      </div>
    );
  }

  // Selected but not yet confirmed — show confirmation
  if (hasSelected && clientName) {
    return (
      <div className="rounded-lg border border-hms-gold/50 bg-hms-gold/5 p-4">
        <p className="mb-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Is this correct?
        </p>
        <div className="flex items-start gap-3">
          <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-hms-navy" />
          <div>
            <p className="font-medium text-foreground">{clientName}</p>
            <p className="text-sm text-muted-foreground">
              {formatAddressOneLine(selectedAddress)}
            </p>
          </div>
        </div>
        <div className="mt-3 flex gap-2">
          <Button
            type="button"
            size="sm"
            className="bg-hms-navy hover:bg-hms-navy-light"
            onClick={onConfirm}
          >
            <Check className="mr-1.5 h-3.5 w-3.5" />
            Confirm
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              setHasSelected(false);
              onReset();
            }}
          >
            Try again
          </Button>
        </div>
      </div>
    );
  }

  // Default — search input (uncontrolled so Google can manage the value)
  return (
    <div ref={containerRef} className="space-y-2">
      <Label htmlFor="clientSearch">Client Name</Label>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/50" />
        <input
          ref={inputRef}
          id="clientSearch"
          placeholder="Search for a business..."
          className="file:text-foreground placeholder:text-muted-foreground/50 selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input h-9 w-full min-w-0 rounded-md border bg-transparent pl-9 pr-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] md:text-sm"
        />
      </div>
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          Type the business name and select from the dropdown.
        </p>
        <Button
          type="button"
          variant="link"
          size="sm"
          className="h-auto p-0 text-xs text-muted-foreground hover:text-foreground"
          onClick={() => onManualEntry?.()}
        >
          Enter manually
        </Button>
      </div>
    </div>
  );
}

export function ManualAddressFields({
  value,
  onChange,
}: {
  value: AddressFields;
  onChange: (fields: AddressFields) => void;
}) {
  return (
    <div className="space-y-3">
      <div className="space-y-2">
        <Label htmlFor="street">Street Address</Label>
        <Input
          id="street"
          placeholder="123 Main St"
          value={value.street}
          onChange={(e) => onChange({ ...value, street: e.target.value })}
          required
        />
      </div>
      <div className="grid grid-cols-6 gap-3">
        <div className="col-span-3 space-y-2">
          <Label htmlFor="city">City</Label>
          <Input
            id="city"
            placeholder="City"
            value={value.city}
            onChange={(e) => onChange({ ...value, city: e.target.value })}
            required
          />
        </div>
        <div className="col-span-1 space-y-2">
          <Label htmlFor="state">State</Label>
          <Input
            id="state"
            placeholder="OR"
            value={value.state}
            onChange={(e) => onChange({ ...value, state: e.target.value })}
            maxLength={2}
            required
          />
        </div>
        <div className="col-span-2 space-y-2">
          <Label htmlFor="zip">ZIP</Label>
          <Input
            id="zip"
            placeholder="97201"
            value={value.zip}
            onChange={(e) => onChange({ ...value, zip: e.target.value })}
            required
          />
        </div>
      </div>
    </div>
  );
}
