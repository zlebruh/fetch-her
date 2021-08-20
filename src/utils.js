export function cloneData(data) {
  try {
    return JSON.parse(JSON.stringify(data));
  } catch (e) {
    console.error(e);
    return data;
  }
}

export function produceError(err) {
  const message = err.message || err.error || err.errors;

  return { message, error: 1, data: null };
}

export async function fetchData(path, ops = {}) {
  try {
    const res = await fetch(path, ops);
    const data = await res.json();

    return res.status === 200
      ? data
      : produceError(data);
  } catch (err) {
    return produceError(err);
  }
}

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
  const SPECIAL = ['@path', '@refresh', '@headers']
  const props = cloneData(obj)
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