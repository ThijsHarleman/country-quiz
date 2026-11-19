import { useState } from 'react';
import type { SubmitEvent } from 'react';

import type { Continent } from '../../../types/country';
import type { QuizConfig, QuizMode } from '../types';

import styles from './QuizSetup.module.css';

interface QuizSetupProps {
    onStart: (config: QuizConfig) => void;
}

const CONTINENTS: { value: Continent; label: string }[] = [
    { value: 'Africa', label: 'Afrika' },
    { value: 'Asia', label: 'Azië' },
    { value: 'Europe', label: 'Europa' },
    { value: 'North America', label: 'Noord-Amerika' },
    { value: 'South America', label: 'Zuid-Amerika' },
    { value: 'Oceania', label: 'Oceanië' },
];

export function QuizSetup({ onStart }: QuizSetupProps) {
    const [selectedContinents, setSelectedContinents] =
        useState<Continent[]>(CONTINENTS.map(({ value }) => value));

    const [mode, setMode] = useState<QuizMode>('flags');

    const allSelected =
        selectedContinents.length === CONTINENTS.length;

    function toggleContinent(continent: Continent) {
        setSelectedContinents((current) =>
            current.includes(continent)
                ? current.filter((item) => item !== continent)
                : [...current, continent],
        );
    }

    function toggleAllContinents() {
        setSelectedContinents(
            allSelected ? [] : CONTINENTS.map(({ value }) => value),
        );
    }

    function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
        event.preventDefault();

        if (selectedContinents.length === 0) {
            return;
        }

        onStart({
            mode,
            continents: selectedContinents,
        });
    }

    return (
        <form className={styles.container} onSubmit={handleSubmit}>
            <fieldset className={styles.fieldset}>
                <legend className={styles.legend}>Welke continenten?</legend>

                <label className={styles.option}>
                    <input
                        type="checkbox"
                        checked={allSelected}
                        onChange={toggleAllContinents}
                    />
                    <span>Alle continenten</span>
                </label>

                <div className={styles.continentGrid}>
                    {CONTINENTS.map(({ value, label }) => (
                        <label className={styles.option} key={value}>
                            <input
                                type="checkbox"
                                checked={selectedContinents.includes(value)}
                                onChange={() => toggleContinent(value)}
                            />
                            <span>{label}</span>
                        </label>
                    ))}
                </div>
            </fieldset>

            <fieldset className={styles.fieldset}>
                <legend className={styles.legend}>Wat wil je oefenen?</legend>

                <label className={styles.option}>
                    <input
                        type="radio"
                        name="quizMode"
                        value="flags"
                        checked={mode === 'flags'}
                        onChange={() => setMode('flags')}
                    />
                    <span>Vlaggen</span>
                </label>

                <label className={styles.option}>
                    <input
                        type="radio"
                        name="quizMode"
                        value="capitals"
                        checked={mode === 'capitals'}
                        onChange={() => setMode('capitals')}
                    />
                    <span>Hoofdsteden</span>
                </label>
            </fieldset>

            <button
                className={styles.startButton}
                type="submit"
                autoFocus
                disabled={selectedContinents.length === 0}
            >
                Start quiz
            </button>

            {selectedContinents.length === 0 && (
                <p className={styles.hint} role="status">
                    Selecteer minstens één continent om te beginnen.
                </p>
            )}
        </form>
    );
}
