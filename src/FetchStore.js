const { CACHE, REQUESTS } = require('./constants');

class FetchStore {
  constructor() {
    this[CACHE] = {};
    this[REQUESTS] = {};
  }

  // Shorthands
  has(key, hash) {
    return this[key][hash] || null;
  }

  add(key, hash, payload) {
    const noExisting = !this[key][hash];
    if (noExisting) {
      this[key][hash] = payload;
    }

    return noExisting;
  }

  remove(key, hash) {
    return this[key][hash]
      ? delete this[key][hash]
      : false;
  }

  // REQUESTS
  reqHas(hash) {
    return this.has(REQUESTS, hash);
  }

  reqAdd(hash, promise) {
    return this.add(REQUESTS, hash, promise);
  }

  reqRemove(hash) {
    return this.remove(REQUESTS, hash);
  }

  // CACHE
  cacheHas(hash) {
    return this.has(CACHE, hash);
  }

  cacheAdd(hash, data) {
    return this.add(CACHE, hash, data);
  }

  cacheRemove(hash) {
    return this.remove(CACHE, hash);
  }

  // Other
  hash(...args) {
    return this.constructor.hash(...args);
  }

  static hash(name, body) {
    return `${name}+++${body}`;
  }
}

module.exports = FetchStore;
