import { describe, expect, it } from 'vitest'
import { computeSaveNumbers } from './numbering.ts'

const at = (hhmm: string) => Date.parse(`2026-10-08T${hhmm}:00+08:00`)
const A = { id: 'A', createdAt: at('10:00') }
const B = { id: 'B', createdAt: at('11:00') }
const C = { id: 'C', createdAt: at('12:00') }
const D = { id: 'D', createdAt: at('13:00') }

const asObject = (m: Map<string, number>) => Object.fromEntries(m)

describe('存档编号计算', () => {
  it('A、B、C 不论输入顺序如何，编号都是 1、2、3', () => {
    expect(asObject(computeSaveNumbers([C, A, B]))).toEqual({ A: 1, B: 2, C: 3 })
    expect(asObject(computeSaveNumbers([B, C, A]))).toEqual({ A: 1, B: 2, C: 3 })
  })

  it('去掉 B 后，C 往前补位变成 2', () => {
    expect(asObject(computeSaveNumbers([A, C]))).toEqual({ A: 1, C: 2 })
  })

  it('再加一条 D，D 是 3', () => {
    expect(asObject(computeSaveNumbers([A, C, D]))).toEqual({ A: 1, C: 2, D: 3 })
  })

  it('没有存档时输出为空，不报错', () => {
    expect(computeSaveNumbers([]).size).toBe(0)
  })
})
