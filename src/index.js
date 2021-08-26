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

const GetData = async (name, params = {}) => {
  const collection = META.collections[name];
  if (collection && typeof collection === 'object' && !Array.isArray(collection)) {
    const hash = `${name}+++${JSON.stringify(params)}`
    const { props, special } = utils.splitProps(params)
    const useCache = !!(fetchStore.cacheHas(hash) && special['@refresh'] !== true)

    return useCache
      ? Promise.resolve(utils.cloneData(fetchStore.cacheHas(hash)))
      : requestData({ name, hash, props, special }).catch(utils.produceError);
  }

  return utils.produceError({ message: `Collection '${name}' was not recognized` });
};


// ############################### LOCAL ###############################
const processResponse = (name, hash, response, special) => {
  fetchStore.reqRemove(hash);

  const detail = {...response, collection: name};

  if (!response || response.error) return detail;

  const collection = META.collections[name];
  const emit = collection.emit || special['@emit']

  switch (collection.cache) {
    case 'ram': fetchStore.cacheAdd(hash, detail); break;
    case 'local': break;
    default: break;
  }

  switch (typeof emit) {
    case 'string': window.dispatchEvent(new CustomEvent(emit, {detail})); break;
    case 'function': emit(detail); break;
    default: break;
  }

  return detail;
}

const initiateRequest = ({ collection, special, props }) => {
  const { method } = collection;
  let url = String(collection.url);
  const options = {
    method,
    ...META.options,
    ...collection.options,
    headers: {
      ...META.options.headers,
      ...special["@headers"],
      ...collection.headers,
      ...META.auth,
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

  // There are collections that combine multiple collections
  if (collection.collections) return requestMultiple(collection.collections, props);

  // Intercept a matching unresolved request and use its Promise
  const existing = fetchStore.reqHas(hash);
  if (existing) return existing;

  if (!collection.method) return Promise.reject(new Error(`Collection '${name}' has no method`));

  const REQUEST = 'mock' in collection
    ? Promise.resolve({ data: collection.mock, status: 'success', MOCK: true })
    : initiateRequest({ collection, special, props });

  const promise = REQUEST
    .then((res) => processResponse(name, hash, res, special))
    .then((data) => utils.cloneData(data));

  fetchStore.reqAdd(hash, promise);

  return promise;
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

export default { Setup, GetData, META };
