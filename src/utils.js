if (global && global.process) {
  const { fetch } = require('whatwg-fetch');
  global.fetch = fetch;
}

const GLOBAL = window || global;

function cloneData(data) {
  try {
    return JSON.parse(JSON.stringify(data));
  } catch (e) {
    console.error(e);
    return data;
  }
}
function produceError(err) {
  const message = err.message || err.error || err.errors;

  return {
    message,
    error: 1,
    data: null,
  };
} 

async function fetchData(path, ops = {}) {
  try {
    const res = await GLOBAL.fetch(path, ops);
    const data = await res.json();

    return res.status === 200
      ? data
      : produceError(data);
  } catch (err) {
    return produceError(err);
  }
}
// TODO::: FIX THIS SHIT. MUST BE CONFIGURABLE
function buildHeaders(a, b) {
  const token = localStorage.Bearer || '';
  const auth = { Authorization: `Bearer ${token}` };
  return { ...a.headers, ...b.headers, ...auth };
}

function transformCollectionProps(collections = [], data) {
  return collections.reduce((result, collection, idx) => {
    const name = collection.name || collection;
    result[name] = data[idx]; // eslint-disable-line
    return result;
  }, {});
}

/**
 * Checking for the existing of things. NOTE: null is considered non-existing by this method
 * @param val
 * @returns {boolean}
 */
function is(val) {
  return val !== undefined && val !== null;
}

/**
 * @param {String} str
 * @param {Boolean} [checkEmpty] - optional
 * @returns {boolean}
 */
function isString(str, checkEmpty = false) {
  const isString = typeof str === 'string';
  return !checkEmpty ? isString : isString && !!str.length;
}

/**
* @param {*} val
* @param {Boolean} [checkEmpty] - optional check whether the object has any values
* @returns {Boolean}
*/
function isObject(val, checkEmpty) {
  try {
    const isOb = typeof val === 'object' && !Array.isArray(val) && val !== null;
    return checkEmpty === true
      ? isOb && !!Object.keys(val).length
      : isOb;
  } catch (err) {
    return false;
  }
}
/**
 * Transforms an object's values to params for an URI-like string
 * @param {object} options
 * @returns {string}
 */
function transformOptions(options = {}) {
  const keys = Object.keys(options);
  const { length } = keys;
  const result = length ? '?' : '';
  return keys.reduce((sum, key, idx) => {
    const item = String(options[key]);
    const amp = idx >= length - 1 ? '' : '&';
    return `${sum}${key}=${item + amp}`;
  }, result);
}

module.exports = {
  is,
  isString,
  isObject,
  cloneData,
  produceError,
  fetchData,
  buildHeaders,
  transformCollectionProps,
  transformOptions,
};
