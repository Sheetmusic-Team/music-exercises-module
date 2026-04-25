// Orquestador del flujo de ejercicios
import type { Exercise, Feedback } from '../types/exercise';
import type { MusicEvent } from '../types/events';
import { drlClient } from '../services/drl/drlClient.ts';

export class FlowController {
  private userId: string;
  private sessionId: string;
  private onEvent: (event: MusicEvent) => void;
  private currentExercise: Exercise | null = null;
  private feedback: Feedback | null = null;

  constructor(userId: string, sessionId: string, onEvent: (event: MusicEvent) => void) {
    this.userId = userId;
    this.sessionId = sessionId;
    this.onEvent = onEvent;
  }

  async loadExercise() {
    this.currentExercise = await drlClient.getExercise(this.userId, this.sessionId);
    this.onEvent({ type: 'exercise_loaded', exerciseId: this.currentExercise.id });
    return this.currentExercise;
  }

  async submitAnswer(answer: any) {
    await drlClient.sendAnswer(this.userId, this.sessionId, answer);
    this.onEvent({ type: 'answer_submitted', answer });
    this.feedback = await drlClient.getFeedback(this.userId, this.sessionId);
    this.onEvent({ type: 'feedback_received', score: this.feedback.score });
    return this.feedback;
  }

  completeSession(summary: any) {
    this.onEvent({ type: 'session_completed', summary });
  }

  getCurrentExercise() {
    return this.currentExercise;
  }

  getFeedback() {
    return this.feedback;
  }
}
