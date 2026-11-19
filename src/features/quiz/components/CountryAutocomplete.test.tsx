import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import type { Country } from '../../../types/country';
import { CountryAutocomplete } from './CountryAutocomplete'

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
        code: 'DE',
        name: 'Duitsland',
        capital: 'Berlijn',
        continent: 'Europe',
        flag: 'de.svg',
        flagSource: 'Flag of Germany.svg',
    },
];

describe('CountryAutocomplete', () => {
    it('renders a labelled input', () => {
        render(
            <CountryAutocomplete
                countries={testCountries}
                onSelect={vi.fn()}
            />,
        );

        expect(
            screen.getByRole('combobox', { name: 'Land' }),
        ).toBeInTheDocument();
    });

    it('does not show suggestions before two characters', async () => {
        const user = userEvent.setup();

        render(
            <CountryAutocomplete
                countries={testCountries}
                onSelect={vi.fn()}
            />,
        );

        await user.type(
            screen.getByRole('combobox'),
            'N',
        );

        expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    });

    it('shows matching suggestions after two characters', async () => {
        const user = userEvent.setup();

        render(
            <CountryAutocomplete
                countries={testCountries}
                onSelect={vi.fn()}
            />,
        );

        await user.type(
            screen.getByRole('combobox'),
            'Ne',
        );

        expect(
            screen.getByRole('option', { name: 'Nederland' }),
        ).toBeInTheDocument();
    });

    it('selects a country when a suggestion is clicked', async () => {
        const user = userEvent.setup();
        const onSelect = vi.fn();

        render(
            <CountryAutocomplete
                countries={testCountries}
                onSelect={onSelect}
            />,
        );

        await user.type(
            screen.getByRole('combobox'),
            'Por',
        );

        await user.click(
            screen.getByRole('option', { name: 'Portugal' }),
        );

        expect(onSelect).toHaveBeenCalledWith(testCountries[1]);
        expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
        expect(screen.getByRole('combobox')).toHaveValue('');
    });

    it('selects the active suggestion with Enter', async () => {
        const user = userEvent.setup();
        const onSelect = vi.fn();

        render(
            <CountryAutocomplete
                countries={testCountries}
                onSelect={onSelect}
            />,
        );

        const input = screen.getByRole('combobox');

        await user.type(input, 'Ne');
        await user.keyboard('{ArrowDown}');
        await user.keyboard('{Enter}');

        expect(onSelect).toHaveBeenCalledWith(testCountries[0]);
    });

    it('supports navigating suggestions with arrow keys', async () => {
        const user = userEvent.setup();

        render(
            <CountryAutocomplete
                countries={testCountries}
                onSelect={vi.fn()}
            />,
        );

        const input = screen.getByRole('combobox');

        // "an" matches both Nederland and Duitsland.
        await user.type(input, 'an');

        const options = screen.getAllByRole('option');
        expect(options.length).toBeGreaterThan(1);

        await user.keyboard('{ArrowDown}');

        const firstActiveOption = input.getAttribute(
            'aria-activedescendant',
        );

        expect(firstActiveOption).toBeTruthy();

        await user.keyboard('{ArrowDown}');

        expect(input.getAttribute('aria-activedescendant')).not.toBe(
            firstActiveOption,
        );
    });

    it('closes suggestions when Escape is pressed', async () => {
        const user = userEvent.setup();

        render(
            <CountryAutocomplete
                countries={testCountries}
                onSelect={vi.fn()}
            />,
        );

        const input = screen.getByRole('combobox');

        await user.type(input, 'Ne');

        expect(screen.getByRole('listbox')).toBeInTheDocument();

        await user.keyboard('{Escape}');

        expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    });

    it('shows a message when there are no matching countries', async () => {
        const user = userEvent.setup();

        render(
            <CountryAutocomplete
                countries={testCountries}
                onSelect={vi.fn()}
            />,
        );

        await user.type(
            screen.getByRole('combobox'),
            'xyz',
        );

        expect(
            screen.getByText('Geen landen gevonden.'),
        ).toBeInTheDocument();
    });

    it('does not allow interaction when disabled', async () => {
        const user = userEvent.setup();
        const onSelect = vi.fn();

        render(
            <CountryAutocomplete
                countries={testCountries}
                onSelect={onSelect}
                disabled
            />,
        );

        const input = screen.getByRole('combobox');

        expect(input).toBeDisabled();

        await user.type(input, 'Ne');

        expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
        expect(onSelect).not.toHaveBeenCalled();
    });
});
