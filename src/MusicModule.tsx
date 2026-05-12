// Componente principal embebible
import React, { useState, useCallback } from 'react';
import { FlowController } from './core/flowController';
import type { MusicEvent } from './types/events';
import type { Exercise, Feedback } from './types/exercise';
import { LoginView } from './ui/LoginView';
import { ModeSelector } from './ui/ModeSelector';
import { NodeSelector } from './ui/NodeSelector';
import { ExerciseView } from './ui/ExerciseView';
import { FeedbackView } from './ui/FeedbackView';
import styles from './MusicModule.module.css';

type AppState = 'login' | 'mode-select' | 'node-select' | 'exercise' | 'feedback';

interface MusicModuleConfig {
  mode?: 'practice' | 'test';
  allowHints?: boolean;
}

interface MusicModuleProps {
  config?: MusicModuleConfig;
  onEvent: (event: MusicEvent) => void;
}

export const MusicModule: React.FC<MusicModuleProps> = ({ config, onEvent }) => {
  const [appState, setAppState] = useState<AppState>('login');
  const [studentId, setStudentId] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [studentName, setStudentName] = useState<string | null>(null);
  const [controller, setController] = useState<FlowController | null>(null);
  const [exercise, setExercise] = useState<Exercise | null>(null);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sessionId] = useState(() => `session-${Date.now()}`);

  // Manejar login
  const handleLogin = useCallback((accessToken: string, id: string, name: string) => {
    setToken(accessToken);
    setStudentId(id);
    setStudentName(name);
    setAppState('mode-select');
  }, []);

  // Cargar siguiente ejercicio
  const loadNextExercise = useCallback(async (ctrl: FlowController) => {
    setLoading(true);
    try {
      const ex = await ctrl.loadExercise();
      setExercise(ex);
      setAppState('exercise');
    } catch (error) {
      console.error('Error loading exercise:', error);
      onEvent({
        type: 'error',
        message: `Error al cargar ejercicio: ${error}`,
      });
    } finally {
      setLoading(false);
    }
  }, [onEvent]);

  // Manejar selección de modo
  const handleModeSelect = useCallback(
    (selectedMode: 'global' | 'subject') => {
      if (selectedMode === 'global') {
        // Iniciar sesión en modo global sin focus
        if (studentId && token) {
          const sessionController = new FlowController(
            studentId,
            token,
            sessionId,
            undefined,
            onEvent
          );
          setController(sessionController);
          loadNextExercise(sessionController);
        }
      } else {
        // Ir a selector de nodos
        setAppState('node-select');
      }
    },
    [studentId, token, sessionId, onEvent, loadNextExercise]
  );

  // Manejar selección de nodo
  const handleNodeSelect = useCallback(
    (nodeId: string) => {
      if (studentId && token) {
        const sessionController = new FlowController(
          studentId,
          token,
          sessionId,
          nodeId,
          onEvent
        );
        setController(sessionController);
        loadNextExercise(sessionController);
      }
    },
    [studentId, token, sessionId, onEvent, loadNextExercise]
  );

  // Enviar respuesta
  const handleSubmit = useCallback(
    async (answer: Record<string, unknown>) => {
      if (!controller) return;
      setLoading(true);
      try {
        const correct = (answer.correct as boolean) === true;
        const fb = await controller.submitAnswer(correct);
        setFeedback(fb);
        setShowFeedback(true);
      } catch (error) {
        console.error('Error submitting answer:', error);
        onEvent({
          type: 'error',
          message: `Error al enviar respuesta: ${error}`,
        });
      } finally {
        setLoading(false);
      }
    },
    [controller, onEvent]
  );

  // Ir al siguiente ejercicio
  const handleNextExercise = useCallback(async () => {
    setShowFeedback(false);
    setFeedback(null);
    if (controller) {
      await loadNextExercise(controller);
    }
  }, [controller, loadNextExercise]);

  // Finalizar sesión
  const handleEndSession = useCallback(async () => {
    if (!controller) return;
    setLoading(true);
    try {
      await controller.endSession();
      setAppState('mode-select');
      setExercise(null);
      setFeedback(null);
      setController(null);
    } catch (error) {
      console.error('Error ending session:', error);
      onEvent({
        type: 'error',
        message: `Error al finalizar sesión: ${error}`,
      });
    } finally {
      setLoading(false);
    }
  }, [controller, onEvent]);

  // Volver de node selector
  const handleBackFromNodeSelector = useCallback(() => {
    setAppState('mode-select');
  }, []);

  return (
  <div className={styles.module}>

    {loading && (
      <div>
        <h2>Cargando...</h2>
      </div>
    )}

    {appState === 'login' && (
      <LoginView onLoginSuccess={handleLogin} />
    )}

    {appState === 'mode-select' && studentName && (
      <ModeSelector
        onSelectMode={handleModeSelect}
        studentName={studentName}
      />
    )}

    {appState === 'node-select' && (
      <NodeSelector
        onSelectNode={handleNodeSelect}
        onBack={handleBackFromNodeSelector}
      />
    )}

    {appState === 'exercise' &&
      !loading &&
      !exercise && (
        <div>
          <h2>No hay ejercicio cargado</h2>
        </div>
      )}

    {appState === 'exercise' &&
      exercise &&
      !showFeedback && (
        <div className={styles.exerciseContainer}>
          <ExerciseView
            exercise={exercise}
            onSubmit={handleSubmit}
            allowHints={config?.allowHints}
          />

          <button
            onClick={handleEndSession}
            className={styles.endSessionBtn}
          >
            Terminar Sesión
          </button>
        </div>
      )}

    {appState === 'exercise' &&
      showFeedback &&
      feedback && (
        <div className={styles.feedbackContainer}>

          <FeedbackView feedback={feedback} />

          <div className={styles.feedbackActions}>

            <button
              className={styles.nextBtn}
              onClick={handleNextExercise}
              disabled={loading}
            >
              {loading
                ? '⏳ Cargando...'
                : '➜ Siguiente ejercicio'}
            </button>

            <button
              onClick={handleEndSession}
              className={styles.endSessionBtn}
            >
              Terminar Sesión
            </button>

          </div>

        </div>
      )}

  </div>
);
};
