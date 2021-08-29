/**
 * @param {Object} data
 * @returns {Object}
 */
export function cloneData(data) {
  try {
    return JSON.parse(JSON.stringify(data));
  } catch (e) {
    console.error(e);
    return data;
  }
}

/**
 * @param {Error|Object} path
 * @returns {Object}
 */
export function produceError(err) {
  const message = err.message || err.error || err.errors || JSON.stringify(err);

  return { message, error: 1, data: null };
}

/**
 * @param {String} path
 * @param {Object} ops
 * @returns {Object}
 */
export async function fetchData(path, ops = {}) {
  try {
    const res = await fetch(path, ops);
    const parsed = await res.json();
    const data = parsed.data || parsed

    return res.status < 400
      ? { data }
      : produceError(data);
  } catch (err) {
    return produceError(err);
  }
}

/**
 * @param {Array} collections
 * @param {Object} data
 * @returns {Object}
 */
export function transformCollectionProps(collections = [], data) {
  return collections.reduce((result, collection, idx) => {
    const name = collection.name || collection;
    return { ...result, [name]: data[idx]}
  }, {});
}

/**
 * @param {String} str
 * @param {Boolean} [checkEmpty] - optional
 * @returns {boolean}
 */
export function isString(str, checkEmpty = false) {
  const isString = typeof str === 'string';
  return !checkEmpty ? isString : isString && !!str.length;
}

/**
* @param {*} val
* @param {Boolean} [checkEmpty] - optional check whether the object has any values
* @returns {Boolean}
*/
export function isObject(val, checkEmpty) {
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
 * @param {object} options
 * @returns {string}
 */
export function propsToCGI(options = {}) {
  const keys = Object.keys(options);
  const max = keys.length - 1
  const initial = keys.length ? '?' : '';

  return keys.reduce((sum, key, idx) => {
    const item = String(options[key]);
    const amp = idx >= max ? '' : '&';
    return `${sum}${key}=${item + amp}`;
  }, initial);
}

/**
 * @param {object} obj
 * @returns {object}
 */
export const splitProps = (obj) => {
  const SPECIAL = ['@emit', '@path', '@refresh', '@options', '@headers', '@extract']
  const props = {...obj}
  const special = {}

  for (let i = 0; i < SPECIAL.length; i += 1) {
    const key = SPECIAL[i]
    if (key in props) {
      special[key] = props[key]
      delete props[key]
    }
  }
return { props, special }
};