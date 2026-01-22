/// <reference types="@remix-run/node" />
/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string
  readonly VITE_CONSOLE_LOGGER: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
