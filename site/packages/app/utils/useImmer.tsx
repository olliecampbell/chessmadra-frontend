import produce from 'immer'
import useStateRef from 'react-usestateref'
import { isAsyncFunction } from './isAsyncFunction'
import { useRef, useState } from 'react'
import { cloneDeep } from 'lodash'

export function useStateUpdater<T>(
  initial: T
): [T, (_: (_: T) => void) => void] {
  const [v, setV] = useState(initial)
  const modifiableCopy = useRef(null)
  const vRef = useRef(initial)
  const update = async (f: (_: T) => void) => {
    // if (locked.current) {
    //   debugger
    //   return
    // }
    let newState = null as T
    let shouldClearCopy = false
    if (modifiableCopy.current) {
      newState = modifiableCopy.current
    } else {
      shouldClearCopy = true
      modifiableCopy.current = cloneDeep(vRef.current)
      newState = modifiableCopy.current
    }
    await f(newState)
    setV(newState)
    vRef.current = newState
    if (shouldClearCopy) {
      modifiableCopy.current = null
    } else {
    }
    // if (isAsyncFunction(update)) {
    // } else {
    //   setV(produce(v, update))
    // }
  }
  return [v, update]
}

export type UpdatadableState<T> = T & {
  update: (_: (_: T) => void) => void
}

export function useStateUpdaterV2<T>(initial: T): UpdatadableState<T> {
  const [v, setV] = useState(initial)
  const locked = useRef(false)
  const vRef = useRef(initial)
  const update = async (f: (_: T) => void) => {
    // if (locked.current) {
    //   debugger
    //   return
    // }
    locked.current = true
    const newState = vRef.current
    if (f[Symbol.toStringTag] === 'AsyncFunction') {
      await f(newState)
    } else {
      f(newState)
    }
    setV(newState)
    locked.current = false
    // if (isAsyncFunction(update)) {
    // } else {
    //   setV(produce(v, update))
    // }
  }
  // @ts-ignore
  v.update = update
  // @ts-ignore
  return v
}
