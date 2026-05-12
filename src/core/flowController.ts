// Orquestador del flujo de ejercicios
import type { Exercise, Feedback } from '../types/exercise';
import type { MusicEvent } from '../types/events';
import { drlClient } from '../services/drl/drlClient';

interface SessionEvent {
  node: string;
  correct: boolean;
  difficulty: number;
  response_time: number;
}

export class FlowController {
  private studentId: string;
  private token: string;
  private sessionId: string;
  private focusNode: string | undefined;
  private onEvent: (event: MusicEvent) => void;
  private currentExercise: Exercise | null = null;
  private feedback: Feedback | null = null;
  private sessionEvents: SessionEvent[] = [];
  private startTime: number = 0;

  constructor(
    studentId: string,
    token: string,
    sessionId: string,
    focusNode: string | undefined,
    onEvent: (event: MusicEvent) => void
  ) {
    this.studentId = studentId;
    this.token = token;
    this.sessionId = sessionId;
    this.focusNode = focusNode;
    this.onEvent = onEvent;
  }

  // Cargar siguiente ejercicio desde DRL
  async loadExercise() {
    try {
      this.currentExercise = await drlClient.getExercise(
        this.studentId,
        this.token,
        this.focusNode
      );
      this.startTime = Date.now();
      this.onEvent({
        type: 'exercise_loaded',
        exerciseId: this.currentExercise.id,
      });
      return this.currentExercise;
    } catch (error) {
      this.onEvent({
        type: 'error',
        message: `Error al cargar ejercicio: ${error}`,
      });
      throw error;
    }
  }

  // Enviar respuesta y obtener retroalimentación
  async submitAnswer(correct: boolean) {
    if (!this.currentExercise) {
      throw new Error('No hay ejercicio activo');
    }

    const responseTime = Date.now() - this.startTime;

    const event: SessionEvent = {
      node: this.currentExercise.node || this.focusNode || 'global',
      correct,
      difficulty: this.currentExercise.difficulty || 1,
      response_time: responseTime,
    };

    this.sessionEvents.push(event);

    try {
      this.feedback = await drlClient.submitSessionEvent(
        this.studentId,
        this.token,
        event
      );

      this.onEvent({
        type: 'answer_submitted',
        correct,
        reward: (this.feedback.details as any)?.reward,
      });

      return this.feedback;
    } catch (error) {
      this.onEvent({
        type: 'error',
        message: `Error al enviar respuesta: ${error}`,
      });
      throw error;
    }
  }

  // Finalizar la sesión
  async endSession() {
    try {
      const result = await drlClient.endSession(
        this.studentId,
        this.token,
        this.sessionEvents
      );

      this.onEvent({
        type: 'session_completed',
        sessionId: this.sessionId,
        totalEvents: this.sessionEvents.length,
        summary: result,
      });

      return result;
    } catch (error) {
      this.onEvent({
        type: 'error',
        message: `Error al finalizar sesión: ${error}`,
      });
      throw error;
    }
  }

  // Obtén el ejercicio actual
  getCurrentExercise() {
    return this.currentExercise;
  }

  // Obtén el feedback actual
  getFeedback() {
    return this.feedback;
  }

  // Obtén todos los eventos de la sesión
  getSessionEvents() {
    return [...this.sessionEvents];
  }
}
