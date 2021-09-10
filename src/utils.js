export function cloneData(data) {
  try {
    return JSON.parse(JSON.stringify(data));
  } catch (e) {
    console.error(e);
    return data;
  }
}

export function produceError(err) {
  const message = err.message || err.error || err.errors || JSON.stringify(err);

  return { message, error: 1, data: null };
}

export async function fetchData(path, ops = {}) {
  try {
    const res = await fetch(path, ops);

    if (res.status >= 400) return produceError({message: res.statusText});

    const result = await res.json();
    return { data: result.data || result }
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

export function isString(str, checkEmpty = false) {
  const isString = typeof str === 'string';
  return !checkEmpty ? isString : isString && !!str.length;
}

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

export function splitProps(obj) {
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
}

export function extractResponse(response, extract = '') {
  const DATA = response.data;
  const isExtractString = typeof extract === 'string'

  const validType = (Array.isArray(extract) || isExtractString) && extract.length;
  if (response.error || !validType) return response;

  const toExtract = isExtractString ? [extract] : extract;

  const extracted = toExtract.filter(v => v).reduce((prev, prop) => ({
    ...prev,
    [prop]: DATA[prop]
  }), null) || DATA

  const data = toExtract.length === 1
    ? extracted[toExtract[0]]
    : extracted

  return { ...response, data };
}

export function emitResponse(detail, emit) {

  const type = typeof emit;
  if (type === 'string' && window) window.dispatchEvent(new CustomEvent(emit, { detail }));
  if (type === 'function') emit(detail);

  return detail
}
