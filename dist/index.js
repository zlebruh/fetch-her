"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
const fetchStore = __importStar(require("./store"));
const utils_1 = require("./utils");
const META = { options: {}, collections: {} };
const VIRTUAL_METHODS = ['get', 'put', 'post', 'patch', 'delete'];
const VERIFY = {
    name: { test: (v) => v in META.collections, text: "Collection '{{value}}' was not recognized" },
    url: { text: "Collection '{{value}}' has no URL" },
    method: { text: "Collection '{{value}}' has no method" },
};
const buildURL = (req, method) => {
    const result = req.collection.url + (req.special.$path || '');
    const postfix = method.toUpperCase() === 'GET' ? (0, utils_1.propsToCGI)(req.body) : '';
    return result + postfix;
};
function buildInfo(fetchProps) {
    const { name, props } = fetchProps;
    const collection = META.collections[name];
    const method = (fetchProps.method || (collection === null || collection === void 0 ? void 0 : collection.method) || '').toUpperCase();
    const problems = verifyInfo({ name, method, url: collection === null || collection === void 0 ? void 0 : collection.url });
    const req = buildReq(name, props, method);
    const url = buildURL(req, method);
    return { req, url, problems };
}
function verifyInfo(info) {
    return Object.keys(VERIFY)
        .map((key) => {
        const { test, text } = VERIFY[key];
        return !(0, utils_1.isString)(info[key], true) || !(test ? test(info.name) : true)
            ? text.replace('{{value}}', info.name)
            : null;
    }).filter(Boolean);
}
function buildReq(name, props, method) {
    const collection = META.collections[name];
    const { params, special } = (0, utils_1.splitProps)(props);
    const hash = `${name}+++${JSON.stringify(params)}`;
    const body = special.$body || Object.assign(Object.assign({}, collection.props), params);
    const multi = Array.isArray(collection.collections) && Boolean(collection.collections.length);
    const options = Object.assign(Object.assign(Object.assign(Object.assign({}, META.options), collection.options), special.$options), { method: method || collection.method, headers: Object.assign(Object.assign(Object.assign({}, META.options.headers), collection.headers), special.$headers) });
    return { collection, body, options, props, special, name, hash, multi };
}
// TODO: Started throwing compile errors after updating TS // const initiateRequest = (req: ReqProps, url: string) => {
const initiateRequest = (req, url) => {
    const { collection, options, props, body } = req;
    if (options.method !== 'GET') {
        if (collection.isFile) {
            Object.assign(options.headers, { enctype: 'multipart/form-data' });
            options.body = props.formData;
        }
        else {
            options.body = JSON.stringify(body);
        }
    }
    return (0, utils_1.fetchData)(url, options);
};
const requestData = (req, url) => {
    if (!req || !url)
        return Promise.reject(new Error('BAD THING HAPPENED'));
    const CACHE = fetchStore.cacheHas(req.hash);
    const useCache = !!(CACHE && req.special.$refresh !== true);
    if (useCache)
        return Promise.resolve(CACHE);
    const promise = 'mock' in req.collection
        ? Promise.resolve({ data: req.collection.mock, MOCK: true })
        : initiateRequest(req, url);
    fetchStore.reqAdd(req.hash, promise);
    return promise;
};
const fetchOne = (fetchProps) => {
    try {
        const { req, url, problems } = buildInfo(fetchProps);
        const existing = fetchStore.reqHas(req === null || req === void 0 ? void 0 : req.hash);
        if (req === null || req === void 0 ? void 0 : req.multi)
            return fetchMultiple(req);
        if (existing)
            return existing; // Intercept a matching unresolved request and use its Promise
        const promise = (problems === null || problems === void 0 ? void 0 : problems.length) ? Promise.reject({ problems, $req: req }) : requestData(req, url);
        return promise
            .then((v) => (Object.assign(Object.assign({}, v), { $req: req })))
            .then((v) => processResponse(req || {}, v))
            .then((v) => (0, utils_1.extractResponse)(v, ((req === null || req === void 0 ? void 0 : req.special.$extract) || (req === null || req === void 0 ? void 0 : req.collection.extract))));
    }
    catch (err) {
        return Promise.reject(err);
    }
};
const fetchMultiple = (req) => __awaiter(void 0, void 0, void 0, function* () {
    const { collections = [] } = req.collection;
    const list = collections.map((name) => fetchAttempt(name, req.props[name]));
    const data = yield Promise.all(list);
    return collections.reduce((result, name, idx) => (Object.assign(Object.assign({}, result), { [name]: data[idx] })), {});
});
const processResponse = (req, response) => {
    var _a;
    fetchStore.reqRemove(req.hash);
    const data = JSON.parse(JSON.stringify(response));
    if (((_a = req.collection) === null || _a === void 0 ? void 0 : _a.cache) === 'ram')
        fetchStore.cacheAdd(req.hash, data);
    return data;
};
const Setup = (props) => {
    const { collections, options } = props;
    if ((0, utils_1.isObject)(options, true))
        META.options = options;
    if ((0, utils_1.isObject)(collections, true))
        META.collections = collections;
    return META;
};
const fetchAttempt = (name, props, method) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    const reject = ((props === null || props === void 0 ? void 0 : props.$reject) || ((_b = (_a = META === null || META === void 0 ? void 0 : META.collections[name]) === null || _a === void 0 ? void 0 : _a.props) === null || _b === void 0 ? void 0 : _b.$reject)) === true;
    const _c = yield fetchOne({ name, props, method }).catch(utils_1.produceError), { $req } = _c, result = __rest(_c, ["$req"]);
    const output = (0, utils_1.omit)(result, ['$req']);
    if ($req)
        (0, utils_1.emitResponse)(output, $req);
    return reject ? Promise.reject(output) : output;
});
const proxy = new Proxy(Object.freeze({ fetch: fetchAttempt, Setup, META }), {
    get(target, prop) {
        if (VIRTUAL_METHODS.includes(prop)) {
            return (name, props = {}) => fetchAttempt(name, props, prop);
        }
        else if (prop in target) {
            return target[prop];
        }
    }
});
exports.default = proxy;
