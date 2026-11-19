import { describe, expect, it } from 'vitest';
import type { Country } from '../../../types/country';
import { searchCountries } from './countryMatching';

const testCountries: Country[] = [
    {
        code: 'NL',
        name: 'Nederland',
        capital: 'Amsterdam',
        continent: 'Europe',
        flag: 'nl.svg',
        flagSource: 'Flag of the Netherlands.svg',
    },
    {
        code: 'PT',
        name: 'Portugal',
        capital: 'Lissabon',
        continent: 'Europe',
        flag: 'pt.svg',
        flagSource: 'Flag of Portugal.svg',
    },
    {
        code: 'CW',
        name: 'Curaçao',
        capital: 'Willemstad',
        continent: 'North America',
        flag: 'cw.svg',
        flagSource: 'Flag of Curaçao.svg',
    },
    {
        code: 'DE',
        name: 'Duitsland',
        capital: 'Berlijn',
        continent: 'Europe',
        flag: 'de.svg',
        flagSource: 'Flag of Germany.svg',
    },
    {
        code: 'BE',
        name: 'België',
        capital: 'Brussel',
        continent: 'Europe',
        flag: 'be.svg',
        flagSource: 'Flag of Belgium.svg',
    },
];

describe('searchCountries', () => {
    it('finds an exact country name', () => {
        const results = searchCountries('Nederland', testCountries);

        expect(results[0].code).toBe('NL');
    });

    it('matches without accents', () => {
        const results = searchCountries('curacao', testCountries);

        expect(results[0].code).toBe('CW');
    });

    it('matches partial country names', () => {
        const results = searchCountries('port', testCountries);

        expect(results[0].code).toBe('PT');
    });

    it('handles small spelling mistakes', () => {
        const results = searchCountries('Nederlnd', testCountries);

        expect(results[0].code).toBe('NL');
    });

    it('is case-insensitive', () => {
        const results = searchCountries('DUITSLAND', testCountries);

        expect(results[0].code).toBe('DE');
    });

    it('returns no results for an empty query', () => {
        expect(searchCountries('', testCountries)).toEqual([]);
        expect(searchCountries('   ', testCountries)).toEqual([]);
    });

    it('limits the number of suggestions', () => {
        const results = searchCountries('e', testCountries, 2);

        expect(results).toHaveLength(2);
    });

    it('returns no more than five suggestions by default', () => {
        const results = searchCountries('e', testCountries);

        expect(results.length).toBeLessThanOrEqual(5);
    });

    it('returns no results when the limit is zero or negative', () => {
        expect(searchCountries('Nederland', testCountries, 0)).toEqual([]);
        expect(searchCountries('Nederland', testCountries, -1)).toEqual([]);
    });
});
