import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { QuizSetup } from './QuizSetup';

describe('QuizSetup', () => {
    it('selects all continents by default', () => {
        render(<QuizSetup onStart={vi.fn()} />);

        expect(screen.getByLabelText('Alle continenten')).toBeChecked();

        for (const label of [
            'Afrika',
            'Azië',
            'Europa',
            'Noord-Amerika',
            'Zuid-Amerika',
            'Oceanië',
        ]) {
            expect(screen.getByLabelText(label)).toBeChecked();
        }
    });

    it('allows selecting individual continents', async () => {
        const user = userEvent.setup();

        render(<QuizSetup onStart={vi.fn()} />);

        await user.click(screen.getByLabelText('Europa'));

        expect(screen.getByLabelText('Europa')).not.toBeChecked();
        expect(screen.getByLabelText('Afrika')).toBeChecked();
        expect(screen.getByLabelText('Alle continenten')).not.toBeChecked();
    });

    it('can select all continents again', async () => {
        const user = userEvent.setup();

        render(<QuizSetup onStart={vi.fn()} />);

        await user.click(screen.getByLabelText('Alle continenten'));
        expect(screen.getByLabelText('Alle continenten')).not.toBeChecked();

        await user.click(screen.getByLabelText('Alle continenten'));
        expect(screen.getByLabelText('Alle continenten')).toBeChecked();
    });

    it('allows choosing capitals mode', async () => {
        const user = userEvent.setup();

        render(<QuizSetup onStart={vi.fn()} />);

        await user.click(screen.getByLabelText('Vlaggen'));

        expect(screen.getByLabelText('Hoofdsteden')).toBeChecked();
        expect(screen.getByLabelText('Vlaggen')).not.toBeChecked();
    });

    it('starts the quiz with the selected configuration', async () => {
        const user = userEvent.setup();
        const onStart = vi.fn();

        render(<QuizSetup onStart={onStart} />);

        await user.click(screen.getByLabelText('Europa'));
        await user.click(screen.getByLabelText('Hoofdsteden'));
        await user.click(screen.getByRole('button', { name: 'Start quiz' }));

        expect(onStart).toHaveBeenCalledWith({
            modes: ['flags'],
            continents: [
                'Africa',
                'Asia',
                'North America',
                'South America',
                'Oceania',
            ],
        });
    });

    it('disables starting when no continent is selected', async () => {
        const user = userEvent.setup();
        const onStart = vi.fn();

        render(<QuizSetup onStart={onStart} />);

        await user.click(screen.getByLabelText('Alle continenten'));

        const startButton = screen.getByRole('button', {
            name: 'Start quiz',
        });

        expect(startButton).toBeDisabled();
        expect(
            screen.getByText('Selecteer minstens één continent om te beginnen.'),
        ).toBeInTheDocument();

        fireEvent.submit(startButton.closest('form')!);
        expect(onStart).not.toHaveBeenCalled();
    });
});
