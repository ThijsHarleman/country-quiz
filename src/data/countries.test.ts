import { describe, it, expect } from 'vitest';

import {
    countries,
    getCountriesByContinents,
    getFlagUrl,
} from './countries';

const validContinents = [
    'Africa',
    'Asia',
    'Europe',
    'North America',
    'Oceania',
    'South America',
];

describe('Country database', () => {
    it('contains countries', () => {
        expect(countries.length).toBeGreaterThan(0);
    });

    it('has unique country codes', () => {
        const codes = countries.map((country) => country.code);

        expect(new Set(codes).size).toBe(codes.length);
    });

    it('has valid country codes', () => {
        countries.forEach((country) => {
            expect(country.code).toMatch(/^[A-Z]{2}$/);
        });
    });

    it('has valid continent assignments', () => {
        countries.forEach((country) => {
            expect(validContinents).toContain(country.continent);
        });
    });

    it('has all required country properties', () => {
        countries.forEach((country) => {
            expect(country.name.trim()).not.toBe('');
            expect(country.capital.trim()).not.toBe('');
            expect(country.flag).toMatch(/^[a-z]{2}\.svg$/);
            expect(country.flagSource.trim()).not.toBe('');
            expect(country.flag).toBe(`${country.code.toLowerCase()}.svg`);
        });
    });

    it('can filter countries by continent', () => {
        const europeanCountries = getCountriesByContinents([
            'Europe',
        ]);

        expect(europeanCountries.length).toBeGreaterThan(0);

        expect(
            europeanCountries.every(
                (country) => country.continent === 'Europe',
            ),
        ).toBe(true);
    });

    it('supports selecting multiple continents', () => {
        const selectedCountries = getCountriesByContinents([
            'Europe',
            'Asia',
        ]);

        expect(
            selectedCountries.every((country) =>
                ['Europe', 'Asia'].includes(country.continent),
            ),
        ).toBe(true);
    });

    it('generates deployment-safe flag URLs', () => {
        const netherlands = countries.find(
            (country) => country.code === 'NL',
        );

        expect(netherlands).toBeDefined();

        expect(getFlagUrl(netherlands!)).toMatch(
            /\/flags\/nl\.svg$/,
        );
    });
});
