import { Obj } from './types'
const CACHE = Object.create(null)
const REQUESTS = Object.create(null)

// Shorthands
const add = (store: Obj, hash: string, payload: Promise<any>|Obj, type: string): boolean => {
  const existing = hash in store

  if (!existing) store[hash] = payload

  return existing
}

const remove = (store: Obj, hash: string): boolean => store[hash] ? delete store[hash] : false

// Requests
export const reqHas = (hash: string = '') => REQUESTS[hash] || null
export const reqAdd = (hash: string, promise: Promise<any>) => add(REQUESTS, hash, promise, 'REQUESTS')
export const reqRemove = (hash: string) => remove(REQUESTS, hash)

// Cache
export const cacheHas = (hash: string) => CACHE[hash] || null
export const cacheAdd = (hash: string, data: Obj) => add(CACHE, hash, data, 'CACHE')
export const cacheRemove = (hash: string) => remove(CACHE, hash)
