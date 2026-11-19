import { calculateScore } from '../utils/quizLogic';
import type { QuizState } from '../types';

import styles from './QuizResults.module.css';

interface QuizResultsProps {
    state: QuizState;
    onRestart: () => void;
}

export function QuizResults({ state, onRestart }: QuizResultsProps) {
    const score = calculateScore(state.answers);

    return (
        <section className={styles.container} aria-labelledby="results-title">
            <h2 id="results-title" className={styles.title}>
                Quiz afgerond!
            </h2>

            <p className={styles.description}>
                Je hebt alle landen gehad. Dit is je resultaat:
            </p>

            <div className={styles.score}>
                <strong className={styles.percentage}>{score.percentage}%</strong>
                <span className={styles.scoreText}>
                    {score.correct} van de {score.total} goed
                </span>
            </div>

            <div className={styles.summary}>
                <p>
                    <span>Goed:</span>
                    <strong>{score.correct}</strong>
                </p>
                <p>
                    <span>Fout:</span>
                    <strong>{score.incorrect}</strong>
                </p>
            </div>

            <div className={styles.review}>
                <h3>Je antwoorden</h3>

                <ul className={styles.answerList}>
                    {state.answers.map((answer, index) => (
                        <li
                            key={`${answer.country.code}-${index}`}
                            className={styles.answer}
                        >
                            <span
                                className={
                                    answer.isCorrect ? styles.correct : styles.incorrect
                                }
                                aria-label={answer.isCorrect ? 'Goed' : 'Fout'}
                            >
                                {answer.isCorrect ? '✓' : '✗'}
                            </span>

                            <div>
                                <strong>{answer.country.name}</strong>

                                {!answer.isCorrect && (
                                    <p>Jouw antwoord: {answer.selectedCountry.name}</p>
                                )}
                            </div>
                        </li>
                    ))}
                </ul>
            </div>

            <button
                className={styles.restartButton}
                type="button"
                onClick={onRestart}
            >
                Opnieuw beginnen
            </button>
        </section>
    );
}
