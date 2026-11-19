import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import type { Country } from '../../../types/country';
import { createQuiz, submitAnswer } from '../utils/quizLogic';
import { QuizResults } from './QuizResults';

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
        code: 'DE',
        name: 'Duitsland',
        capital: 'Berlijn',
        continent: 'Europe',
        flag: 'de.svg',
        flagSource: 'Flag of Germany.svg',
    },
];

function createCompletedState() {
    const initialState = createQuiz(
        { modes: ['flags'], continents: ['Europe'] },
        testCountries,
        () => 0,
    );

    const firstAnswer = submitAnswer(
        initialState,
        initialState.questions[0],
    );

    const nextState = {
        ...firstAnswer,
        status: 'playing' as const,
        currentQuestionIndex: 1,
        currentResult: null,
    };

    return submitAnswer(nextState, initialState.questions[0]);
}

describe('QuizResults', () => {
    it('displays the final score', () => {
        const state = createCompletedState();

        render(<QuizResults state={state} onRestart={vi.fn()} />);

        expect(screen.getByText('Quiz afgerond!')).toBeInTheDocument();
        expect(screen.getByText('50%')).toBeInTheDocument();
        expect(screen.getByText('1 van de 2 goed')).toBeInTheDocument();
    });

    it('shows the correct answer for incorrect responses', () => {
        const state = createCompletedState();

        render(<QuizResults state={state} onRestart={vi.fn()} />);

        expect(
            screen.getByText(`Jouw antwoord: ${state.answers[1].selectedCountry.name}`),
        ).toBeInTheDocument();
    });

    it('calls onRestart when requested', async () => {
        const user = userEvent.setup();
        const onRestart = vi.fn();

        render(
            <QuizResults
                state={createCompletedState()}
                onRestart={onRestart}
            />,
        );

        await user.click(
            screen.getByRole('button', { name: 'Opnieuw beginnen' }),
        );

        expect(onRestart).toHaveBeenCalledOnce();
    });
});
