// Componente principal embebible
import React, { useEffect, useState } from 'react';
import { FlowController } from './core/flowController';
import type { MusicEvent } from './types/events';
import type { Exercise, Feedback } from './types/exercise';
import { ExerciseView } from './ui/ExerciseView';
import { FeedbackView } from './ui/FeedbackView';
import styles from './MusicModule.module.css';

export interface MusicModuleConfig {
  mode?: 'practice' | 'test';
  allowHints?: boolean;
}

interface MusicModuleProps {
  userId: string;
  sessionId?: string;
  config?: MusicModuleConfig;
  onEvent: (event: MusicEvent) => void;
}

export const MusicModule: React.FC<MusicModuleProps> = ({ userId, sessionId = 'default-session', config, onEvent }) => {
  const [controller] = useState(() => new FlowController(userId, sessionId, onEvent));
  const [exercise, setExercise] = useState<Exercise | null>(null);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);

  useEffect(() => {
    controller.loadExercise().then(setExercise);
  }, [controller]);

  const handleSubmit = async (answer: any) => {
    const fb = await controller.submitAnswer(answer);
    setFeedback(fb);
    setShowFeedback(true);
  };

  return (
    <div className={styles.module}>
      {exercise && !showFeedback && (
        <ExerciseView exercise={exercise} onSubmit={handleSubmit} allowHints={config?.allowHints} />
      )}
      {showFeedback && feedback && (
        <>
          <FeedbackView feedback={feedback} />
          <button 
            className={styles.nextBtn}
            onClick={async () => {
              setShowFeedback(false);
              setFeedback(null);
              const ex = await controller.loadExercise();
              setExercise(ex);
            }}
          >
            ➜ Siguiente ejercicio
          </button>
        </>
      )}
    </div>
  );
};
