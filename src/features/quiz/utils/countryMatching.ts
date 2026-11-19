import Fuse from 'fuse.js';
import type { Country } from '../../../types/country';
import { countries } from '../../../data/countries';

const MAX_SUGGESTIONS = 5;

function normalizeText(value: string): string {
    return value
        .normalize('NFD')
        .replace(/\p{M}/gu, '')
        .toLowerCase()
        .trim();
}

export function searchCountries(
    query: string,
    countryList: Country[] = countries,
    limit = MAX_SUGGESTIONS,
): Country[] {
    const normalizedQuery = normalizeText(query);

    if (!normalizedQuery || limit <= 0) {
        return [];
    }

    const searchableCountries = countryList.map((country) => ({
        country,
        normalizedName: normalizeText(country.name),
    }));

    const fuse = new Fuse(searchableCountries, {
        keys: ['normalizedName'],
        threshold: 0.35,
        ignoreLocation: true,
        minMatchCharLength: 1,
        shouldSort: true,
    });

    return fuse
        .search(normalizedQuery, { limit })
        .map((result) => result.item.country);
}
