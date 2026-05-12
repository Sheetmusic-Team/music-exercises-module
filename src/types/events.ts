// Tipos de eventos del sistema musical
export type MusicEvent =
  | { type: 'exercise_loaded'; exerciseId: string }
  | { type: 'answer_submitted'; correct: boolean; reward?: number }
  | { type: 'feedback_received'; score: number }
  | { type: 'session_completed'; sessionId: string; totalEvents: number; summary: any }
  | { type: 'error'; message: string };
