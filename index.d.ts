declare module 'fetch-her' {
  export const META: { options: Object; collections: Object; };
  export function fetch(name: string, props?: object): Promise<object>;
  export function Setup(props?: {
    collections?: Object,
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
