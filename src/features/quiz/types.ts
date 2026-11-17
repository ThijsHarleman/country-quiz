import type { Country, Continent } from '../../types/country';

export type QuizMode = 'flags' | 'capitals';

export type QuizStatus =
    | 'setup'
    | 'playing'
    | 'feedback'
    | 'completed';

export interface AnswerResult {
    country: Country;
    selectedCountry: Country;
    isCorrect: boolean;
}

export interface QuizState {
    status: QuizStatus;
    mode: QuizMode;
    selectedContinents: Continent[];
    questions: Country[];
    currentQuestionIndex: number;
    answers: AnswerResult[];
    currentResult: AnswerResult | null;
}

export interface QuizConfig {
    mode: QuizMode;
    continents: Continent[];
}
