// Cliente HTTP central do frontend.
// Substitui o cliente do Supabase: fala com o backend proprio via REST + JWT.
// O token e guardado no localStorage e injetado no header Authorization.

const API_URL = (import.meta.env.VITE_API_URL as string | undefined) || 'http://localhost:3001/api'
const TOKEN_KEY = 'poupeazy_token'

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}

export function setToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token)
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY)
}

// Erro padronizado da API, com o status HTTP e a mensagem vinda do backend.
export class ApiError extends Error {
  status: number
  code?: string
  retryAfterSeconds?: number
  constructor(message: string, status: number, code?: string, retryAfterSeconds?: number) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
    this.retryAfterSeconds = retryAfterSeconds
  }
}

interface RequestOptions {
  method?: string
  body?: unknown
  auth?: boolean
  timeoutMs?: number
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, auth = true, timeoutMs } = options
  const headers: Record<string, string> = {}

  if (body !== undefined) headers['Content-Type'] = 'application/json'

  if (auth) {
    const token = getToken()
    if (token) headers['Authorization'] = `Bearer ${token}`
  }

  let res: Response
  try {
    res = await fetch(`${API_URL}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      ...(timeoutMs ? { signal: AbortSignal.timeout(timeoutMs) } : {}),
    })
  } catch (error) {
    if (timeoutMs) throw new ApiError('Não foi possível confirmar o resultado da solicitação.', 0, 'REQUEST_OUTCOME_UNKNOWN')
    throw error
  }

  // Uma falha em uma operação pública (login/exclusão com outra credencial)
  // não deve encerrar a sessão que já está aberta no navegador.
  if (res.status === 401 && auth) {
    clearToken()
  }

  const text = await res.text()
  const data = text ? JSON.parse(text) : null

  if (!res.ok) {
    const message = (data && (data.error || data.message)) || `Erro ${res.status}`
    const retry = data?.retry_after_seconds
    throw new ApiError(message, res.status, typeof data?.code === 'string' ? data.code : undefined,
      typeof retry === 'number' && Number.isFinite(retry) && retry >= 0 ? Math.min(3600, Math.ceil(retry)) : undefined)
  }

  return data as T
}

export const api = {
  get: <T>(path: string, opts?: { auth?: boolean }) => request<T>(path, { method: 'GET', ...opts }),
  post: <T>(path: string, body?: unknown, opts?: { auth?: boolean; timeoutMs?: number }) =>
    request<T>(path, { method: 'POST', body, ...opts }),
  patch: <T>(path: string, body?: unknown, opts?: { auth?: boolean }) =>
    request<T>(path, { method: 'PATCH', body, ...opts }),
  delete: <T>(path: string, opts?: { auth?: boolean }) => request<T>(path, { method: 'DELETE', ...opts }),
}
