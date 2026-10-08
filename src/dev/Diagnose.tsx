import { useState } from 'react'
import { db } from '../db/db.ts'
import { clearDiagLog, readDiagLog } from './errorLog.ts'

function withTimeout<T>(p: Promise<T>, ms: number): Promise<T | 'timeout'> {
  return Promise.race([p, new Promise<'timeout'>((r) => setTimeout(() => r('timeout'), ms))])
}

function hex(buf: ArrayBuffer) {
  return [...new Uint8Array(buf.slice(0, 4))].map((b) => b.toString(16).padStart(2, '0')).join('')
}

async function readTest(blob: Blob | undefined): Promise<string> {
  if (!blob) return '无'
  const head = `size=${blob.size} type=${blob.type || '空'}`
  try {
    const buf = await withTimeout(blob.arrayBuffer(), 3000)
    if (buf === 'timeout') return `${head} 读取超时`
    return `${head} 读到${buf.byteLength} 头${hex(buf)}`
  } catch (e) {
    return `${head} 读取失败 ${(e as Error).name} ${(e as Error).message}`
  }
}

function decodeTest(url: string): Promise<string> {
  return withTimeout(
    new Promise<string>((resolve) => {
      const img = new Image()
      img.onload = () => resolve(`显示成功 ${img.naturalWidth}x${img.naturalHeight}`)
      img.onerror = () => resolve('显示失败')
      img.src = url
    }),
    3000,
  ).then((r) => (r === 'timeout' ? '显示超时' : r))
}

async function imageTests(blob: Blob | undefined): Promise<string> {
  if (!blob) return ''
  const direct = URL.createObjectURL(blob)
  const a = await decodeTest(direct)
  URL.revokeObjectURL(direct)
  let b = '复制失败'
  try {
    const copy = URL.createObjectURL(new Blob([await blob.arrayBuffer()], { type: blob.type }))
    b = await decodeTest(copy)
    URL.revokeObjectURL(copy)
  } catch {
    // 保持“复制失败”
  }
  return `直接:${a} 复制后:${b}`
}

async function runDiagnosis(): Promise<string> {
  const out: string[] = []
  out.push(`UA ${navigator.userAgent}`)
  out.push(`主屏幕模式 ${matchMedia('(display-mode: standalone)').matches}`)
  out.push(`持久保存 ${await navigator.storage?.persisted?.()}`)
  const est = await navigator.storage?.estimate?.()
  if (est) out.push(`已用 ${Math.round((est.usage ?? 0) / 1024)} KB / ${Math.round((est.quota ?? 0) / 1048576)} MB`)
  const t0 = performance.now()
  const media = await withTimeout(db.media.toArray(), 5000)
  if (media === 'timeout') {
    out.push('读取 media 表超时')
  } else {
    out.push(`media 表 ${media.length} 条，用时 ${Math.round(performance.now() - t0)} ms`)
    out.push(`saves 表 ${await db.saves.count()} 条`)
    for (const m of media.slice(-12)) {
      out.push(`— ${m.kind} ${m.mimeType} ${m.id.slice(0, 6)}`)
      out.push(`  原图 ${await readTest(m.blob)}`)
      if (m.kind === 'photo') {
        out.push(`  缩略 ${await readTest(m.thumbBlob)}`)
        out.push(`  缩略 ${await imageTests(m.thumbBlob)}`)
      }
    }
  }
  out.push('— 运行记录')
  out.push(...readDiagLog())
  return out.join('\n')
}

export default function Diagnose() {
  const [text, setText] = useState('')
  const [busy, setBusy] = useState(false)
  const [copied, setCopied] = useState('')

  async function run() {
    setBusy(true)
    setCopied('')
    try {
      setText(await runDiagnosis())
    } catch (e) {
      setText(`检查出错 ${(e as Error).name} ${(e as Error).message}\n${readDiagLog().join('\n')}`)
    } finally {
      setBusy(false)
    }
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(text)
      setCopied('已复制')
    } catch {
      setCopied('复制失败，请长按下面的文字手动全选复制')
    }
  }

  return (
    <section className="mt-8 border-t border-current/20 pt-4">
      <h2 className="font-semibold">排查信息（临时）</h2>
      <div className="mt-2 flex gap-2">
        <button type="button" onClick={run} disabled={busy} className="rounded border px-3 py-2">
          {busy ? '检查中…' : '开始检查'}
        </button>
        <button type="button" onClick={copy} disabled={!text} className="rounded border px-3 py-2">
          复制结果
        </button>
        <button type="button" onClick={() => { clearDiagLog(); setText('') }} className="rounded border px-3 py-2">
          清空记录
        </button>
      </div>
      {copied && <p className="mt-2 text-sm">{copied}</p>}
      <pre className="mt-2 text-xs whitespace-pre-wrap break-all select-text">{text}</pre>
    </section>
  )
}
