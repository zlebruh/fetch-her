declare module 'fetch-her' {
  export const META: { options: Object; collections: Object; };
  export function fetch(name: string, props?: object): Promise<object>;
  export function Setup(props?: { collections?: Object, options?: RequestInit }): Object;
}
