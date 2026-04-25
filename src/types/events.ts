// Tipos de eventos del sistema musical
export type MusicEvent =
  | { type: 'exercise_loaded'; exerciseId: string }
  | { type: 'answer_submitted'; answer: any }
  | { type: 'feedback_received'; score: number }
  | { type: 'session_completed'; summary: any };
