// Componente principal embebible
import React, { useState, useCallback } from 'react';
import ErrorBoundary from './ui/ErrorBoundary';
import { FlowController } from './core/flowController';
import type { MusicEvent } from './types/events';
import type { Exercise, Feedback } from './types/exercise';
import { LoginView } from './ui/LoginView';
import { ModeSelector } from './ui/ModeSelector';
import { NodeSelector } from './ui/NodeSelector';
import { ExerciseView } from './ui/ExerciseView';
import { FeedbackView } from './ui/FeedbackView';
import styles from './MusicModule.module.css';
import nodesJson from '../data/nodes.json';

function normalizeId(id: string) {
  try { return String(id).toLowerCase() } catch { return String(id) }
}

type AppState = 'login' | 'mode-select' | 'node-select' | 'exercise' | 'feedback' | 'summary';

interface MusicModuleConfig {
  mode?: 'practice' | 'test';
  allowHints?: boolean;
  // If false, do not emit the external 'session_completed' event which some
  // hosts use to unmount the embed. Default: true
  emitSessionCompleted?: boolean;
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

  
  
  interface SessionSummary {
    total_reward: number;
    node_rewards: Record<string, number>;
    updated_proficiencies: Record<string, number>;
    success_rate: number;
    next_recommendations?: string[];
    drl_training_triggered?: boolean;
    buffer_size?: number;
  }

  const [sessionSummary, setSessionSummary] = useState<SessionSummary | null>(null);
  const [pendingSessionCompletedEvent, setPendingSessionCompletedEvent] = useState<MusicEvent | null>(null);
  const [uiError, setUiError] = React.useState<string | null>(null);
  const [sessionId] = useState(() => `session-${Date.now()}`);

  // Eliminado: auto-login desde localStorage. El usuario debe iniciar sesión manualmente.

  // Derived config flags (keeps dependency lists simple and stable)
  const shouldEmitSessionCompleted = React.useMemo(() => {
    return config?.emitSessionCompleted !== false;
  }, [config?.emitSessionCompleted]);

  const resetSessionUI = React.useCallback(() => {
  setFeedback(null);
  setShowFeedback(false);
  setSessionSummary(null);
  setPendingSessionCompletedEvent(null);
}, []);

  // Manejar login
  const handleLogin = useCallback((accessToken: string, id: string, name: string) => {
    console.info('[MusicModule] handleLogin called', { accessToken, id, name });
    setToken(accessToken);
    setStudentId(id);
    setStudentName(name);
    setAppState('mode-select');
  }, []);

  // Diagnostic: log state transitions to help debug login spinner
  React.useEffect(() => {
    console.info('[MusicModule] state snapshot', {
      appState,
      token,
      studentId,
      studentName,
      controller: !!controller,
      exerciseLoaded: !!exercise,
      loading,
    });
  }, [appState, token, studentId, studentName, controller, exercise, loading]);

  // Cargar siguiente ejercicio
  const loadNextExercise = useCallback(async (ctrl: FlowController) => {
    console.info('[MusicModule] loadNextExercise: start')
    // Clear current exercise immediately to show loading state and avoid stale UI
    setExercise(null);
    setLoading(true);
    try {
      const ex = await ctrl.loadExercise();
      console.info('[MusicModule] loadNextExercise: got exercise', ex)
      setExercise(ex);
      setAppState('exercise');
    } catch (error) {
      console.error('Error loading exercise:', error);
      onEvent({
        type: 'error',
        message: `Error al cargar ejercicio: ${error}`,
      });
    } finally {
      console.info('[MusicModule] loadNextExercise: finished')
      setLoading(false);
    }
  }, [onEvent]);

  // Manejar selección de modo
  const handleModeSelect = useCallback(
    (selectedMode: 'global' | 'subject') => {
      console.log('handleModeSelect', { selectedMode, studentId, token });
      if (selectedMode === 'global') {
        // Iniciar sesión en modo global sin focus
        if (studentId && token) {
          try {
            const sessionController = new FlowController(
              studentId,
              token,
              sessionId,
              undefined,
              onEvent
            );
            setController(sessionController);

            resetSessionUI();

            loadNextExercise(sessionController).catch((e) => {
              console.error('loadNextExercise failed', e);
              setUiError(String(e));
            });
          } catch (err) {
            console.error('Could not create session controller', err);
            setUiError('No se pudo iniciar sesión. Revisa la consola.');
          }
        } else {
          console.warn('Missing studentId or token when starting global mode');
          setUiError('Usuario no autenticado. Por favor inicia sesión.');
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
          undefined,
          onEvent
        );

        setController(sessionController);

        resetSessionUI();

        loadNextExercise(sessionController).catch((e) => {
          console.error('loadNextExercise failed', e);
          setUiError(String(e));
        });
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
        // Guardar evento localmente y mostrar feedback mínimo.
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
    console.info('[MusicModule] handleNextExercise: user requested next')
    setShowFeedback(false);
    setFeedback(null);
    if (controller) {
      try {
        // Cargar siguiente ejercicio (sin mostrar recompensa previa)
        await loadNextExercise(controller);
      } catch (err) {
        console.error('[MusicModule] handleNextExercise: load failed', err)
        setUiError(String(err));
      }
    } else {
      console.warn('[MusicModule] handleNextExercise: no controller available');
      // If there's no controller we can't load a next exercise. Return
      // the UI to mode selection so the user can start a new session.
      setShowFeedback(false);
      setFeedback(null);
      setExercise(null);
      setAppState('mode-select');
    }
  }, [controller, loadNextExercise]);

  // Cerrar la vista de feedback sin provocar efectos colaterales
  const handleCloseFeedback = useCallback(() => {
    console.info('[MusicModule] handleCloseFeedback: hiding feedback');
    setShowFeedback(false);
    // keep feedback in state until next exercise is loaded to avoid flash
    // ensure we stay on 'exercise' state
    setAppState((prev) => (prev === 'node-select' ? 'node-select' : 'exercise'));

    // If there is no current exercise but we have a controller, try to load one
    if (!exercise && controller) {
      loadNextExercise(controller).catch((e) => {
        console.error('[MusicModule] handleCloseFeedback: reload failed', e);
        setUiError(String(e));
      });
    }
  }, [controller, exercise, loadNextExercise]);

  // Finalizar sesión
  const handleEndSession = useCallback(async () => {
    if (!controller) return;
    setLoading(true);
    try {
      const result = await controller.endSession();

      // Save the summary to show to the student
      setSessionSummary(result);

      // Enviar evento externo de sesión completada
      // Some host pages auto-unmount the embed when receiving the
      // 'session_completed' event which can make the UI disappear while
      // we still want to show the session summary. To avoid that race,
      // delay emitting the external event until the student closes the
      // summary. Store the event payload in state and emit later.
      if (shouldEmitSessionCompleted) {
        const ev: MusicEvent = {
          type: 'session_completed',
          sessionId: sessionId,
          totalEvents: controller.getSessionEvents().length,
          summary: result,
        };
        setPendingSessionCompletedEvent(ev);
      }

      // Keep UI on a summary view; allow the student to close session explicitly
      setAppState('summary');
    } catch (error) {
      console.error('Error ending session:', error);
      onEvent({
        type: 'error',
        message: `Error al finalizar sesión: ${error}`,
      });
    } finally {
      setLoading(false);
    }
  }, [controller, onEvent, sessionId, shouldEmitSessionCompleted]);

  const handleCloseSummary = useCallback(() => {
    // If we previously delayed a session_completed event, emit it now.
    if (pendingSessionCompletedEvent) {
      try {
        onEvent(pendingSessionCompletedEvent);
      } catch (err) {
        console.error('Failed emitting delayed session_completed event', err);
      }
      setPendingSessionCompletedEvent(null);
    }

    setSessionSummary(null);
    // after closing the summary go back to mode-select (stay logged in)
    setAppState('mode-select');
  }, [onEvent, pendingSessionCompletedEvent]);

  // Helpers: map nodes by id for descriptions
  type NodeEntry = { id: string; name?: string; description?: string; level?: number; prerequisites?: string[] }
  const nodesById = React.useMemo(() => {
    const map = new Map<string, NodeEntry>()
    try {
      const maybe = nodesJson as { nodes?: NodeEntry[] }
      const list = maybe?.nodes ?? []
      list.forEach((n) => {
        if (n?.id) map.set(n.id, n)
      })
    } catch {
      // log but don't break UI
      console.warn('Could not parse nodes.json for summary')
    }
    return map
  }, [])

  function getMotivationalMessage(rate?: number) {
    if (rate == null) return ''
    const p = Math.round(rate * 100)
    if (p <= 19) return 'Necesitas practicar más — ¡sigue intentándolo!'
    if (p <= 39) return 'Buen inicio — estás en el camino correcto.'
    if (p <= 59) return 'Vas mejorando — sigue practicando para consolidar lo aprendido.'
    if (p <= 79) return 'Muy buen progreso — ¡excelente trabajo!'
    if (p <= 99) return 'Excelente — estás muy cerca de la cima.'
    return 'Perfecto — ¡rendimiento impecable!'
  }

  function getMotivationalEmoji(rate?: number) {
    if (rate == null) return '🎵'
    const p = Math.round(rate * 100)
    if (p <= 19) return '💪'
    if (p <= 39) return '🙂'
    if (p <= 59) return '😃'
    if (p <= 79) return '🥳'
    if (p <= 99) return '🏅'
    return '🏆'
  }

  // normalizeId is defined at module top

  const [expandedNodes, setExpandedNodes] = React.useState<Record<string, boolean>>({})
  const toggleNode = (id: string) => {
    const k = normalizeId(id)
    setExpandedNodes((s) => ({ ...s, [k]: !s[k] }))
  }

  function topImprovedNodes(proficiencies?: Record<string, number>, limit = 3) {
    if (!proficiencies) return [] as Array<{ id: string; delta: number; name?: string; description?: string }>
    const arr = Object.entries(proficiencies)
      .map(([id, delta]) => ({ id, delta }))
      .filter((x) => typeof x.delta === 'number' && x.delta > 0)
      .sort((a, b) => b.delta - a.delta)
      .slice(0, limit)
    return arr.map((x) => ({
      ...x,
      name: nodesById.get(x.id)?.name,
      description: nodesById.get(x.id)?.description
    }))
  }

  function recommendationNames(recs?: string[]) {
    if (!recs) return [] as string[]
    return recs.map((id) => nodesById.get(id)?.name ?? id)
  }



  

  const handleLogout = useCallback(() => {
    // Clear all session-related state so no stale UI remains (feedback,
    // exercises, summaries). Then go back to login.
    setShowFeedback(false);
    setFeedback(null);
    setExercise(null);
    setSessionSummary(null);
    setUiError(null);
    setToken(null);
    setStudentId(null);
    setStudentName(null);
    setController(null);
    setAppState('login');
  }, []);

  // Volver de node selector
  const handleBackFromNodeSelector = useCallback(() => {
    setAppState('mode-select');
  }, []);

  // Auto-recover: if we're supposed to be in 'exercise' but there's no
  // exercise loaded while we have a controller, try to load one.
  React.useEffect(() => {
    let cancelled = false;
    if (appState === 'exercise' && !exercise && controller && !loading) {
      console.info('[MusicModule] auto-recover: loading missing exercise');

      // Defer the work to the next tick so we don't call setState
      // synchronously inside the effect body (which can trigger
      // cascading renders). Using setTimeout is a minimal, safe deferral.
      const id = setTimeout(() => {
        loadNextExercise(controller).catch((e) => {
          if (cancelled) return;
          console.error('[MusicModule] auto-recover failed', e);
          setUiError(String(e));
        });
      }, 0);

      return () => {
        cancelled = true;
        clearTimeout(id);
      };
    }
    return () => { cancelled = true; };
  }, [appState, exercise, controller, loading, loadNextExercise]);

  console.log({
    appState,
    token,
    studentName,
    studentId,
    loading
  })
  return (
    <div className={styles.module}>

      {uiError && (
        <div className={styles.uiError}>
          <strong>Error:</strong> {uiError}
        </div>
      )}

      {loading && (
        <div className={styles.loadingOverlay}>
          <div className={styles.spinner} />
          <h3>Cargando...</h3>
        </div>
      )}

      {appState === 'login' && (
        <LoginView onLoginSuccess={handleLogin} />
      )}

      {appState === 'mode-select' && token && (
        <ModeSelector
          onSelectMode={handleModeSelect}
          onLogout={handleLogout}
          authToken={token}
          studentName={studentName ?? ''}
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
            <React.Suspense fallback={<div>Cargando componente...</div>}>
              <ErrorBoundary onError={(err, info) => {
                console.error('[MusicModule] ErrorBoundary caught render error for exercise', { err, info, exercise });
              }}>
                <ExerciseView
                  exercise={exercise}
                  onSubmit={handleSubmit}
                  allowHints={config?.allowHints}
                />
              </ErrorBoundary>
            </React.Suspense>

            <button
              onClick={handleEndSession}
              className={styles.endSessionBtn}
            >
              Terminar Sesión
            </button>
          </div>
        )}

      {sessionSummary && (
        <section className={styles.sessionSummaryCard} aria-label="Resumen de la sesión">
          <div className={styles.summaryHeader}>
            {(() => {
              const emoji = getMotivationalEmoji(sessionSummary.success_rate)
              return (
                <div
                  className={styles.summaryEmoji}
                  role="img"
                  aria-label={`Resultado: ${emoji}`}>
                  {emoji}
                </div>
              )
            })()}
            <div className={styles.summaryTitle}>
              <h2>¡Buen trabajo!</h2>
              <p className={styles.subtitle}>Resumen de tu sesión</p>
            </div>
          </div>

          <div className={styles.summaryStats}>
            <div className={styles.bigStat}>
              <div className={styles.statLabel}>Recompensa total</div>
              <div className={styles.statValue}>{Math.round((sessionSummary.total_reward ?? 0) * 100) / 100}</div>
            </div>

            <div className={styles.bigStat}>
              <div className={styles.statLabel}>Tasa de éxito</div>
              <div className={styles.statValue}>{Math.round((sessionSummary.success_rate ?? 0) * 100)}%</div>
            </div>
          </div>

          <div className={styles.summarySection}>
            <h3>Recompensas por nodo</h3>
            <div className={styles.nodeList}>
              {Object.entries(sessionSummary.node_rewards || {}).map(([node, reward]) => {
                const nk = normalizeId(node)
                const meta = nodesById.get(nk)
                const expanded = !!expandedNodes[nk]
                return (
                  <div key={nk} className={styles.nodeWrapper}>
                    <button className={styles.nodeItem} onClick={() => toggleNode(nk)}>
                      <div>
                        <div className={styles.nodeName}>{meta?.name ?? nk}</div>
                        <div className={styles.nodeId}>{nk}</div>
                      </div>
                      <div className={styles.nodeRight}>
                        <div className={styles.nodeReward}>{Math.round(reward * 100) / 100}</div>
                      </div>
                    </button>
                    {expanded && (
                      <div className={styles.nodeExpanded}>
                        <div className={styles.proficiencyDesc}>{meta?.description ?? 'Sin descripción'}</div>
                        <div className={styles.nodeMeta}>Nivel: {meta?.level ?? '—'}</div>
                        {meta?.prerequisites && meta.prerequisites.length > 0 && (
                          <div className={styles.nodePrereq}>
                            Requisitos: {meta.prerequisites.map((p: string) => nodesById.get(normalizeId(p))?.name ?? p).join(', ')}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          <div className={styles.summarySection}>
            <h3>Donde más mejoraste</h3>
            <div className={styles.proficiencyList}>
              {topImprovedNodes(sessionSummary.updated_proficiencies).length === 0 && (
                <div className={styles.nodeItem}>No hubo mejoras netas en esta sesión.</div>
              )}
              {topImprovedNodes(sessionSummary.updated_proficiencies).map((n) => (
                <div key={n.id} className={styles.proficiencyDetail}>
                  <div className={styles.proficiencyLabel}>{n.id} — {n.name ?? ''}</div>
                  <div className={styles.proficiencyDesc}>{n.description ?? ''}</div>
                  <div className={styles.proficiencyDeltaSmall}>{(Math.round(n.delta * 100) / 100).toFixed(2)}</div>
                </div>
              ))}
            </div>
          </div>

          <div className={styles.summarySection}>
            <h3>Proficiencias actualizadas</h3>
            <div className={styles.proficiencyList}>
              {Object.entries(sessionSummary.updated_proficiencies || {}).map(([node, delta]) => {
                // Render a small horizontal bar showing sign and magnitude
                const magnitude = Math.min(Math.abs(delta), 1);
                const positive = delta >= 0;
                return (
                  <div key={node} className={styles.proficiencyItem}>
                    <div className={styles.proficiencyLabel}>{node}</div>
                    <div className={styles.proficiencyBarWrap}>
                      <div
                        className={styles.proficiencyBar}
                        style={{
                          width: `${Math.round(magnitude * 100)}%`,
                          background: positive ? 'linear-gradient(90deg,#4caf50,#8bc34a)' : 'linear-gradient(90deg,#f44336,#ff7961)'
                        }}
                      />
                    </div>
                    <div className={styles.proficiencyDelta}>{(delta >= 0 ? '+' : '') + (Math.round(delta * 100) / 100)}</div>
                  </div>
                )
              })}
            </div>
          </div>

          <div className={styles.summarySection}>
            <h3>Siguientes recomendaciones</h3>
            <div className={styles.recommendations}>
              {recommendationNames(sessionSummary.next_recommendations).map((r) => (
                <span key={r} className={styles.recommendationBadge}>{r}</span>
              ))}
            </div>
          </div>

          <div className={styles.summarySection}>
            <h3>Mensaje</h3>
            <div className={styles.motivational}>{getMotivationalEmoji(sessionSummary.success_rate)} {getMotivationalMessage(sessionSummary.success_rate)}</div>
          </div>

          <div className={styles.summaryActions}>
            <button onClick={handleCloseSummary} className={styles.endSessionBtn}>Cerrar</button>
          </div>
        </section>
      )}

      {appState === 'exercise' &&
        feedback && (
          <div className={styles.feedbackContainer}>

            <FeedbackView
              feedback={feedback}
              isOpen={showFeedback}
              onClose={handleCloseFeedback}
            />

            {showFeedback && (
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
            )}

          </div>
        )}

    </div>
  );
};
