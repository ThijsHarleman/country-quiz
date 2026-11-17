import type { Country } from '../../../types/country';

import type {
    AnswerResult,
    QuizConfig,
    QuizState,
} from '../types';

export function shuffleCountries<T>(
    items: T[],
    random: () => number = Math.random,
): T[] {
    const shuffled = [...items];

    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(random() * (i + 1));

        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    return shuffled;
}

export function createQuiz(
    config: QuizConfig,
    countries: Country[],
    random: () => number = Math.random,
): QuizState {
    if (config.continents.length === 0) {
        throw new Error('Select at least one continent.');
    }

    const selectedCountries = countries.filter((country) =>
        config.continents.includes(country.continent),
    );

    if (selectedCountries.length === 0) {
        throw new Error('No countries found for the selected continents.');
    }

    return {
        status: 'playing',
        mode: config.mode,
        selectedContinents: [...config.continents],
        questions: shuffleCountries(selectedCountries, random),
        currentQuestionIndex: 0,
        answers: [],
        currentResult: null,
    };
}

export function getCurrentQuestion(
    state: QuizState,
): Country | null {
    if (
        state.status === 'setup' ||
        state.status === 'completed'
    ) {
        return null;
    }

    return state.questions[state.currentQuestionIndex] ?? null;
}

export function submitAnswer(
    state: QuizState,
    selectedCountry: Country,
): QuizState {
    if (state.status !== 'playing') {
        throw new Error('Answers can only be submitted while playing.');
    }

    const country = getCurrentQuestion(state);

    if (!country) {
        throw new Error('No current question available.');
    }

    const isValidSelection = state.questions.some(
        (question) => question.code === selectedCountry.code,
    );

    if (!isValidSelection) {
        throw new Error('Selected country is not part of this quiz.');
    }

    const result: AnswerResult = {
        country,
        selectedCountry,
        isCorrect: country.code === selectedCountry.code,
    };

    return {
        ...state,
        status: 'feedback',
        answers: [...state.answers, result],
        currentResult: result,
    };
}

export function advanceQuiz(state: QuizState): QuizState {
    if (state.status !== 'feedback') {
        throw new Error('Quiz can only advance after feedback.');
    }

    const nextQuestionIndex = state.currentQuestionIndex + 1;

    if (nextQuestionIndex >= state.questions.length) {
        return {
            ...state,
            status: 'completed',
            currentResult: null,
        };
    }

    return {
        ...state,
        status: 'playing',
        currentQuestionIndex: nextQuestionIndex,
        currentResult: null,
    };
}

export function calculateScore(answers: AnswerResult[]) {
    const correct = answers.filter(
        (answer) => answer.isCorrect,
    ).length;

    const total = answers.length;
    const incorrect = total - correct;

    return {
        correct,
        incorrect,
        total,
        percentage: total === 0
            ? 0
            : Math.round((correct / total) * 100),
    };
}

export function isQuizComplete(state: QuizState): boolean {
    return state.status === 'completed';
}
