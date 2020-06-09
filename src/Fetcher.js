const utils = require('./utils');

class Fetcher {
  constructor(collections, fetchOptions) {
    this.CACHE = {};
    this.REQUESTS = {};
    this.OPTIONS = fetchOptions;
    this.COLLECTIONS = collections;
  }

  clearRequest(name) {
    return delete this.REQUESTS[name];
  }
  processResponse(name, response) {
    this.clearRequest(name);
    return response;
  }
  setCache(name, data) {
    if (!data || data.error) return data;
  
    const collection = this.COLLECTIONS[name];
    switch (collection.cache) {
      case 'ram': this.CACHE[name] = data; break;
      case 'local': break;
      default: break;
    }
    return data;
  }
  serveCache(name) {
    return Promise.resolve(utils.cloneData(this.CACHE[name]));
  }

  // ############### REQUEST ##############
  requestData(properties) {
    // There are collections that combine multiple collections
    const { name, props, collection } = properties;
  
    if (collection.collections) {
      return this.requestMultiple(collection.collections, props);
    }
  
    let bodyObj = { ...collection.props, ...props };
    let body = JSON.stringify(bodyObj);
    const match = this.REQUESTS[name];
    if (!match || match.body !== body) {
      const method = collection.method; // eslint-disable-line
      if (!method) {
        return Promise.reject(new Error(`Collection "${name}" has no method`));
      }
  
      let ops = {};
  
      let url = String(collection.url);
      const options = {
        method,
        ...this.OPTIONS,
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
  
      ops.headers = utils.buildHeaders(collection, ops);
      const promise = utils.fetchData(url, ops)
        .then((res) => this.processResponse(name, res))
        .then(data => this.setCache(name, data))
        .then(data => utils.cloneData(data))
  
      this.REQUESTS[name] = { promise, body };
      return promise;
    }
  
    return this.REQUESTS[name].promise;
  }
  getDataGrunt(name, props = {}) {
    const collection = this.COLLECTIONS[name];
    if (utils.isObject(collection, true)) {
      const KEY = '@refresh';
      const useCache = !!(collection.cache && this.CACHE[name]);
      const reqOptions = { ...props };
      const useRefresh = !!(reqOptions && reqOptions[KEY] === true);
      delete reqOptions[KEY];
  
      return useCache && !useRefresh
        ? this.serveCache(name)
        : this.requestData({ name, props: reqOptions, collection });
    }
  
    return Promise.reject(new Error(`Collection "${name}" was not recognized`));
  }

  async GetData(name, props = {}) {
    const request = await this.getDataGrunt(name, props).catch(utils.produceError);
    this.clearRequest(name);
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
      .then(data => utils.transformCollectionProps(collections, data));
  }
}

module.exports = Fetcher;
