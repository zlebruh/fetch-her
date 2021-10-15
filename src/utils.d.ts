declare module 'utils' {
  function cloneData(data: Object): Object
  function produceError(err: Error | Object): Object
  function fetchData(path: String, ops: Object): Object
  function transformCollectionProps(collections: String[], data: Object): Object
  function isString(str: String, checkEmpty?: Boolean): Boolean
  function isObject(val: any, checkEmpty?: Boolean): Boolean
  function propsToCGI(options: Object): String
  function splitProps(obj: Object): Object
  function extractResponse(response: any, extract?: String | String[]): Object
  function emitResponse(detail: Object, emit?: String | Function): Object
}
