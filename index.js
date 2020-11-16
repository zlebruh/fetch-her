const Fetcher = require('./src/Fetcher');
const DEFAULT_OPTIONS = require('./src/defaultFetchOptions');

class FetchService {
  constructor(collections, fetchOptions = DEFAULT_OPTIONS, bearer) {
    const fetcher = new Fetcher(collections, fetchOptions, bearer);

    Object.defineProperties(this, {
      __fetcher: {
        configurable: false,
        enumerable: false,
        writable: false,
        value: fetcher,
      },
    });    
  }
  GetData(name, props = {}) {
    return this.__fetcher.GetData(name, props);
  }
  changeFetchOptions(newFetchOptions) {
    return this.__fetcher.SetOptions(newFetchOptions);
  }
  changeJwtBearer(newBearerBoolean) {
    return this.__fetcher.SetJwtBearer(newBearerBoolean);
  }
}

module.exports = FetchService;
