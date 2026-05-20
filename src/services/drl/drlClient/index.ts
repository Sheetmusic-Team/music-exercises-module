// Cliente DRL: conexión con backend + DRL Engine

import type { Exercise, Feedback } from '../../../types/exercise'

const BACKEND_URL = (import.meta.env.VITE_BACKEND_URL as string) || 'http://localhost:3000'

interface SessionEventRequest {
  node: string
  correct: boolean
  difficulty: number
  response_time: number
}

interface StudentStats {
  totalSessions: number
  averageReward: number
  averageSuccessRate: number
}

interface SessionResult {
  total_reward: number
  node_rewards: Record<string, number>
  updated_proficiencies: Record<string, number>
  success_rate: number
  next_recommendations?: string[]
  drl_training_triggered?: boolean
  buffer_size?: number
}

export interface DRLClient {
  getExercise(userId: string, token: string, focusNode?: string): Promise<Exercise>
  submitSessionEvent(userId: string, token: string, event: SessionEventRequest): Promise<Feedback>
  endSession(userId: string, token: string, events: SessionEventRequest[]): Promise<SessionResult>
  getStudentStats(userId: string, token: string): Promise<StudentStats>
}

// Helper: attempt to extract the raw exercise object from several backend shapes
function extractRawExercise(body: unknown): Record<string, unknown> | null {
  if (!body) return null
  const b = body as Record<string, unknown>

  const dataObj = (b.data as Record<string, unknown> | undefined)
  if (dataObj && typeof dataObj === 'object') {
    // prefer explicit exercise namespace
    if (dataObj.exercise && typeof dataObj.exercise === 'object') return dataObj.exercise as Record<string, unknown>
    // otherwise, the data object might already be the exercise
    if (dataObj.node || dataObj.presentation_format || dataObj.alternatives) return dataObj
  }

  if (b.exercise && typeof b.exercise === 'object') return b.exercise as Record<string, unknown>

  if (typeof b === 'object' && b.node) return b

  return null
}

// Helpers for normalization broken down to reduce cognitive complexity
function ensureDataObject(ex: Record<string, unknown>): Record<string, unknown> {
  if (!ex.data || typeof ex.data !== 'object') ex.data = {}
  return ex.data as Record<string, unknown>
}

function ensureId(ex: Record<string, unknown>): void {
  if (!ex.id) {
    const node = (ex.node as string) ?? (ex.node_id as string) ?? 'exercise'
    ex.id = `${String(node).toLowerCase()}-${Date.now()}`
  }
}

function normalizePrompt(ex: Record<string, unknown>): void {
  if (!ex.prompt) {
    if (ex.exercise && typeof ex.exercise === 'string') ex.prompt = ex.exercise
    else if (ex.question && typeof ex.question === 'string') ex.prompt = ex.question
  }
}

function moveTopLevelFieldsToData(ex: Record<string, unknown>, dataObj: Record<string, unknown>): void {
  if (!dataObj.alternatives && ex.alternatives) dataObj.alternatives = ex.alternatives
  if (!dataObj.correct_index && (typeof ex.correct_index === 'number' || typeof ex.correct_index === 'string')) {
    const ci = Number(ex.correct_index)
    if (!Number.isNaN(ci)) dataObj.correct_index = ci
  }
  if (!dataObj.feedback && ex.feedback) dataObj.feedback = ex.feedback
}

function deriveExpectedAnswerFromData(ex: Record<string, unknown>, dataObj: Record<string, unknown>): void {
  if (ex.expected_answer) return
  const alts = dataObj.alternatives
  const ciRaw = dataObj.correct_index
  const ci = Number(ciRaw)
  if (!Array.isArray(alts) || Number.isNaN(ci)) return
  const arr = alts as unknown[]
  if (ci >= 0 && ci < arr.length) {
    const val = arr[ci]
    if (typeof val === 'string' || typeof val === 'number') ex.expected_answer = String(val)
  }
}

function normalizeExerciseObject(raw: Record<string, unknown>): Record<string, unknown> {
  const ex: Record<string, unknown> = { ...raw }
  const dataObj = ensureDataObject(ex)

  ensureId(ex)

  const nodeVal = ex.node
  if (typeof nodeVal === 'string') ex.node = nodeVal.toLowerCase()

  normalizePrompt(ex)
  moveTopLevelFieldsToData(ex, dataObj)
  deriveExpectedAnswerFromData(ex, dataObj)

  return ex
}

export const drlClient: DRLClient = {
  // ========================================
  // OBTENER EJERCICIO
  // ========================================

  async getExercise(_, token, focusNode) {
    console.log('======================')
    console.log('GET EXERCISE')
    console.log('======================')

    console.log('BACKEND URL:', BACKEND_URL)
    console.log('TOKEN:', token)
    console.log('FOCUS NODE:', focusNode)

    const options: RequestInit = {
      method: focusNode ? 'POST' : 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    }

    if (focusNode) options.body = JSON.stringify({ focus: { nodes: [focusNode], strict: true } })

    try {
      const response = await fetch(`${BACKEND_URL}/api/exercises/next`, options)
      const rawText = await response.text()
      let parsed: unknown
      try {
        parsed = rawText ? JSON.parse(rawText) : null
      } catch (err) {
        console.error('JSON PARSE ERROR:', err)
        throw new Error('Respuesta inválida del backend')
      }

      if (!response.ok) {
        console.error('BACKEND ERROR:', parsed)
        const p = parsed as Record<string, unknown> | null
        const errMsg = p && typeof p.error === 'string' ? p.error : `HTTP ${response.status}`
        throw new Error(errMsg)
      }

      const rawExercise = extractRawExercise(parsed)
      if (!rawExercise) {
        console.error('NO EXERCISE FOUND:', parsed)
        throw new Error('No exercise returned')
      }

      const normalized = normalizeExerciseObject(rawExercise)
      console.log('EXERCISE (normalized):', normalized)
      return normalized as Exercise
    } catch (error) {
      console.error('GET EXERCISE ERROR:', error)
      throw error
    }
  },

  // ========================================
  // ENVIAR EVENTO
  // ========================================

  async submitSessionEvent(_, token, event) {
    console.log('SUBMIT SESSION EVENT:', event)
    const response = await fetch(`${BACKEND_URL}/api/sessions/end`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ session_events: [event], sessionMetadata: { completedAt: new Date().toISOString() } }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('SUBMIT ERROR:', errorText)
      throw new Error(`Error submitting event: ${response.statusText}`)
    }

  const result = await response.json()
  const drl = getDrlData<Record<string, unknown>>(result) ?? (result as Record<string, unknown>)
  const total = (drl?.total_reward ?? 0) as number

    return {
      score: Math.round(total * 100),
      message: event.correct ? '✅ ¡Correcto!' : '❌ Intenta de nuevo',
      details: { reward: total, proficiencies: drl?.updated_proficiencies ?? {} },
    }
  },

  // ========================================
  // FINALIZAR SESIÓN
  // ========================================

  async endSession(_, token, events) {
    console.log('END SESSION EVENTS:', events)
    const response = await fetch(`${BACKEND_URL}/api/sessions/end`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ session_events: events, sessionMetadata: { completedAt: new Date().toISOString() } }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('END SESSION ERROR:', errorText)
      throw new Error(`Error ending session: ${response.statusText}`)
    }

    const json = await response.json()
    const drl = getDrlData<Record<string, unknown>>(json) ?? (json as Record<string, unknown>)
    const sr: SessionResult = {
      total_reward: (drl['total_reward'] ?? 0) as number,
      node_rewards: (drl['node_rewards'] ?? {}) as Record<string, number>,
      updated_proficiencies: (drl['updated_proficiencies'] ?? {}) as Record<string, number>,
      success_rate: (drl['success_rate'] ?? 0) as number,
      next_recommendations: (drl['next_recommendations'] as string[] | undefined) ?? undefined,
      drl_training_triggered: (drl['drl_training_triggered'] as boolean | undefined) ?? undefined,
  buffer_size: Object.hasOwn(drl, 'buffer_size') ? Number(drl['buffer_size']) : undefined,
    }
    return sr
  },

  // ========================================
  // STATS
  // ========================================

  async getStudentStats(userId, token) {
    console.log('GET STUDENT STATS:', userId)
    const response = await fetch(`${BACKEND_URL}/api/students/${userId}/stats`, { headers: { Authorization: `Bearer ${token}` } })
    if (!response.ok) {
      const errorText = await response.text()
      console.error('STATS ERROR:', errorText)
      throw new Error(`Error fetching stats: ${response.statusText}`)
    }
    const data = await response.json()
    return data as StudentStats
  },
}

function getDrlData<T = unknown>(resp: unknown): T | undefined {
  if (!resp) return undefined
  const r = resp as Record<string, unknown>
  if (r.data !== undefined) return r.data as T
  return resp as T
}