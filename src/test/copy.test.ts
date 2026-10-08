import { describe, expect, it } from 'vitest'

// 需求文档 5.5：界面上不用通用说法，统一用“存档”系列文案
const FORBIDDEN = ['保存成功', '撤回', '修改', '导出', '导入']

const sources = import.meta.glob<string>(['../**/*.tsx', '../backup/html.ts', '!../dev/**'], {
  query: '?raw',
  import: 'default',
  eager: true,
})

describe('界面文案', () => {
  it('能读到界面代码', () => {
    expect(Object.keys(sources).length).toBeGreaterThan(5)
  })

  it.each(Object.entries(sources))('%s 不含通用说法', (_path, source) => {
    for (const word of FORBIDDEN) expect(source).not.toContain(word)
  })
})
