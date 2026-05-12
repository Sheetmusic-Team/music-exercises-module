// Cliente DRL: conexión con backend + DRL Engine

import type {
  Exercise,
  Feedback
} from '../../../types/exercise';

const BACKEND_URL =
  import.meta.env.VITE_BACKEND_URL ||
  'http://localhost:3000';

interface SessionEventRequest {
  node: string;
  correct: boolean;
  difficulty: number;
  response_time: number;
}

interface StudentStats {
  proficiencies: Record<string, number>;
  totalSessions: number;
  averageReward: number;
  averageSuccessRate: number;
}

interface SessionResult {
  total_reward: number;
  node_rewards: Record<string, number>;
  updated_proficiencies: Record<string, number>;
  success_rate: number;
  next_recommendations?: string[];
  drl_training_triggered?: boolean;
  buffer_size?: number;
}

export interface DRLClient {

  getExercise(
    userId: string,
    token: string,
    focusNode?: string
  ): Promise<Exercise>;

  submitSessionEvent(
    userId: string,
    token: string,
    event: SessionEventRequest
  ): Promise<Feedback>;

  endSession(
    userId: string,
    token: string,
    events: SessionEventRequest[]
  ): Promise<SessionResult>;

  getStudentStats(
    userId: string,
    token: string
  ): Promise<StudentStats>;

}

export const drlClient: DRLClient = {

  // ========================================
  // OBTENER EJERCICIO
  // ========================================

  async getExercise(
    _,
    token,
    focusNode
  ) {

    console.log('======================');
    console.log('GET EXERCISE');
    console.log('======================');

    console.log(
      'BACKEND URL:',
      BACKEND_URL
    );

    console.log(
      'TOKEN:',
      token
    );

    console.log(
      'FOCUS NODE:',
      focusNode
    );

    const options: RequestInit = {

      method:
        focusNode
          ? 'POST'
          : 'GET',

      headers: {
        'Content-Type':
          'application/json',

        Authorization:
          `Bearer ${token}`,
      },

    };

    // MODO FOCUS
    if (focusNode) {

      console.log(
        'USANDO MODO FOCUS'
      );

      options.body = JSON.stringify({

        focus: {
          nodes: [focusNode],
          strict: true,
        },

      });

    }

    // MODO GLOBAL
    else {

      console.log(
        'USANDO MODO GLOBAL'
      );

    }

    console.log(
      'REQUEST OPTIONS:',
      options
    );

    try {

      const response = await fetch(
        `${BACKEND_URL}/api/exercises/next`,
        options
      );

      console.log(
        'RESPONSE STATUS:',
        response.status
      );

      console.log(
        'RESPONSE OK:',
        response.ok
      );

      const rawText =
        await response.text();

      console.log(
        'RAW RESPONSE:',
        rawText
      );

      // Intentar parsear JSON
      let data;

      try {

        data =
          JSON.parse(rawText);

      } catch (jsonError) {

        console.error(
          'JSON PARSE ERROR:',
          jsonError
        );

        throw new Error(
          'Respuesta inválida del backend'
        );

      }

      console.log(
        'PARSED RESPONSE:',
        data
      );

      // ERROR BACKEND
      if (!response.ok) {

        console.error(
          'BACKEND ERROR:',
          data
        );

        throw new Error(
          data.error ||
          `HTTP ${response.status}`
        );

      }

      // VALIDAR RESPONSE
      if (!data?.data?.exercise) {

        console.error(
          'NO EXERCISE FOUND:',
          data
        );

        throw new Error(
          'No exercise returned'
        );

      }

      console.log(
        'EXERCISE (raw):',
        data.data.exercise
      );

      // Defensive normalization: ensure returned exercise has an id and normalized node
      const ex = data.data.exercise as Record<string, unknown>;
      try {
        if (ex) {
          if (!ex.id) {
            // create a fallback stable-ish id
            const node = (ex.node as string) ?? (ex.node_id as string) ?? 'exercise'
            ex.id = `${String(node).toLowerCase()}-${Date.now()}`
          }
          if (ex.node && typeof ex.node === 'string') ex.node = ex.node.toLowerCase()
          // Normalize prompt: some generators return `exercise` or `question` instead of `prompt`
          if (!ex.prompt) {
            if (ex.exercise && typeof ex.exercise === 'string') ex.prompt = ex.exercise
            else if (ex.question && typeof ex.question === 'string') ex.prompt = ex.question
          }

          // Normalize expected answer: banks/generators may use `answer` or `correct`
          if (!ex.expected_answer) {
            if (ex.answer && typeof ex.answer !== 'object') ex.expected_answer = ex.answer
            else if (ex.correct && typeof ex.correct !== 'object') ex.expected_answer = ex.correct
            else if (ex.data && typeof ex.data === 'object') {
              try {
                const d = ex.data as Record<string, unknown>;
                const alts = d.alternatives as unknown;
                const ci = d.correct_index as unknown;
                if (Array.isArray(alts) && typeof ci === 'number') {
                  const idx = Number(ci);
                  if (idx >= 0 && idx < (alts as any[]).length) {
                    const val = (alts as any[])[idx];
                    if (typeof val !== 'undefined') ex.expected_answer = String(val);
                  }
                }
              } catch (e) {
                /* swallow */
              }
            }
          }
        }
      } catch (e) {
        console.warn('Could not normalize exercise id/node', e)
      }

      // Ensure `data` object exists and move top-level alternatives/correct_index into it
      try {
        if (ex) {
          if (!ex.data || typeof ex.data !== 'object') ex.data = {} as Record<string, unknown>;
          const dataObj = ex.data as Record<string, unknown>;
          if (!dataObj.alternatives && ex.alternatives) dataObj.alternatives = ex.alternatives;
          if (!dataObj.correct_index && (typeof ex.correct_index === 'number' || typeof ex.correct_index === 'string')) {
            // coerce numeric-like strings
            const ci = Number((ex as any).correct_index);
            if (!Number.isNaN(ci)) dataObj.correct_index = ci;
          }
        }
      } catch (e) {
        // non-fatal
      }

      console.log('EXERCISE (normalized):', ex);

      return ex as Exercise;

    } catch (error) {

      console.error(
        'GET EXERCISE ERROR:',
        error
      );

      throw error;

    }

  },

  // ========================================
  // ENVIAR EVENTO
  // ========================================

  async submitSessionEvent(
    _,
    token,
    event
  ) {

    console.log(
      'SUBMIT SESSION EVENT:',
      event
    );

    const response = await fetch(`${BACKEND_URL}/api/sessions/end`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        session_events: [event],
        sessionMetadata: { completedAt: new Date().toISOString() },
      }),
    });

    console.log(
      'SUBMIT RESPONSE STATUS:',
      response.status
    );

    if (!response.ok) {

      const errorText =
        await response.text();

      console.error(
        'SUBMIT ERROR:',
        errorText
      );

      throw new Error(
        `Error submitting event: ${response.statusText}`
      );

    }

    const result = await response.json();
    console.log('SUBMIT RESULT:', result);

    const drl = result?.data ?? result;
    const total = drl?.total_reward ?? 0;

    return {
      score: Math.round(total * 100),
      message: event.correct ? '✅ ¡Correcto!' : '❌ Intenta de nuevo',
      details: {
        reward: total,
        proficiencies: drl?.updated_proficiencies ?? {},
      },
    };

  },

  // ========================================
  // FINALIZAR SESIÓN
  // ========================================

  async endSession(
    _,
    token,
    events
  ) {

    console.log(
      'END SESSION EVENTS:',
      events
    );

    const response = await fetch(`${BACKEND_URL}/api/sessions/end`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        session_events: events,
        sessionMetadata: { completedAt: new Date().toISOString() },
      }),
    });

    console.log(
      'END SESSION STATUS:',
      response.status
    );

    if (!response.ok) {

      const errorText =
        await response.text();

      console.error(
        'END SESSION ERROR:',
        errorText
      );

      throw new Error(
        `Error ending session: ${response.statusText}`
      );

    }

    const json = await response.json();
    const drl = json?.data ?? json;
    console.log('END SESSION RESPONSE:', drl);
    return drl;

  },

  // ========================================
  // STATS
  // ========================================

  async getStudentStats(
    userId,
    token
  ) {

    console.log(
      'GET STUDENT STATS:',
      userId
    );

    const response = await fetch(

      `${BACKEND_URL}/api/students/${userId}/stats`,

      {

        headers: {
          Authorization:
            `Bearer ${token}`,
        },

      }

    );

    console.log(
      'STATS STATUS:',
      response.status
    );

    if (!response.ok) {

      const errorText =
        await response.text();

      console.error(
        'STATS ERROR:',
        errorText
      );

      throw new Error(
        `Error fetching stats: ${response.statusText}`
      );

    }

    const data =
      await response.json();

    console.log(
      'STATS RESPONSE:',
      data
    );

    return data;

  },

};