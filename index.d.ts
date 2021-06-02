declare module 'fetch-her' {
  export const META: { BEARER: String | null; OPTIONS: Object; COLLECTIONS: Object; };
  export function GetData(name: string, props?: object): Promise<object>;
  // export function Setup(props?: { collections?: Object, options?: Object, bearer?: String | null }): any;
  export function Setup(props?: {
    collections?: Object,
    bearer?: String | null,
    options?: {
      mode?: 'no-cors' | 'cors' | 'same-origin';
      headers?: {
        'content-type'?: string;
        accept?: string;
        SameSite?: string;
        Secure?: string;
      };
      redirect?: 'follow' | 'error';
      referrer?: 'no-referrer' | 'client';
    },
  }): Object;
}
