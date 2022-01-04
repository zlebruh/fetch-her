export type Obj = { [key: string]: any }
export type FetchMethod = 'get' | 'put' | 'post' | 'patch' | 'delete'

export type PrefetchProps = {
  req?: ReqProps;
  url?: string;
  problems?: string[];
}
export type FetchProps = {
  name: string;
  props: Obj;
  method?: FetchMethod;
}

export type ReqProps = {
  collection: CollectionOptions;
  options: RequestInit;
  body: any;
  props: Obj;
  special: Obj;
  name: string;
  hash: string;
  multi: boolean;
}

export type FetchResponse = {
  error: 0 | 1;
  data: any | null;
  $req?: ReqProps;
  status?: number;
  problems?: string[];
  collection?: string;
}
export type FetchError = FetchResponse & { error: 1; }

export type CollectionOptions = {
  url: string;
  method?: FetchMethod;
  props?: Obj;
  mock?: Obj | Function;
  extract?: string | string[];
  cache?: 'ram' | 'local';
  options?: RequestInit;
  headers?: Headers;
  done?: Function | String;
  collections?: string[];
  isFile?: boolean;
}

export type CollectionsOptions = {
  [key: string]: CollectionOptions
}

export type SetupOptions = {
  collections?: CollectionsOptions,
  options?: RequestInit
}
