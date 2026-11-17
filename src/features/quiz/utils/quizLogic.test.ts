import { describe, it, expect } from 'vitest';

import {
    shuffleCountries,
    createQuiz,
    getCurrentQuestion,
    submitAnswer,
    advanceQuiz,
    calculateScore,
    isQuizComplete,
} from './quizLogic';

import type { Country } from '../../../types/country';
import type { AnswerResult, QuizConfig } from '../types';

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
    {
        code: 'JP',
        name: 'Japan',
        capital: 'Tokio',
        continent: 'Asia',
        flag: 'jp.svg',
        flagSource: 'Flag of Japan.svg',
    },
];

const europeConfig: QuizConfig = {
    mode: 'flags',
    continents: ['Europe'],
};

describe('shuffleCountries', () => {
    it('returns a new array without modifying the original', () => {
        const original = [...testCountries];

        const shuffled = shuffleCountries(
            testCountries,
            () => 0,
        );

        expect(shuffled).not.toBe(testCountries);
        expect(testCountries).toEqual(original);
        expect(shuffled).toHaveLength(testCountries.length);
    });

    it('preserves all original items', () => {
        const shuffled = shuffleCountries(
            testCountries,
            () => 0.5,
        );

        expect(
            shuffled.map((country) => country.code).sort(),
        ).toEqual(
            testCountries.map((country) => country.code).sort(),
        );
    });
});

describe('createQuiz', () => {
    it('creates a quiz containing only selected continents', () => {
        const state = createQuiz(
            europeConfig,
            testCountries,
            () => 0.5,
        );

        expect(state.status).toBe('playing');
        expect(state.questions).toHaveLength(2);

        expect(
            state.questions.every(
                (country) => country.continent === 'Europe',
            ),
        ).toBe(true);
    });

    it('supports multiple selected continents', () => {
        const state = createQuiz(
            {
                mode: 'capitals',
                continents: ['Europe', 'Asia'],
            },
            testCountries,
        );

        expect(state.questions).toHaveLength(3);
    });

    it('throws an error if no continent is selected', () => {
        expect(() =>
            createQuiz(
                { mode: 'flags', continents: [] },
                testCountries,
            ),
        ).toThrow('Select at least one continent.');
    });

    it('throws an error if no countries match', () => {
        expect(() =>
            createQuiz(
                { mode: 'flags', continents: ['Africa'] },
                testCountries,
            ),
        ).toThrow('No countries found');
    });
});

describe('quiz progression', () => {
    it('returns the current question', () => {
        const state = createQuiz(
            europeConfig,
            testCountries,
            () => 0.5,
        );

        expect(getCurrentQuestion(state)).not.toBeNull();
    });

    it('records a correct answer', () => {
        const state = createQuiz(
            europeConfig,
            testCountries,
            () => 0.5,
        );

        const currentQuestion = getCurrentQuestion(state)!;

        const nextState = submitAnswer(
            state,
            currentQuestion,
        );

        expect(nextState.status).toBe('feedback');
        expect(nextState.answers).toHaveLength(1);
        expect(nextState.currentResult?.isCorrect).toBe(true);
    });

    it('records an incorrect answer', () => {
        const state = createQuiz(
            europeConfig,
            testCountries,
            () => 0.5,
        );

        const currentQuestion = getCurrentQuestion(state)!;

        const incorrectCountry = testCountries.find(
            (country) => country.code !== currentQuestion.code,
        )!;

        const nextState = submitAnswer(
            state,
            incorrectCountry,
        );

        expect(nextState.currentResult?.isCorrect).toBe(false);
    });

    it('does not allow submitting an answer twice', () => {
        const state = createQuiz(
            europeConfig,
            testCountries,
            () => 0.5,
        );

        const question = getCurrentQuestion(state)!;

        const feedbackState = submitAnswer(state, question);

        expect(() =>
            submitAnswer(feedbackState, question),
        ).toThrow('Answers can only be submitted while playing.');
    });

    it('advances to the next question', () => {
        const state = createQuiz(
            europeConfig,
            testCountries,
            () => 0.5,
        );

        const question = getCurrentQuestion(state)!;

        const feedbackState = submitAnswer(state, question);
        const nextState = advanceQuiz(feedbackState);

        expect(nextState.status).toBe('playing');
        expect(nextState.currentQuestionIndex).toBe(1);
        expect(nextState.currentResult).toBeNull();
    });

    it('completes the quiz after the final answer', () => {
        let state = createQuiz(
            europeConfig,
            testCountries,
            () => 0.5,
        );

        while (state.status !== 'completed') {
            const question = getCurrentQuestion(state)!;

            state = submitAnswer(state, question);
            state = advanceQuiz(state);
        }

        expect(isQuizComplete(state)).toBe(true);
        expect(state.answers).toHaveLength(2);
    });
});

describe('calculateScore', () => {
    it('calculates correct and incorrect answers', () => {
        const answers: AnswerResult[] = [
            {
                country: testCountries[0],
                selectedCountry: testCountries[0],
                isCorrect: true,
            },
            {
                country: testCountries[1],
                selectedCountry: testCountries[0],
                isCorrect: false,
            },
            {
                country: testCountries[2],
                selectedCountry: testCountries[2],
                isCorrect: true,
            },
        ];

        expect(calculateScore(answers)).toEqual({
            correct: 2,
            incorrect: 1,
            total: 3,
            percentage: 67,
        });
    });

    it('handles an empty answer list', () => {
        expect(calculateScore([])).toEqual({
            correct: 0,
            incorrect: 0,
            total: 0,
            percentage: 0,
        });
    });
});
