import { Obj, ReqProps, PrefetchProps, FetchProps, FetchMethod, FetchResponse, SetupOptions, CollectionOptions } from './types'

import * as fetchStore from './store'
import { fetchData, splitProps, propsToCGI, isString, isObject, produceError, emitResponse, omit, extractResponse } from './utils'

const META: Obj = { options: {}, collections: {} }
const VIRTUAL_METHODS = ['get', 'put', 'post', 'patch', 'delete']
const VERIFY: Obj = {
  name: { test: (v: string) => v in META.collections, text: "Collection '{{value}}' was not recognized" },
  url: { text: "Collection '{{value}}' has no URL" },
  method:{ text: "Collection '{{value}}' has no method" },
}

const buildURL = (req: ReqProps, method: FetchMethod) => {
  const result = req.collection.url + (req.special.$path || '')
  const postfix = method.toUpperCase() === 'GET' ? propsToCGI(req.body) : ''
  return result + postfix
}

function buildInfo(fetchProps: FetchProps): PrefetchProps {
  const { name, props } = fetchProps
  const collection = META.collections[name]
  const method = (fetchProps.method || collection?.method || '').toUpperCase()
  const problems = verifyInfo({ name, method, url: collection?.url })
  const req = buildReq(name, props, method)
  const url = buildURL(req, method)

  return { req, url, problems }
}
function verifyInfo(info: Obj) {
  return Object.keys(VERIFY)
    .map((key) => {
      const { test, text } = VERIFY[key]
      return !isString(info[key], true) || !(test ? test(info.name) : true)
        ? text.replace('{{value}}', info.name)
        : null
    }).filter(Boolean)
}

function buildReq(name: string, props: Obj, method: FetchMethod): ReqProps {
  const collection: CollectionOptions = META.collections[name]
  const { params, special } = splitProps(props)
  const hash = `${name}+++${JSON.stringify(params)}`
  const body = special.$body || { ...collection.props, ...params }
  const multi = Array.isArray(collection.collections) && Boolean(collection.collections.length)
  const options = {
    ...META.options,
    ...collection.options,
    ...special.$options,
    method: method || collection.method,
    headers: {
      ...META.options.headers,
      ...collection.headers,
      ...special.$headers
    },
  }

  return { collection, body, options, props, special, name, hash, multi }
}

// TODO: Started throwing compile errors after updating TS // const initiateRequest = (req: ReqProps, url: string) => {
const initiateRequest = (req: Obj, url: string) => {
  const { collection, options, props, body } = req

  if (options.method !== 'GET') {
    if (collection.isFile) {
      Object.assign(options.headers, { enctype: 'multipart/form-data' })
      options.body = props.formData
    } else {
      options.body = JSON.stringify(body)
    }
  }

  return fetchData(url, options)
}

const requestData = (req?: ReqProps, url?: string) => {
  if (!req || !url) return Promise.reject(new Error('BAD THING HAPPENED'))

  const CACHE = fetchStore.cacheHas(req.hash)
  const useCache = !!(CACHE && req.special.$refresh !== true)
  if (useCache) return Promise.resolve(CACHE)

  const promise = 'mock' in req.collection
    ? Promise.resolve({ data: req.collection.mock, MOCK: true })
    : initiateRequest(req, url)

  fetchStore.reqAdd(req.hash, promise)

  return promise
}

const fetchOne = (fetchProps: FetchProps): Promise<any|FetchResponse> => {
  try {
    const { req, url, problems } = buildInfo(fetchProps)
    const existing = fetchStore.reqHas(req?.hash)

    if (req?.multi) return fetchMultiple(req)
    if (existing) return existing // Intercept a matching unresolved request and use its Promise

    const promise = problems?.length ? Promise.reject({ problems, $req: req }) : requestData(req, url)

    return promise
      .then((v: any) => ({...v, $req: req}))
      .then((v: any) => processResponse(req || {}, v))
      .then((v: any) => extractResponse(v, (req?.special.$extract || req?.collection.extract)))
  } catch (err) {
    return Promise.reject(err)
  }
}
const fetchMultiple = async (req: ReqProps) => {
  const { collections = [] } = req.collection
  const list = collections.map((name: string) => fetchAttempt(name, req.props[name]))

  const data = await Promise.all(list)
  return collections.reduce((result: Obj, name: string, idx: number) => ({ ...result, [name]: data[idx] }), {})
}

const processResponse = (req: Obj, response: any) => {
  fetchStore.reqRemove(req.hash)
  const data = JSON.parse(JSON.stringify(response))

  if (req.collection?.cache === 'ram') fetchStore.cacheAdd(req.hash, data)

  return data
}

const Setup = (props: SetupOptions) => {
  const { collections, options } = props

  if (isObject(options, true)) META.options = options
  if (isObject(collections, true)) META.collections = collections

  return META
}

const fetchAttempt = async (name: string, props: Obj = {}, method?: FetchMethod) => {
  const reject = (props?.$reject || META?.collections[name]?.props?.$reject) === true
  const { $req, ...result } = await fetchOne({name, props, method}).catch(produceError)
  const output = omit(result, ['$req'])

  if ($req) emitResponse(output, $req)

  return reject ? Promise.reject(output) : output
}

const proxy = new Proxy(Object.freeze({ fetch: fetchAttempt, Setup, META }), {
  get(target: Obj, prop: FetchMethod): any {
    if (VIRTUAL_METHODS.includes(prop)) {
      return (name: string, props: Obj = {}) => fetchAttempt(name, props, prop)
    } else if (prop in target) {
      return target[prop]
    }
  }
})

export default proxy
