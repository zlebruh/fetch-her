const Fetcher = require('./src/Fetcher');

const DEFAULT_OPTIONS = {
  mode: 'cors', // no-cors, cors, *same-origin
  // cache: 'no-cache', // *default, no-cache, reload, force-cache, only-if-cached
  // credentials: 'same-origin', // include, *same-origin, omit
  headers: {
    'content-type': 'application/json',
    accept: 'application/json',
    SameSite: 'None',
    Secure: 'true',
  },
  redirect: 'follow', // manual, *follow, error
  referrer: 'no-referrer', // no-referrer, *client
};

class FetchService {
  constructor(collections, fetchOptions = DEFAULT_OPTIONS) {
    const fetcher = new Fetcher(collections, fetchOptions);

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
}

module.exports = FetchService;
