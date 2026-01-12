
// Manually declare vite client types since the package might be missing or types are not picked up.
// This replaces /// <reference types="vite/client" />

declare module '*?raw' {
  const content: string;
  export default content;
}

declare module '*.svg' {
  const content: string;
  export default content;
}
