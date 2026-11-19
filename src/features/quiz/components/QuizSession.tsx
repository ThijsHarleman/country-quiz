import type { QuizState } from '../types';
import { getCurrentQuestion } from '../utils/quizLogic';
import { getFlagUrl } from '../../../data/countries';
import { CountryAutocomplete } from './CountryAutocomplete';

import styles from './QuizSession.module.css';

interface QuizSessionProps {
    state: QuizState;
    onAnswer: (country: QuizState['questions'][number]) => void;
    onNext: () => void;
}

export function QuizSession({
    state,
    onAnswer,
    onNext,
}: QuizSessionProps) {
    const currentQuestion = getCurrentQuestion(state);

    if (!currentQuestion) {
        return null;
    }

    const isFeedback = state.status === 'feedback';
    const result = state.currentResult;

    const progress = state.currentQuestionIndex + 1;
    const total = state.questions.length;
    const isLastQuestion = progress === total;

    return (
        <section className={styles.container} aria-label="Quiz">
            <div className={styles.progressSection}>
                <div className={styles.progressText}>
                    <span>Vraag {progress} van {total}</span>
                    <span>{Math.round((progress / total) * 100)}%</span>
                </div>

                <progress
                    className={styles.progressBar}
                    value={progress}
                    max={total}
                    aria-label="Voortgang van de quiz"
                />
            </div>

            <div className={styles.question}>
                <h2 className={styles.prompt}>
                    {state.mode === 'flags'
                        ? 'Van welk land is deze vlag?'
                        : 'Bij welk land hoort deze hoofdstad?'}
                </h2>

                {state.mode === 'flags' ? (
                    <div className={styles.flagContainer}>
                        <img
                            className={styles.flag}
                            src={getFlagUrl(currentQuestion)}
                            alt="Te raden vlag"
                        />
                    </div>
                ) : (
                    <p className={styles.capital}>
                        {currentQuestion.capital}
                    </p>
                )}
            </div>

            {!isFeedback && (
                <CountryAutocomplete
                    onSelect={onAnswer}
                    countries={state.questions}
                />
            )}

            {isFeedback && result && (
                <div
                    className={`${styles.feedback} ${result.isCorrect ? styles.correct : styles.incorrect
                        }`}
                    role="status"
                    aria-live="polite"
                >
                    <h3>
                        {result.isCorrect ? 'Goed gedaan!' : 'Helaas, dat is niet juist.'}
                    </h3>

                    <p>
                        {result.isCorrect
                            ? `Je antwoord ${result.selectedCountry.name} is juist.`
                            : `Het juiste antwoord is ${result.country.name}.`}
                    </p>

                    <button
                        className={styles.nextButton}
                        type="button"
                        autoFocus
                        onClick={onNext}
                    >
                        {isLastQuestion ? 'Bekijk resultaat' : 'Volgende vraag'}
                    </button>
                </div>
            )}
        </section>
    );
}
