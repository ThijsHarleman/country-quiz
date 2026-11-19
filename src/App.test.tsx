import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import App from './App';
import { countries, getFlagUrl } from './data/countries';

describe('App', () => {
    it('connects setup, answering, and quiz progression', async () => {
        const user = userEvent.setup();

        render(<App />);

        // Start a quiz with the default settings.
        await user.click(
            screen.getByRole('button', { name: 'Start quiz' }),
        );

        // Identify the country represented by the displayed flag.
        const flag = screen.getByRole('img', { name: 'Te raden vlag' });
        const flagUrl = flag.getAttribute('src');

        const currentCountry = countries.find(
            (country) => getFlagUrl(country) === flagUrl,
        );

        expect(currentCountry).toBeDefined();

        // Select that country using the autocomplete.
        const input = screen.getByRole('combobox');
        await user.type(input, currentCountry!.name.slice(0, 2));

        await user.click(
            screen.getByRole('option', { name: currentCountry!.name }),
        );

        // The answer should produce feedback.
        expect(
            screen.getByText(`Je antwoord ${currentCountry!.name} is juist.`),
        ).toBeInTheDocument();

        // Continue to the next question.
        await user.click(
            screen.getByRole('button', { name: 'Volgende vraag' }),
        );

        expect(screen.getByText(/Vraag 2 van/)).toBeInTheDocument();
    });
});
