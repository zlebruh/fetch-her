"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cacheRemove = exports.cacheAdd = exports.cacheHas = exports.reqRemove = exports.reqAdd = exports.reqHas = void 0;
const CACHE = Object.create(null);
const REQUESTS = Object.create(null);
// Shorthands
const add = (store, hash, payload, type) => {
    const existing = hash in store;
    if (!existing)
        store[hash] = payload;
    return existing;
};
const remove = (store, hash) => store[hash] ? delete store[hash] : false;
// Requests
const reqHas = (hash = '') => REQUESTS[hash] || null;
exports.reqHas = reqHas;
const reqAdd = (hash, promise) => add(REQUESTS, hash, promise, 'REQUESTS');
exports.reqAdd = reqAdd;
const reqRemove = (hash) => remove(REQUESTS, hash);
exports.reqRemove = reqRemove;
// Cache
const cacheHas = (hash) => CACHE[hash] || null;
exports.cacheHas = cacheHas;
const cacheAdd = (hash, data) => add(CACHE, hash, data, 'CACHE');
exports.cacheAdd = cacheAdd;
const cacheRemove = (hash) => remove(CACHE, hash);
exports.cacheRemove = cacheRemove;
