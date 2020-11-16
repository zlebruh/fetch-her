const utils = require('./utils');
const FetchStore = require('../src/FetchStore');
const { OPTIONS, COLLECTIONS } = require('./constants');

const fetchStore = new FetchStore();

class Fetcher {
  constructor(collections, fetchOptions, bearer) {
    this.bearer = typeof bearer === 'string' ? bearer : null;
    this[OPTIONS] = fetchOptions;
    this[COLLECTIONS] = collections;

    Object.defineProperties(this, {
      auth: {
        get() {
          const { bearer } = this;
          return bearer ? { Authorization: `Bearer ${bearer}` } : {}
        },
      },
    });
  }

  getHeaders(collection, ops) {
    const headers = {
      ...collection.headers,
      ...ops.headers,
      ...this.auth,
    };

    return headers;
  }

  setCache(name, hash, data) {
    if (!data || data.error) return data;

    const collection = this[COLLECTIONS][name];
    switch (collection.cache) {
      case 'ram': fetchStore.cacheAdd(hash, data); break;
      case 'local': break;
      default: break;
    }
    return data;
  }

  // ############### REQUEST ##############
  requestData(properties) {
    // There are collections that combine multiple collections
    const {
      name,
      hash,
      props,
      collection,
    } = properties;

    if (collection.collections) {
      return this.requestMultiple(collection.collections, props);
    }

    let bodyObj = { ...collection.props, ...props };
    let body = JSON.stringify(bodyObj);

    const match = fetchStore.reqHas(hash);

    if (match) return match;

    const method = collection.method; // eslint-disable-line
    if (!method) {
      return Promise.reject(new Error(`Collection "${name}" has no method`));
    }

    let ops = {};

    let url = String(collection.url);
    const options = {
      method,
      ...this[OPTIONS],
    };

    const KEY = '@path';
    const urlParam = props[KEY];
    if (utils.is(urlParam)) {
      if (utils.isString(urlParam, true)) {
        url += urlParam;
        delete props[KEY];
      } else {
        return Promise.reject(new Error(`Property "${KEY}" must be a non-empty string`));
      }
    }
    bodyObj = { ...props };
    body = JSON.stringify(bodyObj);

    switch (method) {
      case 'GET':
        url += utils.transformOptions(bodyObj);
        ops = { ...options };
        break;
      case 'PUT':
      case 'POST':
      case 'PATCH':
      case 'DELETE':
        if (collection.isFile) {
          ops = {
            ...options,
            headers: { enctype: 'multipart/form-data' },
            body: props.formData,
          };
        } else {
          body = JSON.stringify(bodyObj);
          ops = { ...options, body };
        }
        break;
      default: break;
    }

    ops.headers = this.getHeaders(collection, ops);

    
    const promise = utils.fetchData(url, ops)
      .then((res) => Fetcher.processResponse(hash, res))
      .then((data) => this.setCache(name, hash, data))
      .then((data) => utils.cloneData(data));

    fetchStore.reqAdd(hash, promise);

    return promise;
  }

  getDataGrunt(name, hash, props = {}) {
    const collection = this[COLLECTIONS][name];
    if (utils.isObject(collection, true)) {
      const KEY = '@refresh';
      fetchStore.hash(name, JSON.stringify(props));
      const useCache = !!(collection.cache && fetchStore.cacheHas(hash));
      const reqOptions = { ...props };
      const useRefresh = !!(reqOptions && reqOptions[KEY] === true);
      delete reqOptions[KEY];

      return useCache && !useRefresh
        ? Promise.resolve(utils.cloneData(fetchStore.cacheHas(hash)))
        : this.requestData({
          name,
          hash,
          collection,
          props: reqOptions,
        });
    }

    return Promise.reject(new Error(`Collection "${name}" was not recognized`));
  }

  SetOptions(newFetchOptions = null) {
    if (!newFetchOptions) return false;

    this[OPTIONS] = newFetchOptions;
    return true;
  }

  SetJwtBearer(bearer) {
    if (bearer && typeof bearer !== 'string' && bearer === this.bearer) return false;

    this.bearer = bearer;
    return true;
  }

  async GetData(name, props = {}) {
    const hash = fetchStore.hash(name, JSON.stringify(props));
    const request = await this.getDataGrunt(name, hash, props)
      .catch((err) => {
        fetchStore.reqRemove(hash);
        return utils.produceError(err);
      });
    return request;
  }

  fetchCollections(collections = [], props = {}) {
    return collections.map((item) => {
      const collection = item.name || item;
      return this.GetData(collection, {
        ...item.props,
        ...props[collection],
      });
    });
  }

  requestMultiple(collections = [], props = {}) {
    return Promise
      .all(this.fetchCollections(collections, props))
      .then((data) => utils.transformCollectionProps(collections, data));
  }

  static processResponse(hash, response) {
    fetchStore.reqRemove(hash);
    return response;
  }
}

module.exports = Fetcher;
