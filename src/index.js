import * as utils from './utils';
import * as fetchStore from '../src/store';

const metaDefaults = { value: {}, writable: true, enumerable: true };
const META = Object.defineProperties({}, {
  bearer: { ...metaDefaults, value: null },
  options: { ...metaDefaults },
  collections: { ...metaDefaults },
  auth: { get: () => (META.bearer ? { Authorization: `Bearer ${META.bearer}` } : {}) },
});

const Setup = (props = {}) => {
  const { collections, options, bearer } = props;

  if (utils.isObject(collections, true)) {
    META.collections = collections;
  }

  if (utils.isObject(options, true)) {
    META.options = options;
  }

  if (utils.isString(bearer, true) || bearer === null) {
    META.bearer = bearer;
  }

  return META;
};

const GetData = (name, params = {}, method) => {
  const collection = META.collections[name];
  if (collection && typeof collection === 'object' && !Array.isArray(collection)) {
    const hash = `${name}+++${JSON.stringify(params)}`
    const { props, special } = utils.splitProps(params)
    const CACHE = fetchStore.cacheHas(hash)
    const useCache = !!(CACHE && special['@refresh'] !== true)

    return useCache
      ? Promise.resolve(CACHE)
      : requestData({ name, hash, props, special, method });
  }

  return utils.produceError({ message: `Collection '${name}' was not recognized` });
};


// ############################### LOCAL ###############################
const extractResponse = (response, manualExtract = '') => {
  const extract = manualExtract || META.collections[response.collection].extract;
  const DATA = response.data;
  const isExtractString = typeof extract === 'string'
  
  const validType = (Array.isArray(extract) || isExtractString) && extract.length;
  if (response.error || !validType) return response;

  const toExtract = isExtractString ? [extract] : extract;

  const extracted = toExtract.filter(v => v).reduce((prev, prop) => ({
    ...prev,
    [prop]: DATA[prop]
  }), null) || DATA

  const data = toExtract.length === 1
    ? extracted[toExtract[0]]
    : extracted

  return { ...response, data };
}

const processResponse = (name, hash, response, special) => {
  fetchStore.reqRemove(hash);

  const RESPONSE = { ...response, collection: name };

  if (!response || response.error) return RESPONSE;

  const collection = META.collections[name];
  const emit = collection.emit || special['@emit']
  const detail = extractResponse(utils.cloneData(RESPONSE), special['@extract'])

  switch (collection.cache) {
    case 'ram': fetchStore.cacheAdd(hash, detail); break;
    case 'local': break;
    default: break;
  }

  switch (typeof emit) {
    case 'string': window && window.dispatchEvent(new CustomEvent(emit, { detail })); break;
    case 'function': emit(detail); break;
    default: break;
  }

  return detail;
}

const initiateRequest = ({ collection, special, props, method }) => {
  let url = String(collection.url);
  const options = {
    method,
    ...META.options,
    ...collection.options,
    ...special['@options'],
    headers: {
      ...META.auth,
      ...META.options.headers,
      ...collection.headers,
      ...special["@headers"]
    },
  };

  const path = '@path';
  const urlParam = special[path];
  if (typeof urlParam === 'string') {
    if (urlParam.length) {
      url += urlParam;
    } else {
      return Promise.reject(new Error(`Property '${path}' must be a non-empty string`));
    }
  }

  const body = { ...collection.props, ...props };

  switch (method) {
    case 'GET': url += utils.propsToCGI(body); break;
    case 'PUT':
    case 'POST':
    case 'PATCH':
    case 'DELETE':
      if (collection.isFile) {
        options.headers.enctype = 'multipart/form-data';
        options.body = props.formData;
      } else {
        options.body = JSON.stringify(body);
      }
      break;
    default: break;
  }

  return utils.fetchData(url, options);
}

const requestData = (properties) => {
  const { name, hash, props, special } = properties;
  const collection = META.collections[name];
  const method = (properties.method || collection.method || '').toUpperCase();

  // There are collections that combine multiple collections
  if (collection.collections) return requestMultiple(collection.collections, props);

  // Intercept a matching unresolved request and use its Promise
  const existing = fetchStore.reqHas(hash);
  if (existing) return existing;

  if (!method) return Promise.reject(new Error(`Collection '${name}' has no method`));

  const promise = 'mock' in collection
    ? Promise.resolve({ data: collection.mock, MOCK: true })
    : initiateRequest({ collection, special, props, method });

  fetchStore.reqAdd(hash, promise);

  return promise
    .then((res) => processResponse(name, hash, res, special))
    .catch(utils.produceError);
};

const fetchCollections = (collections = [], props = {}) => (
  collections.map((item) => {
    const collection = item.name || item;
    return GetData(collection, {
      ...item.props,
      ...props[collection],
    });
  })
);

const requestMultiple = (collections = [], props = {}) => (
  Promise
    .all(fetchCollections(collections, props))
    .then((data) => utils.transformCollectionProps(collections, data))
);

const VIRTUAL_METHODS = ['get', 'put', 'post', 'patch', 'delete'];
const proxy = new Proxy({ Setup, GetData, META }, {
  get(target, prop) {
    if (VIRTUAL_METHODS.includes(prop)) {
      return (name, params = {}) => GetData(name, params, prop)
    } else if (prop in target) {
      return target[prop]
    }
  }
})

export default proxy;
