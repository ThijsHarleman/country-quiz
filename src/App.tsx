import { useState } from 'react';

import { countries } from './data/countries';
import { QuizResults } from './features/quiz/components/QuizResults';
import { QuizSession } from './features/quiz/components/QuizSession';
import { QuizSetup } from './features/quiz/components/QuizSetup';
import type { QuizState } from './features/quiz/types';
import {
  advanceQuiz,
  createQuiz,
  submitAnswer,
} from './features/quiz/utils/quizLogic';
import type { Country } from './types/country';

import styles from './App.module.css';

function App() {
  const [quizState, setQuizState] = useState<QuizState | null>(null);

  function handleStart(config: Parameters<typeof createQuiz>[0]) {
    setQuizState(createQuiz(config, countries));
  }

  function handleAnswer(country: Country) {
    setQuizState((currentState) => {
      if (!currentState) {
        return currentState;
      }

      return submitAnswer(currentState, country);
    });
  }

  function handleNext() {
    setQuizState((currentState) => {
      if (!currentState) {
        return currentState;
      }

      return advanceQuiz(currentState);
    });
  }

  function handleRestart() {
    setQuizState(null);
  }

  return (
    <main className={styles.page}>
      <div className={styles.app}>
        <header className={styles.header}>
          <h1 className={styles.title}>Wereldlanden Quiz</h1>
          <p className={styles.subtitle}>
            Hoe goed ken jij de landen van de wereld?
          </p>
        </header>

        <div className={styles.content}>
          {!quizState && (
            <QuizSetup onStart={handleStart} />
          )}

          {quizState?.status === 'playing' ||
            quizState?.status === 'feedback' ? (
            <QuizSession
              state={quizState}
              onAnswer={handleAnswer}
              onNext={handleNext}
            />
          ) : null}

          {quizState?.status === 'completed' && (
            <QuizResults
              state={quizState}
              onRestart={handleRestart}
            />
          )}
        </div>
      </div>
    </main>
  );
}

export default App;
