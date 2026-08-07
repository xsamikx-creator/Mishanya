import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const enc = new TextEncoder()
const toHex = (bytes: Uint8Array) => [...bytes].map(b => b.toString(16).padStart(2, '0')).join('')

async function hmac(key: string | Uint8Array, message: string) {
  const raw = typeof key === 'string' ? enc.encode(key) : key
  const cryptoKey = await crypto.subtle.importKey('raw', raw, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
  return new Uint8Array(await crypto.subtle.sign('HMAC', cryptoKey, enc.encode(message)))
}

async function verifyTelegramInitData(initData: string, botToken: string) {
  if (!initData) return { ok: false, params: new URLSearchParams() }
  const params = new URLSearchParams(initData)
  const hash = params.get('hash') || ''
  if (!hash) return { ok: false, params }
  const authDate = Number(params.get('auth_date') || 0)
  if (!authDate || Math.abs(Date.now() / 1000 - authDate) > 86400) return { ok: false, params }
  params.delete('hash')
  const dataCheckString = [...params.entries()].sort(([a],[b]) => a.localeCompare(b)).map(([k,v]) => `${k}=${v}`).join('\n')
  const secretKey = await hmac('WebAppData', botToken)
  const calculated = toHex(await hmac(secretKey, dataCheckString))
  return { ok: calculated === hash, params }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  try {
    const { initData, startParam, bucket, path } = await req.json()
    const botToken = Deno.env.get('TELEGRAM_BOT_TOKEN') || ''
    if (!botToken) throw new Error('TELEGRAM_BOT_TOKEN is not configured')

    const verified = await verifyTelegramInitData(initData || '', botToken)
    if (!verified.ok) return new Response(JSON.stringify({ error: 'Telegram authorization failed' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

    let telegramId = ''
    try { telegramId = String(JSON.parse(verified.params.get('user') || '{}').id || '') } catch {}
    const verifiedStart = verified.params.get('start_param') || startParam || ''
    const allowedIds = (Deno.env.get('ALLOWED_TELEGRAM_IDS') || '').split(',').map(x => x.trim()).filter(Boolean)
    const allowedStarts = (Deno.env.get('ALLOWED_START_PARAMS') || '').split(',').map(x => x.trim()).filter(Boolean)
    const allowed = (telegramId && allowedIds.includes(telegramId)) || (verifiedStart && allowedStarts.includes(verifiedStart))
    if (!allowed) return new Response(JSON.stringify({ error: 'Access denied' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

    if (bucket !== 'Mushing esim' || path !== 'esim-qr.jpeg') return new Response(JSON.stringify({ error: 'Invalid file request' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

    const url = Deno.env.get('SUPABASE_URL') || ''
    const serviceRole = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
    const supabase = createClient(url, serviceRole)
    const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, 300)
    if (error || !data?.signedUrl) throw error || new Error('Signed URL was not created')

    return new Response(JSON.stringify({ signedUrl: data.signedUrl }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  } catch (e) {
    return new Response(JSON.stringify({ error: e?.message || 'Server error' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }
})