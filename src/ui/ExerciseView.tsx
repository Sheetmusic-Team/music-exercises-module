import React, { useEffect, useRef, useState } from 'react';
import type { Exercise } from '../types/exercise';
import styles from './ExerciseView.module.css';

import {
  Renderer,
  Stave,
  StaveNote,
  Voice,
  Formatter
} from 'vexflow';

interface ExerciseViewProps {
  exercise: Exercise | null;
  onSubmit: (answer: any) => void;
  allowHints?: boolean;
}

export const ExerciseView: React.FC<ExerciseViewProps> = ({
  exercise,
  onSubmit,
  allowHints
}) => {
  // Refs & state (hooks must be unconditional)
  const vexRef = useRef<HTMLDivElement>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [showHint, setShowHint] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  // Normalized data shape
  type NoteData = { keys: string[]; duration: string };
  type ExerciseData = {
    notes?: NoteData[];
    timeSignature?: string;
    clef?: string;
    alternatives?: string[];
    correct_index?: number;
    [k: string]: unknown;
  };

  const data = (exercise?.data || {}) as ExerciseData;
  const hintUnlockTime = (exercise?.hintUnlockTime as number | undefined) ?? 10;
  const isHintUnlocked = elapsedTime >= hintUnlockTime;

  const alternatives = (data.alternatives as string[]) || [];
  const correctIndex = typeof data.correct_index === 'number' ? data.correct_index : undefined;

  // TIMER
  useEffect(() => {
    const timer = setInterval(() => setElapsedTime((s) => s + 1), 1000);
    return () => clearInterval(timer);
  }, [hintUnlockTime]);

  // VEXFLOW render
  useEffect(() => {
    if (!vexRef.current) return;
    if (!exercise?.data) return;

    try {
      vexRef.current.innerHTML = '';
      const renderer = new Renderer(vexRef.current, Renderer.Backends.SVG);
      renderer.resize(400, 160);
      const context = renderer.getContext();
      context.setFont('Arial', 10, '').setBackgroundFillStyle('#fff');

      const stave = new Stave(10, 40, 380);
      if (data.clef) stave.addClef(data.clef);
      if (data.timeSignature) stave.addTimeSignature(data.timeSignature);
      stave.setContext(context).draw();

      const notesData = (data.notes || []) as NoteData[];
      if (!notesData.length) return;

      const notes = notesData.map((n) => new StaveNote({ keys: n.keys, duration: n.duration, clef: data.clef || 'treble' }));

      const durationValues: Record<string, number> = { w:4,h:2,q:1,'8':0.5,'16':0.25,'32':0.125, wr:4, hr:2, qr:1, '8r':0.5, '16r':0.25, '32r':0.125 };
      const totalBeats = notesData.reduce((s, n) => s + (durationValues[n.duration] || 1), 0);

      const voice = new Voice({ numBeats: Math.max(totalBeats, 1), beatValue: 4 });
      voice.addTickables(notes);
      new Formatter().joinVoices([voice]).format([voice], 350);
      voice.draw(context, stave);
    } catch (err) {
      console.error('VEXFLOW ERROR', err);
    }
    // We intentionally omit data.* from deps to keep the effect simple; it re-runs when exercise changes
  }, [exercise]);

  // Early render guard
  if (!exercise) {
    return (
      <div className={styles.container}>
        <p>Cargando ejercicio...</p>
      </div>
    );
  }

  // Submit handler uses selectedIndex + alternatives
  function handleSubmit() {
    let correct = true;
    if (alternatives && alternatives.length > 0) {
      if (typeof correctIndex === 'number') correct = selectedIndex === correctIndex;
      else correct = selectedIndex !== null;
    }
    onSubmit({ correct, selectedIndex });
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>
          <span className={styles.badge}>{exercise.type === 'rhythm' ? '🎵' : '🎶'}</span>
          {exercise.type.charAt(0).toUpperCase() + exercise.type.slice(1)}
        </h2>
        <p className={styles.prompt}>{exercise.prompt}</p>
      </div>

      <div className={styles.scoreIndicator}>
        <span className={styles.difficulty}>Dificultad: {exercise.difficulty}/5</span>
      </div>

      <div className={styles.staffContainer}>
        <div ref={vexRef} className={styles.staff} />
      </div>

      {alternatives && alternatives.length > 0 && (
        <div className={styles.choices}>
          {alternatives.map((alt, i) => (
            <button
              key={alt}
              className={`${styles.choiceBtn} ${selectedIndex === i ? styles.selected : ''}`}
              onClick={() => setSelectedIndex(i)}
              aria-pressed={selectedIndex === i}
            >
              <span className={styles.choiceLabel}>{String.fromCodePoint(65 + i)}.</span>
              <span className={styles.choiceText}>{alt}</span>
            </button>
          ))}
        </div>
      )}

      <div className={styles.actions}>
        <button className={styles.submitBtn} onClick={handleSubmit} disabled={alternatives.length > 0 ? selectedIndex === null : false}>
          ✓ Enviar respuesta
        </button>

        {allowHints && exercise.hint && (
          <button
            className={`${styles.hintBtn} ${isHintUnlocked ? '' : styles.disabled} ${showHint ? styles.active : ''}`}
            onClick={() => { if (isHintUnlocked) setShowHint(!showHint); }}
            disabled={!isHintUnlocked}
          >
            {showHint ? '✕ Ocultar' : '💡 ¿Cómo resolver?'}
            {!isHintUnlocked && <span className={styles.timer}>{hintUnlockTime - elapsedTime}s</span>}
          </button>
        )}
      </div>

      {showHint && exercise.hint && (
        <div className={styles.hintBox}><p>{exercise.hint}</p></div>
      )}
    </div>
  );
};
