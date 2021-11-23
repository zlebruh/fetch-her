import * as utils from './utils'
import * as fetchStore from '../src/store'

const META = { options: {}, collections: {} }

const REQ = ({ name, params, method }) => {
  const collection = META.collections[name]
  const { props, special } = utils.splitProps(params)
  const hash = `${name}+++${JSON.stringify(props)}`
  const multi = Array.isArray(collection.collections)
  const options = {
    ...META.options,
    ...collection.options,
    ...special.$options,
    headers: {
      ...META.options.headers,
      ...collection.headers,
      ...special.$headers
    },
  }

  const reqMethod = method || collection.method
  if (reqMethod) options.method = reqMethod.toUpperCase()

  return { collection, options, props, special, name, hash, multi }
}

const Setup = (props = {}) => {
  const { collections, options } = props

  if (utils.isObject(options, true)) META.options = options
  if (utils.isObject(collections, true)) META.collections = collections

  return META
}

const processResponse = (req, response) => {
  fetchStore.reqRemove(req.hash)

  if (!response || response.error) return response

  switch (req.collection.cache) {
    case 'ram': fetchStore.cacheAdd(req.hash, response); break
    case 'local': break
    default: break
  }

  return utils.cloneData(response)
}

const initiateRequest = ({ collection, options, props, special }) => {
  let url = String(collection.url)
  const path = '$path'
  const urlParam = special[path]

  if (typeof urlParam === 'string') {
    if (!urlParam.length) return Promise.reject(new Error(`Property '${path}' must be a non-empty string`))
    url += urlParam
  }

  const body = special.$body || { ...collection.props, ...props }

  switch (options.method) {
    case 'GET': url += utils.propsToCGI(body); break
    case 'PUT':
    case 'POST':
    case 'PATCH':
    case 'DELETE':
      if (collection.isFile) {
        options.headers.enctype = 'multipart/form-data'
        options.body = props.formData
      } else {
        options.body = JSON.stringify(body)
      }
      break
    default: break
  }

  return utils.fetchData(url, options)
}

const requestData = (req) => {
  const promise = 'mock' in req.collection
    ? Promise.resolve({ data: req.collection.mock, MOCK: true })
    : initiateRequest(req)

  fetchStore.reqAdd(req.hash, promise)

  return promise
}

const requestMultiple = (req) => {
  const { collections } = req.collection
  const list = collections.map(name => FetchData(name, req.props[name]))

  return Promise
    .all(list)
    .then(data => collections.reduce((result, name, idx) => ({ ...result, [name]: data[idx] }), {}))
}

const validateRequest = (props) => {
  if (!(props.name in META.collections)) return new Error(`Collection '${props.name}' was not recognized`)
  
  const req = REQ(props)
  return req.multi || req.collection.mock || req?.options?.method
    ? req
    : new Error(`Collection '${props.name}' has no method`)
}

const serveCacheOrRequest = (req) => {
  const CACHE = fetchStore.cacheHas(req.hash)
  const useCache = !!(CACHE && req.special.$refresh !== true)
  return useCache ? CACHE : requestData(req)
}

const FetchData = (name, params = {}, method) => {
  const req = validateRequest({ name, params, method })
  const existing = fetchStore.reqHas(req.hash)

  if (req.multi) return requestMultiple(req)

  // Intercept a matching unresolved request and use its Promise
  if (existing) return existing

  const promise = req instanceof Error
    ? Promise.reject(req)
    : serveCacheOrRequest(req)

  return promise
    .then(v => processResponse(req, v))
    .then(v => utils.extractResponse(v, (req.special.$extract || req.collection.extract)))
    .then(v => utils.emitResponse(v, (req.special.$emit || req.collection.emit)))
    .catch(utils.produceError)
    .then(v => params.$reject ? Promise.reject(v) : v)
}

const VIRTUAL_METHODS = ['get', 'put', 'post', 'patch', 'delete']
const proxy = new Proxy({ fetch: FetchData, Setup, META }, {
  get(target, prop) {
    if (VIRTUAL_METHODS.includes(prop)) {
      return (name, params = {}) => FetchData(name, params, prop)
    } else if (prop in target) {
      return target[prop]
    }
  }
})

export default proxy
