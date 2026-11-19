import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import type { Country } from '../../../types/country';
import { getFlagUrl } from '../../../data/countries';
import { createQuiz, submitAnswer } from '../utils/quizLogic';
import type { QuizMode } from '../types';
import { QuizSession } from './QuizSession';

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

function createTestState(mode: QuizMode = 'flags') {
    return createQuiz(
        {
            mode,
            continents: ['Europe'],
        },
        testCountries,
        () => 0,
    );
}

describe('QuizSession', () => {
    it('displays the current question and progress', () => {
        const state = createTestState();

        render(
            <QuizSession
                state={state}
                onAnswer={vi.fn()}
                onNext={vi.fn()}
            />,
        );

        expect(screen.getByText('Vraag 1 van 2')).toBeInTheDocument();
        expect(
            screen.getByText('Van welk land is deze vlag?'),
        ).toBeInTheDocument();
        expect(screen.getByRole('progressbar')).toHaveAttribute('value', '1');
    });

    it('displays the current flag in flag mode', () => {
        const state = createTestState('flags');
        const currentQuestion = state.questions[0];

        render(
            <QuizSession
                state={state}
                onAnswer={vi.fn()}
                onNext={vi.fn()}
            />,
        );

        expect(screen.getByRole('img', { name: 'Te raden vlag' })).toHaveAttribute(
            'src',
            getFlagUrl(currentQuestion),
        );
    });

    it('displays the capital in capitals mode', () => {
        const state = createTestState('capitals');
        const currentQuestion = state.questions[0];

        render(
            <QuizSession
                state={state}
                onAnswer={vi.fn()}
                onNext={vi.fn()}
            />,
        );

        expect(
            screen.getByText('Bij welk land hoort deze hoofdstad?'),
        ).toBeInTheDocument();
        expect(screen.getByText(currentQuestion.capital)).toBeInTheDocument();
    });

    it('passes the selected country to onAnswer', async () => {
        const user = userEvent.setup();
        const state = createTestState();
        const onAnswer = vi.fn();

        render(
            <QuizSession
                state={state}
                onAnswer={onAnswer}
                onNext={vi.fn()}
            />,
        );

        const input = screen.getByRole('combobox');
        await user.type(input, state.questions[0].name.slice(0, 3));

        await user.click(
            screen.getByRole('option', { name: state.questions[0].name }),
        );

        expect(onAnswer).toHaveBeenCalledWith(state.questions[0]);
    });

    it('displays correct-answer feedback', () => {
        const initialState = createTestState();
        const correctAnswer = initialState.questions[0];
        const state = submitAnswer(initialState, correctAnswer);

        render(
            <QuizSession
                state={state}
                onAnswer={vi.fn()}
                onNext={vi.fn()}
            />,
        );

        expect(screen.getByText('Goed gedaan!')).toBeInTheDocument();
        expect(
            screen.getByText(`Je antwoord ${correctAnswer.name} is juist.`),
        ).toBeInTheDocument();
        expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
    });

    it('displays the correct country after an incorrect answer', () => {
        const initialState = createTestState();
        const correctAnswer = initialState.questions[0];
        const incorrectAnswer = initialState.questions[1];
        const state = submitAnswer(initialState, incorrectAnswer);

        render(
            <QuizSession
                state={state}
                onAnswer={vi.fn()}
                onNext={vi.fn()}
            />,
        );

        expect(
            screen.getByText('Helaas, dat is niet juist.'),
        ).toBeInTheDocument();
        expect(
            screen.getByText(`Het juiste antwoord is ${correctAnswer.name}.`),
        ).toBeInTheDocument();
    });

    it('calls onNext when the player continues', async () => {
        const user = userEvent.setup();
        const initialState = createTestState();
        const state = submitAnswer(initialState, initialState.questions[0]);
        const onNext = vi.fn();

        render(
            <QuizSession
                state={state}
                onAnswer={vi.fn()}
                onNext={onNext}
            />,
        );

        await user.click(screen.getByRole('button', { name: 'Volgende vraag' }));

        expect(onNext).toHaveBeenCalledOnce();
    });

    it('uses the result button on the last question', () => {
        const initialState = createTestState();
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
        const finalState = submitAnswer(
            nextState,
            nextState.questions[1],
        );

        render(
            <QuizSession
                state={finalState}
                onAnswer={vi.fn()}
                onNext={vi.fn()}
            />,
        );

        expect(
            screen.getByRole('button', { name: 'Bekijk resultaat' }),
        ).toBeInTheDocument();
    });
});
