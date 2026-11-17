import countriesData from './countries.json';

import type { Country, Continent } from '../types/country';

export const countries: Country[] = countriesData as Country[];

export function getCountriesByContinents(continents: Continent[]): Country[] {
    return countries.filter((country) =>
        continents.includes(country.continent),
    );
}

export function getFlagUrl(country: Country): string {
    return `${import.meta.env.BASE_URL}flags/${country.flag}`;
}
