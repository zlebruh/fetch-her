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
    const { props, special } = utils.splitProps(params);

    // There are collections that combine multiple collections
    if (collection.collections) return requestMultiple(collection.collections, props);

    const hash = `${name}+++${JSON.stringify(props)}`
    const CACHE = fetchStore.cacheHas(hash)
    const useCache = !!(CACHE && special['@refresh'] !== true)

    const result = useCache
      ? Promise.resolve(CACHE)
      : requestData({ name, hash, props, special, method });

    return result
      .then(v => utils.cloneData({ ...v, collection: name }))
      .then(v => utils.extractResponse(v, (special['@extract'] || collection.extract)))
      .then(v => utils.emitResponse(v, (special['@emit'] || collection.emit)))
  }

  return utils.produceError({ message: `Collection '${name}' was not recognized` });
};


// ############################### LOCAL ###############################
const processResponse = (name, hash, response) => {
  fetchStore.reqRemove(hash);

  if (!response || response.error) return response;

  switch (META.collections[name].cache) {
    case 'ram': fetchStore.cacheAdd(hash, response); break;
    case 'local': break;
    default: break;
  }

  return response;
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
