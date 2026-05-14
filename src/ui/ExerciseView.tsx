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

const emojiPool = ['❓','🤔','🧐','❔','💭','🎯','🔎'];

interface SubmitPayload extends Record<string, unknown> {
  correct: boolean;
  selectedIndex: number | null;
}

interface ExerciseViewProps {
  exercise: Exercise | null;
  onSubmit: (answer: SubmitPayload) => void | Promise<void>;
  allowHints?: boolean;
}

type NoteData = { keys: string[]; duration: string };

type ExerciseData = {
  notes?: NoteData[];
  timeSignature?: string;
  clef?: string;
  alternatives?: string[];
  correct_index?: number;
  [k: string]: unknown;
};

export const ExerciseView: React.FC<ExerciseViewProps> = ({
  exercise,
  onSubmit,
  allowHints
}) => {

  const vexRef = useRef<HTMLDivElement>(null);

  const [elapsedTime, setElapsedTime] = useState(0);
  const [showHint, setShowHint] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  // normalize
  const src = React.useMemo(() => {
    return ((exercise as any)?.exercise ?? exercise);
  }, [exercise]);

  const data = React.useMemo(() => {
    return ((src?.data ?? (exercise as any)?.data ?? {}) as ExerciseData);
  }, [src, exercise]);

  const hintUnlockTime = Number(src?.hintUnlockTime ?? exercise?.hintUnlockTime ?? 10);
  const isHintUnlocked = elapsedTime >= hintUnlockTime;

  const alternatives = data?.alternatives ?? [];
  const correctIndex = typeof data?.correct_index === 'number' ? data.correct_index : undefined;

  const hasNotes = Array.isArray(data?.notes) && data.notes.length > 0;

  const difficulty = Math.min(
    4,
    Math.max(1, Number(src?.difficulty ?? exercise?.difficulty ?? 1))
  );

  // emojis deterministic
  const randomEmojis = React.useMemo(() => {
    const seedStr = String(src?.prompt ?? '');
    let hash = 0;

    for (let i = 0; i < seedStr.length; i++) {
      const cp = seedStr.codePointAt(i) ?? 0;
      hash = Math.trunc(hash * 31 + cp);
    }

    return [0, 1, 2].map(i => {
      const idx = Math.abs((hash + i) % emojiPool.length);
      return emojiPool[idx];
    });
  }, [src?.prompt]);

  // TIMER (FIXED)
  useEffect(() => {
    const timer = setInterval(() => {
      setElapsedTime(s => s + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // VEXFLOW (STABLE VERSION)
  useEffect(() => {
    if (!vexRef.current) return;
    if (!Array.isArray(data?.notes) || data.notes.length === 0) return;
    if (!data?.clef) return;

    let cancelled = false;

    try {
      vexRef.current.innerHTML = '';

      const renderer = new Renderer(
        vexRef.current,
        Renderer.Backends.SVG
      );

      renderer.resize(400, 160);

      const context = renderer.getContext();
      context.setFont('Arial', 10, '').setBackgroundFillStyle('#fff');

      const stave = new Stave(10, 40, 380);

      if (data.clef) stave.addClef(data.clef);
      if (data.timeSignature) stave.addTimeSignature(data.timeSignature);

      stave.setContext(context).draw();

      const notesData = data.notes;

      const notes = notesData
        .map(n => {
          if (!n?.keys || !n?.duration) return null;

          return new StaveNote({
            keys: n.keys,
            duration: n.duration,
            clef: data.clef || 'treble'
          });
        })
        .filter(Boolean);

      if (!notes.length) return;

      const durationValues: Record<string, number> = {
        w: 4, h: 2, q: 1,
        '8': 0.5, '16': 0.25, '32': 0.125,
        wr: 4, hr: 2, qr: 1,
        '8r': 0.5, '16r': 0.25, '32r': 0.125
      };

      const totalBeats = notesData.reduce((s, n) => {
        return s + (durationValues[n.duration] || 1);
      }, 0);

      const voice = new Voice({
        numBeats: Math.max(totalBeats, 1),
        beatValue: 4
      });

      voice.addTickables(notes);

      new Formatter()
        .joinVoices([voice])
        .format([voice], 350);

      if (!cancelled) {
        voice.draw(context, stave);
      }

    } catch (err) {
      console.error('VEXFLOW ERROR', err);
    }

    return () => {
      cancelled = true;
    };

  }, [
    data?.clef,
    data?.timeSignature,
    JSON.stringify(data?.notes)
  ]);

  if (!exercise) {
    return (
      <div className={styles.container}>
        <p>Cargando ejercicio...</p>
      </div>
    );
  }

  function handleSubmit() {
    let correct = true;

    if (alternatives && alternatives.length > 0) {
      if (typeof correctIndex === 'number') {
        correct = selectedIndex === correctIndex;
      } else {
        correct = selectedIndex !== null;
      }
    }

    try {
      const ret = onSubmit({ correct, selectedIndex });

      Promise.resolve(ret).catch(e =>
        console.error('[ExerciseView] onSubmit async error', e)
      );

    } catch (e) {
      console.error('[ExerciseView] onSubmit error', e);
    }
  }

  const displayType = String(src?.type ?? exercise?.type ?? 'teorico');
  const displayPrompt = String(src?.prompt ?? exercise?.prompt ?? '');

  return (
    <div className={styles.container}>

      <div className={styles.header}>
        <h2 className={styles.title}>
          <span className={styles.badge}>
            {displayType === 'rhythm' ? '🎵' : '🎶'}
          </span>

          {displayType.charAt(0).toUpperCase() + displayType.slice(1)}
        </h2>

        <p className={styles.prompt}>{displayPrompt}</p>
      </div>

      <div className={styles.scoreIndicator}>
        <span className={styles.difficulty}>
          Dificultad: {difficulty}/4
        </span>
      </div>

      {hasNotes ? (
        <div className={styles.staffContainer}>
          <div ref={vexRef} className={styles.staff} />
        </div>
      ) : (
        <div className={styles.placeholder}>
          <div className={styles.placeholderEmojis}>
            {randomEmojis.map((e, i) => (
              <span key={i}>{e}</span>
            ))}
          </div>
        </div>
      )}

      {alternatives.length > 0 && (
        <div className={styles.choices}>
          {alternatives.map((alt, i) => (
            <button
              key={i}
              className={`${styles.choiceBtn} ${selectedIndex === i ? styles.selected : ''}`}
              onClick={() => setSelectedIndex(i)}
            >
              <span>{String.fromCodePoint(65 + i)}.</span>
              <span>{alt}</span>
            </button>
          ))}
        </div>
      )}

      <div className={styles.actions}>
        <button
          className={styles.submitBtn}
          onClick={handleSubmit}
          disabled={alternatives.length > 0 ? selectedIndex === null : false}
        >
          ✓ Enviar respuesta
        </button>

        {allowHints && exercise?.hint && (
          <button
            className={styles.hintBtn}
            onClick={() => {
              if (isHintUnlocked) setShowHint(!showHint);
            }}
            disabled={!isHintUnlocked}
          >
            {showHint ? '✕ Ocultar' : '💡 ¿Cómo resolver?'}
            {!isHintUnlocked && (
              <span>
                {hintUnlockTime - elapsedTime}s
              </span>
            )}
          </button>
        )}
      </div>

      {showHint && exercise?.hint && (
        <div className={styles.hintBox}>
          <p>{exercise.hint}</p>
        </div>
      )}

    </div>
  );
};