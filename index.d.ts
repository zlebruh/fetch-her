declare module 'fetch-her' {
  export default class FetchService {
    constructor(collections: object, fetchOptions?: {
      mode?: 'no-cors' | 'cors' | 'same-origin';
      headers?: {
        'content-type'?: string;
        accept?: string;
        SameSite?: string;
        Secure?: string;
      };
      redirect?: 'follow' | 'error';
      referrer?: 'no-referrer' | 'client';
    });
    GetData(name: string, props?: object): Promise<object>;
  }
}
