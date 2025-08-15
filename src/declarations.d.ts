declare module '*.png' {
  const value: string;
  export default value;
}

// This makes TypeScript aware of the 'api' object we are exposing
// from the preload script to the renderer process.
export interface ICustomAPI {
  selectFolder: () => Promise<string | null>,
  scanCollection: (collectionPath: string) => Promise<any>
}

declare global {
  interface Window {
    api: ICustomAPI
  }
}
