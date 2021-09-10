declare module 'utils' {
  export function cloneData(data: Object): Object

  export function produceError(err: Error|Object): Object

  export async function fetchData(path: String, ops: Object = {}): Object

  export function transformCollectionProps(collections: String[] = [], data: Object): Object

  export function isString(str: String, checkEmpty?: Boolean = false): Boolean

  export function isObject(val: any, checkEmpty?: Boolean): Boolean

  export function propsToCGI(options: Object = {}): String
  
 export function splitProps(obj: Object): Object

 export function extractResponse(response: any, extract?: String|String[] = ''): Object

 export function emitResponse (detail: Object, emit?: String|Function): Object
}
