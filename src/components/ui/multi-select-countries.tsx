"use client";

import * as React from "react";
import { Check, ChevronsUpDown, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import type { LatamCountry } from "@/lib/latam-config";

interface MultiSelectCountriesProps {
  countries: LatamCountry[];
  selectedCountries: string[];
  onSelectionChange: (selected: string[]) => void;
  placeholder?: string;
  maxSelected?: number;
}

export function MultiSelectCountries({
  countries,
  selectedCountries,
  onSelectionChange,
  placeholder = "Selecione países...",
  maxSelected,
}: MultiSelectCountriesProps) {
  const [open, setOpen] = React.useState(false);

  const handleSelect = (countryCode: string) => {
    const isSelected = selectedCountries.includes(countryCode);

    if (isSelected) {
      // Remove
      onSelectionChange(selectedCountries.filter(c => c !== countryCode));
    } else {
      // Add (se não atingiu o limite)
      if (maxSelected && selectedCountries.length >= maxSelected) {
        return; // Não adiciona se já atingiu o limite
      }
      onSelectionChange([...selectedCountries, countryCode]);
    }
  };

  const handleRemove = (countryCode: string) => {
    onSelectionChange(selectedCountries.filter(c => c !== countryCode));
  };

  const selectedCountryObjects = countries.filter(c =>
    selectedCountries.includes(c.value)
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
        >
          <div className="flex gap-1 flex-wrap">
            {selectedCountries.length === 0 ? (
              <span className="text-muted-foreground">{placeholder}</span>
            ) : (
              selectedCountryObjects.map((country) => (
                <Badge
                  key={country.value}
                  variant="secondary"
                  className="mr-1"
                >
                  {country.flag} {country.label}
                  <span
                    role="button"
                    tabIndex={0}
                    className="ml-1 ring-offset-background rounded-full outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 cursor-pointer"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        handleRemove(country.value);
                      }
                    }}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                    }}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleRemove(country.value);
                    }}
                  >
                    <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                  </span>
                </Badge>
              ))
            )}
          </div>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0">
        <Command>
          <CommandInput placeholder="Buscar país..." />
          <CommandEmpty>Nenhum país encontrado.</CommandEmpty>
          <CommandGroup>
            {countries.map((country) => {
              const isSelected = selectedCountries.includes(country.value);
              const isDisabled = maxSelected && selectedCountries.length >= maxSelected && !isSelected;

              return (
                <CommandItem
                  key={country.value}
                  value={country.value}
                  onSelect={() => {
                    if (!isDisabled) {
                      handleSelect(country.value);
                    }
                  }}
                  disabled={isDisabled}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      isSelected ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <span className="mr-2">{country.flag}</span>
                  {country.label}
                  <span className="ml-auto text-xs text-muted-foreground">
                    {country.lang.toUpperCase()}
                  </span>
                </CommandItem>
              );
            })}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
