/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_RAYFIN_REALTIME_DASHBOARD_CLIENT_ID?: string;
  readonly VITE_RAYFIN_REALTIME_DASHBOARD_ITEM_ID?: string;
  readonly VITE_RAYFIN_REALTIME_DASHBOARD_URL?: string;
  readonly VITE_FABRIC_TENANT_ID?: string;
  readonly VITE_FABRIC_WORKSPACE_ID?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
