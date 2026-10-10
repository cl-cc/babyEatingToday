import type { IncomingMessage, ServerResponse } from 'node:http'
import type { Plugin } from 'vite'

const DEFAULT_ENV_ID = 'cloud1-d4grqnq96d763990e'
const DEFAULT_APPID = 'wx54fac3f18bfddef7'
const PROXY_PATH = '/api/admin'

interface TokenCache {
  value: string
  expiresAt: number
}

function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = []
    req.on('data', (chunk) => {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk))
    })
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')))
    req.on('error', reject)
  })
}

function sendJson(res: ServerResponse, status: number, payload: unknown): void {
  res.statusCode = status
  res.setHeader('Content-Type', 'application/json; charset=utf-8')
  res.end(JSON.stringify(payload))
}

function mapWeChatError(errcode: number, errmsg: string): string {
  if (errcode === 40125 || errcode === 40001 || /invalid appsecret|invalid credential/i.test(errmsg)) {
    return '小程序 AppSecret 无效。请到微信公众平台核对开发者密码，并写入 backend/.env.local 后重启 npm run dev。'
  }
  if (errcode === 40013 || /invalid appid/i.test(errmsg)) {
    return '小程序 AppID 无效，请确认 VITE_CLOUD_APPID 与当前小程序一致。'
  }
  if (errcode === 85088 || /function not found|FUNCTION_NOT_FOUND/i.test(errmsg)) {
    return '未找到云函数 adminApi，请确认已部署到环境 cloud1-d4grqnq96d763990e。'
  }
  if (/env not exists|invalid env/i.test(errmsg)) {
    return '云开发环境 ID 不正确，请确认 VITE_CLOUD_ENV_ID。'
  }
  return `调用云函数失败（${errcode} ${errmsg}）`
}

export function wxCloudProxy(env: Record<string, string>): Plugin {
  const appid = env.VITE_CLOUD_APPID || env.WX_APPID || DEFAULT_APPID
  const envId = env.VITE_CLOUD_ENV_ID || env.WX_CLOUD_ENV || DEFAULT_ENV_ID
  const secret = (env.WX_APP_SECRET || '').trim()
  let tokenCache: TokenCache | null = null

  async function getAccessToken(): Promise<string> {
    if (tokenCache && Date.now() < tokenCache.expiresAt) {
      return tokenCache.value
    }

    const response = await fetch('https://api.weixin.qq.com/cgi-bin/stable_token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        grant_type: 'client_credential',
        appid,
        secret,
      }),
    })
    const data = (await response.json()) as {
      access_token?: string
      expires_in?: number
      errcode?: number
      errmsg?: string
    }
    if (!data.access_token) {
      throw new Error(mapWeChatError(data.errcode || 0, data.errmsg || '无法获取 access_token'))
    }
    tokenCache = {
      value: data.access_token,
      expiresAt: Date.now() + Math.max(60, (data.expires_in || 7200) - 180) * 1000,
    }
    return tokenCache.value
  }

  async function invokeAdmin(payload: Record<string, unknown>): Promise<unknown> {
    const accessToken = await getAccessToken()
    const url = `https://api.weixin.qq.com/tcb/invokecloudfunction?access_token=${encodeURIComponent(accessToken)}&env=${encodeURIComponent(envId)}&name=adminApi`
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    const data = (await response.json()) as {
      errcode?: number
      errmsg?: string
      resp_data?: string
    }
    if (data.errcode) {
      throw new Error(mapWeChatError(data.errcode, data.errmsg || 'invokecloudfunction 失败'))
    }
    if (!data.resp_data) {
      throw new Error('云函数没有返回数据')
    }
    return JSON.parse(data.resp_data)
  }

  async function handle(req: IncomingMessage, res: ServerResponse): Promise<boolean> {
    const url = req.url || ''
    if (!url.startsWith(PROXY_PATH)) return false

    if (req.method === 'OPTIONS') {
      res.statusCode = 204
      res.end()
      return true
    }

    if (req.method !== 'POST') {
      sendJson(res, 405, { ok: false, message: '仅支持 POST /api/admin' })
      return true
    }

    if (!secret) {
      sendJson(res, 200, {
        ok: false,
        message:
          '未配置 WX_APP_SECRET。请复制 backend/.env.example 为 .env.local，填入微信公众平台的小程序开发者密码后重启 npm run dev。该密钥只留在本地，不会打进浏览器。',
      })
      return true
    }

    try {
      const raw = await readBody(req)
      const payload = raw ? (JSON.parse(raw) as Record<string, unknown>) : {}
      const result = await invokeAdmin(payload)
      sendJson(res, 200, result)
    } catch (error) {
      const message = error instanceof Error ? error.message : '本地代调云函数失败'
      sendJson(res, 200, { ok: false, message })
    }
    return true
  }

  return {
    name: 'wx-cloud-proxy',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const handled = await handle(req, res)
        if (!handled) next()
      })
    },
    configurePreviewServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const handled = await handle(req, res)
        if (!handled) next()
      })
    },
  }
}
