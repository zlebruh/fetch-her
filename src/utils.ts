import { Obj, ReqProps, FetchError } from './types'

export function isString(str: string, checkEmpty?: boolean) {
  const isString = typeof str === 'string'
  return checkEmpty !== true ? isString : isString && !!str.length
}

export function isObject(val: any, checkEmpty?: boolean) {
  try {
    const isOb = typeof val === 'object' && !Array.isArray(val) && val !== null
    return checkEmpty === true
      ? isOb && !!Object.keys(val).length
      : isOb
  } catch (err) {
    return false
  }
}

export function produceError(err: Obj|any, result?: Obj): FetchError {
  const { problems = [], $req = null } = err || {}
  const { data = null } = result || {}
  const message = err.message || err.error || err.errors

  if (message) problems.push(message)

  return { ...result, error: 1, data, problems, $req }
}

export function propsToCGI(options: Obj = {}) {
  const keys = Object.keys(options)
  const max = keys.length - 1
  const initial = keys.length ? '?' : ''

  return keys.reduce((sum, key, idx) => {
    const item = String(options[key])
    const amp = idx >= max ? '' : '&'
    return `${sum + key}=${item + amp}`
  }, initial)
}

export function splitProps(obj: Obj): Obj {
  const SPECIAL = ['$done', '$body', '$path', '$refresh', '$reject', '$options', '$headers', '$extract']
  const params = { ...obj }
  const special: Obj = {}

  for (let i = 0; i < SPECIAL.length; i += 1) {
    const key = SPECIAL[i]
    if (key in params) {
      special[key] = params[key]
      delete params[key]
    }
  }
  return { params, special }
}

export function omit(target: Obj, keys:string[] = []) {
  const result = { ...target }
  for (const key of keys) delete result[key]
  return result
}

export function pick(target: Obj, keys:string[] = []) {
  return isObject(target)
    ? keys.filter(v => v).reduce((v: Obj|null, k) => ({ ...v, [k]: target[k] }), null) || target
    : target
}

export function extractResponse(reqResponse: Obj, extract: string[]) {
  return { ...reqResponse, data: pick(reqResponse.data, extract) }
}

export function emitResponse(detail: any, req: ReqProps) {
  const done = req?.special.$done || req?.collection.done
  const type = typeof done

  if (type === 'string' && window) window.dispatchEvent(new CustomEvent(done, { detail }))
  if (type === 'function') done(detail)

  return detail
}

// ####################### FETCH #######################
const regex = { json: /application\/json/, file: /image|file/ }
const contentType = 'content-type'

export async function fetchData(uri: string, options: RequestInit = {}) {
  try {
    const res = await fetch(uri, options)
    const headers: Obj = [...res.headers.entries()].reduce((r, pair) => {
      const [key, val] = pair.map(v => v.toLowerCase())
      return Object.assign(r, {[key]: val})
    }, {})
    const contentHeader = headers[contentType]
    const data: any = await (regex.json.test(contentHeader)
      ? res.json()
      : regex.file.test(contentHeader) ? res.blob() : res.text())
    const { status } = res
    const result = { status, data }

    return status >= 400
      ? produceError({ message: res.statusText }, result)
      : data?.data === void 0 ? result : { status, ...data }
  } catch (err) {
    return produceError(err)
  }
}
