const CACHE = {};
const REQUESTS = {};

// Shorthands
const add = (store, hash, payload) => {
  const noExisting = !store[hash];

  if (noExisting) {
    store[hash] = payload;
  }

  return noExisting;
};

const remove = (store, hash) => (
  store[hash]
    ? delete store[hash]
    : false
);

// Requests
export const reqHas = (hash) => REQUESTS[hash] || null;
export const reqAdd = (hash, promise) => add(REQUESTS, hash, promise);
export const reqRemove = (hash) => remove(REQUESTS, hash);

// Cache
export const cacheHas = (hash) => CACHE[hash] || null;
export const cacheAdd = (hash, data) => add(CACHE, hash, data);
export const cacheRemove = (hash) => remove(CACHE, hash);

// Other
export const hash = (name, body) => `${name}+++${body}`;
