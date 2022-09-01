"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.fetchData = exports.emitResponse = exports.extractResponse = exports.pick = exports.omit = exports.splitProps = exports.propsToCGI = exports.produceError = exports.isObject = exports.isString = void 0;
function isString(str, checkEmpty) {
    const isString = typeof str === 'string';
    return checkEmpty !== true ? isString : isString && !!str.length;
}
exports.isString = isString;
function isObject(val, checkEmpty) {
    try {
        const isOb = typeof val === 'object' && !Array.isArray(val) && val !== null;
        return checkEmpty === true
            ? isOb && !!Object.keys(val).length
            : isOb;
    }
    catch (err) {
        return false;
    }
}
exports.isObject = isObject;
function produceError(err, result) {
    const { problems = [], $req = null } = err || {};
    const { data = null } = result || {};
    const message = err.message || err.error || err.errors;
    if (message)
        problems.push(message);
    return Object.assign(Object.assign({}, result), { error: 1, data, problems, $req });
}
exports.produceError = produceError;
function propsToCGI(options = {}) {
    const keys = Object.keys(options);
    const max = keys.length - 1;
    const initial = keys.length ? '?' : '';
    return keys.reduce((sum, key, idx) => {
        const item = String(options[key]);
        const amp = idx >= max ? '' : '&';
        return `${sum + key}=${item + amp}`;
    }, initial);
}
exports.propsToCGI = propsToCGI;
function splitProps(obj) {
    const SPECIAL = ['$done', '$body', '$path', '$refresh', '$reject', '$options', '$headers', '$extract'];
    const params = Object.assign({}, obj);
    const special = {};
    for (let i = 0; i < SPECIAL.length; i += 1) {
        const key = SPECIAL[i];
        if (key in params) {
            special[key] = params[key];
            delete params[key];
        }
    }
    return { params, special };
}
exports.splitProps = splitProps;
function omit(target, keys = []) {
    const result = Object.assign({}, target);
    for (const key of keys)
        delete result[key];
    return result;
}
exports.omit = omit;
function pick(target, keys = []) {
    return isObject(target)
        ? keys.filter(v => v).reduce((v, k) => (Object.assign(Object.assign({}, v), { [k]: target[k] })), null) || target
        : target;
}
exports.pick = pick;
function extractResponse(reqResponse, extract) {
    return Object.assign(Object.assign({}, reqResponse), { data: pick(reqResponse.data, extract) });
}
exports.extractResponse = extractResponse;
function emitResponse(detail, req) {
    const done = (req === null || req === void 0 ? void 0 : req.special.$done) || (req === null || req === void 0 ? void 0 : req.collection.done);
    const type = typeof done;
    if (type === 'string' && globalThis)
        globalThis.dispatchEvent(new CustomEvent(done, { detail }));
    if (type === 'function')
        done(detail);
    return detail;
}
exports.emitResponse = emitResponse;
// ####################### FETCH #######################
const regex = { json: /application\/json/, file: /image|file/ };
const contentType = 'content-type';
function fetchData(uri, options = {}) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const res = yield fetch(uri, options);
            const headers = [...res.headers.entries()].reduce((r, pair) => {
                const [key, val] = pair.map(v => v.toLowerCase());
                return Object.assign(r, { [key]: val });
            }, {});
            const contentHeader = headers[contentType];
            const data = yield (regex.json.test(contentHeader)
                ? res.json()
                : regex.file.test(contentHeader) ? res.blob() : res.text());
            const { status } = res;
            const result = { status, data };
            return status >= 400
                ? produceError({ message: res.statusText }, result)
                : (data === null || data === void 0 ? void 0 : data.data) === void 0 ? result : Object.assign({ status }, data);
        }
        catch (err) {
            return produceError(err);
        }
    });
}
exports.fetchData = fetchData;
