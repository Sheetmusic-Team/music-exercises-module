// Vista de ejercicio musical
import React from 'react';
import type { Exercise } from '../types/exercise';
import styles from './ExerciseView.module.css';

import { useEffect, useRef } from 'react';
import { Renderer, Stave, StaveNote, Voice, Formatter } from 'vexflow';

interface ExerciseViewProps {
  exercise: Exercise;
  onSubmit: (answer: any) => void;
  allowHints?: boolean;
}

export const ExerciseView: React.FC<ExerciseViewProps> = ({ exercise, onSubmit, allowHints }) => {
  const vexRef = useRef<HTMLDivElement>(null);
  const [elapsedTime, setElapsedTime] = React.useState(0);
  const [showHint, setShowHint] = React.useState(false);
  
  const hintUnlockTime = exercise.hintUnlockTime || 10;
  const isHintUnlocked = elapsedTime >= hintUnlockTime;

  // Timer que incrementa cada segundo
  React.useEffect(() => {
    const timer = setInterval(() => {
      setElapsedTime(prev => {
        const newTime = prev + 1;
        console.log('Elapsed time:', newTime, 'Unlock time:', hintUnlockTime); // Debug
        return newTime;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [hintUnlockTime]);

  useEffect(() => {
    if (!vexRef.current) return;
    vexRef.current.innerHTML = '';
    const renderer = new Renderer(vexRef.current, Renderer.Backends.SVG);
    renderer.resize(400, 160);
    const context = renderer.getContext();
    context.setFont('Arial', 10, '').setBackgroundFillStyle('#fff');

    // Staff
    const stave = new Stave(10, 40, 380);
    if (exercise.data?.clef) stave.addClef(exercise.data.clef);
    if (exercise.data?.timeSignature) stave.addTimeSignature(exercise.data.timeSignature);
    stave.setContext(context).draw();

    // Notes
    type NoteData = { keys: string[]; duration: string };
    const notesData = (exercise.data?.notes || []) as NoteData[];
    const notes = notesData.map((n: NoteData) =>
      new StaveNote({
        keys: n.keys,
        duration: n.duration,
        clef: exercise.data?.clef || 'treble',
      })
    );

    // Voice - calcular beats dinámicamente según las duraciones
    // q=1, 8=0.5, 16=0.25, h=2, w=4, etc.
    const durationValues: Record<string, number> = {
      'w': 4, 'h': 2, 'q': 1, '8': 0.5, '16': 0.25, '32': 0.125,
      'wr': 4, 'hr': 2, 'qr': 1, '8r': 0.5, '16r': 0.25, '32r': 0.125,
    };
    const totalBeats = notesData.reduce((sum, n) => sum + (durationValues[n.duration] || 1), 0);
    const voice = new Voice({ numBeats: Math.max(totalBeats, 1), beatValue: 4 });
    voice.addTickables(notes);

    // Format & Draw
    new Formatter().joinVoices([voice]).format([voice], 350);
    voice.draw(context, stave);
  }, [exercise]);

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

      <div className={styles.actions}>
        <button 
          className={styles.submitBtn}
          onClick={() => onSubmit('respuesta-demo')}
        >
          ✓ Enviar respuesta
        </button>
        {allowHints && exercise.hint && (
          <button 
            className={`${styles.hintBtn} ${isHintUnlocked ? '' : styles.disabled} ${showHint ? styles.active : ''}`}
            onClick={() => isHintUnlocked && setShowHint(!showHint)}
            disabled={!isHintUnlocked}
            title={isHintUnlocked ? '' : `Disponible en ${hintUnlockTime - elapsedTime}s`}
          >
            {showHint ? '✕ Ocultar' : '💡 ¿Cómo resolver?'}
            {!isHintUnlocked && <span className={styles.timer}>{hintUnlockTime - elapsedTime}s</span>}
          </button>
        )}
      </div>

      {showHint && exercise.hint && (
        <div className={styles.hintBox}>
          <p>{exercise.hint}</p>
        </div>
      )}
    </div>
  );
};
