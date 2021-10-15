import * as utils from './utils'
import * as fetchStore from '../src/store'

const META = { options: {}, collections: {} }

const REQ = (name, params = {}, method) => {
  const collection = META.collections[name]
  const { props, special } = utils.splitProps(params)
  const hash = `${name}+++${JSON.stringify(props)}`
  const options = {
    method: method.toUpperCase(),
    ...META.options,
    ...collection.options,
    ...special['@options'],
    headers: {
      ...META.options.headers,
      ...collection.headers,
      ...special["@headers"]
    },
  }

  return { collection, options, props, special, name, hash }
}

const Setup = (props = {}) => {
  const { collections, options } = props

  if (utils.isObject(options, true)) META.options = options
  if (utils.isObject(collections, true)) META.collections = collections

  return META
}

const GetData = (name, params = {}, method) => {
  const exists = name in META.collections
  if (!exists) return utils.produceError({ message: `Collection '${name}' was not recognized` })

  const req = REQ(name, params, method)
  const { collection, props, special, hash } = req

  // There are collections that combine multiple collections
  if (collection.collections) return requestMultiple(collection.collections, props)

  const CACHE = fetchStore.cacheHas(hash)
  const useCache = !!(CACHE && special['@refresh'] !== true)

  const result = useCache
    ? Promise.resolve(CACHE)
    : requestData(req)

  return result
    .then(v => utils.cloneData({ ...v, collection: name }))
    .then(v => utils.extractResponse(v, (special['@extract'] || collection.extract)))
    .then(v => utils.emitResponse(v, (special['@emit'] || collection.emit)))
}

// ############################### LOCAL ###############################
const processResponse = (collection, hash, response) => {
  fetchStore.reqRemove(hash)

  if (!response || response.error) return response

  switch (collection.cache) {
    case 'ram': fetchStore.cacheAdd(hash, response); break
    case 'local': break
    default: break
  }

  return response
}

const initiateRequest = ({ collection, options, props, special }) => {
  let url = String(collection.url)
  const path = '@path'
  const urlParam = special[path]

  if (typeof urlParam === 'string') {
    if (!urlParam.length) return Promise.reject(new Error(`Property '${path}' must be a non-empty string`))
    url += urlParam
  }

  const body = { ...collection.props, ...props }

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
  if (!req.options.method) return Promise.reject(new Error(`Collection '${name}' has no method`))

  const { collection, name, hash } = req
  const existing = fetchStore.reqHas(hash)

  // Intercept a matching unresolved request and use its Promise
  if (existing) return existing

  const promise = 'mock' in collection
    ? Promise.resolve({ data: collection.mock, MOCK: true })
    : initiateRequest(req)

  fetchStore.reqAdd(hash, promise)

  return promise
    .then((res) => processResponse(collection, hash, res))
    .catch(utils.produceError)
}

const fetchCollections = (collections = [], props = {}) => (
  collections.map((item) => {
    const collection = item.name || item
    return GetData(collection, {
      ...item.props,
      ...props[collection]
    })
  })
)

const requestMultiple = (collections = [], props = {}) => (
  Promise
    .all(fetchCollections(collections, props))
    .then((data) => utils.transformCollectionProps(collections, data))
)

const VIRTUAL_METHODS = ['get', 'put', 'post', 'patch', 'delete']
const proxy = new Proxy({ Setup, GetData, META }, {
  get(target, prop) {
    if (VIRTUAL_METHODS.includes(prop)) {
      return (name, params = {}) => GetData(name, params, prop)
    } else if (prop in target) {
      return target[prop]
    }
  }
})

export default proxy
