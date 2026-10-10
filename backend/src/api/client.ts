const TOKEN_KEY = 'tuanzi_admin_token'
const USER_KEY = 'tuanzi_admin_user'

export class ApiError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ApiError'
  }
}

interface CloudEnvelope<T> {
  ok: boolean
  data?: T
  message?: string
}

function clearSession(): void {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(USER_KEY)
}

function unwrapResult(raw: unknown): CloudEnvelope<unknown> {
  if (raw && typeof raw === 'object' && 'body' in raw) {
    const body = (raw as { body?: unknown }).body
    if (typeof body === 'string') {
      return JSON.parse(body) as CloudEnvelope<unknown>
    }
    if (body && typeof body === 'object') {
      return body as CloudEnvelope<unknown>
    }
  }
  return raw as CloudEnvelope<unknown>
}

export async function callAdmin<T>(
  action: string,
  data: Record<string, unknown> = {},
  options?: { skipAuth?: boolean },
): Promise<T> {
  const token = options?.skipAuth ? '' : localStorage.getItem(TOKEN_KEY) || ''

  let response: Response
  try {
    response = await fetch('/api/admin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, token, ...data }),
    })
  } catch {
    throw new ApiError('无法连接本地开发服务器。请先在 backend 目录执行 npm run dev。')
  }

  if (!response.ok) {
    throw new ApiError(`本地代调失败（HTTP ${response.status}）`)
  }

  let envelope: CloudEnvelope<T>
  try {
    envelope = unwrapResult(await response.json()) as CloudEnvelope<T>
  } catch {
    throw new ApiError('云函数返回了无法解析的数据')
  }

  if (!envelope || typeof envelope.ok !== 'boolean') {
    throw new ApiError('云函数返回格式不正确，请确认已部署最新的 adminApi')
  }

  if (!envelope.ok) {
    const message = envelope.message || '请求失败'
    if (message.includes('未登录') || message.includes('登录已过期')) {
      clearSession()
    }
    throw new ApiError(message)
  }

  return envelope.data as T
}

export { TOKEN_KEY, USER_KEY }
