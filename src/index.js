import * as utils from './utils';
import * as fetchStore from '../src/store';
import DEFAULT_OPTIONS from '../src/defaultFetchOptions';

const metaDefaults = { value: null, writable: true, enumerable: true };
export const META = Object.defineProperties({}, {
  BEARER: { ...metaDefaults },
  OPTIONS: { ...metaDefaults },
  COLLECTIONS: { ...metaDefaults },
  auth: { get: () => (META.BEARER ? { Authorization: `Bearer ${META.BEARER}` } : {}) },
});

export const Setup = (props = {}) => {
  const carrier = {};
  const { collections, options, bearer } = props;

  if (utils.isObject(collections, true)) {
    carrier.COLLECTIONS = collections;
  }

  if (utils.isString(bearer, true) || bearer === null) {
    carrier.BEARER = bearer;
  }

  if (utils.isObject(options, true) || !META.OPTIONS) {
    carrier.OPTIONS = options || DEFAULT_OPTIONS
  }

  return Object.assign(META, carrier)
};

export const GetData = (name, props = {}) => {
  if (!utils.isObject(META.COLLECTIONS, true)) {
    return utils.produceError({message: `There is no 'collections' object. Use 'Setup()' to change your props at any time`});
  }

  const hash = fetchStore.hash(name, JSON.stringify(props));
  return getDataGrunt(name, hash, props).catch(utils.produceError);
};


// ############################### LOCAL ###############################
const processResponse = (name, hash, response) => {
  fetchStore.reqRemove(hash);
  
  if (!response || response.error) return response;

  const collection = META.COLLECTIONS[name];
  switch (collection.cache) {
    case 'ram': fetchStore.cacheAdd(hash, response); break;
    case 'local': break;
    default: break;
  }
  return response;
}

// ############### REQUEST ##############
const requestData = (properties) => {
  const {
    name,
    hash,
    props,
    collection,
  } = properties;

  // There are collections that combine multiple collections
  if (collection.collections) return requestMultiple(collection.collections, props);

  // Intercept a matching unresolved request and use its Promise
  const existing = fetchStore.reqHas(hash);
  if (existing) return existing;

  const method = collection.method; // eslint-disable-line
  if (!method) {
    return Promise.reject(new Error(`Collection '${name}' has no method`));
  }

  let url = String(collection.url);
  const options = {
    method,
    ...META.OPTIONS,
    headers: {
      ...META.OPTIONS.headers,
      ...collection.headers,
      ...META.auth,
    },
  };

  const KEY = '@path';
  const urlParam = props[KEY];
  if (utils.is(urlParam)) {
    if (utils.isString(urlParam, true)) {
      url += urlParam;
      delete props[KEY];
    } else {
      return Promise.reject(new Error(`Property '${KEY}' must be a non-empty string`));
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

  const promise = utils.fetchData(url, options)
    .then((res) => processResponse(name, hash, res))
    .then((data) => utils.cloneData(data));

  fetchStore.reqAdd(hash, promise);

  return promise;
};

const getDataGrunt = (name, hash, props = {}) => {
  const collection = META.COLLECTIONS[name];
  if (utils.isObject(collection, true)) {
    const KEY = '@refresh';
    fetchStore.hash(name, JSON.stringify(props));
    const useCache = !!(collection.cache && fetchStore.cacheHas(hash));
    const reqOptions = { ...props };
    const useRefresh = !!(reqOptions && reqOptions[KEY] === true);
    delete reqOptions[KEY];

    return useCache && !useRefresh
      ? Promise.resolve(utils.cloneData(fetchStore.cacheHas(hash)))
      : requestData({
        name,
        hash,
        collection,
        props: reqOptions,
      });
  }

  return Promise.reject(new Error(`Collection '${name}' was not recognized`));
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
