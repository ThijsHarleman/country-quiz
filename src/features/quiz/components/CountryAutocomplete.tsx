import { useId, useMemo, useState } from 'react';
import type { FocusEvent, KeyboardEvent } from 'react';

import type { Country } from '../../../types/country';
import { searchCountries } from '../utils/countryMatching';

import styles from './CountryAutocomplete.module.css';

interface CountryAutocompleteProps {
    onSelect: (country: Country) => void;
    countries?: Country[];
    disabled?: boolean;
}

const MIN_QUERY_LENGTH = 2;

export function CountryAutocomplete({
    onSelect,
    countries,
    disabled = false,
}: CountryAutocompleteProps) {
    const inputId = useId();
    const listboxId = useId();

    const [query, setQuery] = useState('');
    const [activeIndex, setActiveIndex] = useState(-1);
    const [isOpen, setIsOpen] = useState(false);

    const suggestions = useMemo(
        () => searchCountries(query, countries),
        [query, countries],
    );

    const hasMinimumQueryLength =
        query.trim().length >= MIN_QUERY_LENGTH;

    const showSuggestions =
        isOpen &&
        hasMinimumQueryLength &&
        suggestions.length > 0;

    const showNoResults =
        isOpen &&
        hasMinimumQueryLength &&
        suggestions.length === 0;

    function selectCountry(country: Country) {
        setQuery('');
        setActiveIndex(-1);
        setIsOpen(false);

        onSelect(country);
    }

    function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
        if (disabled) {
            return;
        }

        switch (event.key) {
            case 'ArrowDown':
                if (!showSuggestions) return;

                event.preventDefault();

                setActiveIndex((current) =>
                    current >= suggestions.length - 1 ? 0 : current + 1,
                );
                break;

            case 'ArrowUp':
                if (!showSuggestions) return;

                event.preventDefault();

                setActiveIndex((current) =>
                    current <= 0 ? suggestions.length - 1 : current - 1,
                );
                break;

            case 'Enter':
                if (!showSuggestions || activeIndex < 0) return;

                event.preventDefault();

                if (suggestions[activeIndex]) {
                    selectCountry(suggestions[activeIndex]);
                }
                break;

            case 'Escape':
                setIsOpen(false);
                setActiveIndex(-1);
                break;
        }
    }

    function handleBlur(event: FocusEvent<HTMLDivElement>) {
        // Only close when focus moves outside the autocomplete.
        // This keeps the input focused when clicking a suggestion.
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
            setIsOpen(false);
            setActiveIndex(-1);
        }
    }

    function handleChange(value: string) {
        setQuery(value);
        setActiveIndex(-1);
        setIsOpen(true);
    }

    return (
        <div
            className={styles.container}
            onBlur={handleBlur}
        >
            <label
                className={styles.label}
                htmlFor={inputId}
            >
                Land
            </label>

            <input
                id={inputId}
                className={styles.input}
                type="text"
                role="combobox"
                aria-autocomplete="list"
                aria-expanded={showSuggestions}
                aria-controls={showSuggestions ? listboxId : undefined}
                aria-activedescendant={
                    showSuggestions && activeIndex >= 0
                        ? `${listboxId}-option-${activeIndex}`
                        : undefined
                }
                autoComplete="off"
                spellCheck={false}
                placeholder="Typ een land..."
                value={query}
                disabled={disabled}
                onFocus={() => setIsOpen(true)}
                onChange={(event) => handleChange(event.target.value)}
                onKeyDown={handleKeyDown}
            />

            {showSuggestions && (
                <ul
                    id={listboxId}
                    className={styles.listbox}
                    role="listbox"
                    aria-label="Landensuggesties"
                >
                    {suggestions.map((country, index) => (
                        <li
                            id={`${listboxId}-option-${index}`}
                            key={country.code}
                            className={`${styles.option} ${index === activeIndex ? styles.activeOption : ''
                                }`}
                            role="option"
                            aria-selected={index === activeIndex}
                            onMouseDown={(event) => event.preventDefault()}
                            onClick={() => selectCountry(country)}
                        >
                            {country.name}
                        </li>
                    ))}
                </ul>
            )}

            {showNoResults && (
                <p
                    className={styles.noResults}
                    role="status"
                >
                    Geen landen gevonden.
                </p>
            )}
        </div>
    );
}
