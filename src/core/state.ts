// Estado de usuario/sesión
import type { Exercise, Feedback } from '../types/exercise';

export interface SessionState {
  userId: string;
  sessionId: string;
  currentExercise?: Exercise;
  feedback?: Feedback;
  history: Array<{ exercise: Exercise; answer: any; feedback: Feedback }>;
}
