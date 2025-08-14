
interface ImportMetaEnv {
    readonly BASE_URL: string;
    readonly VITE_GRAPHQL_URL: string;
    readonly VITE_CDN_URL: string;
    readonly VITE_CDN_EQUIPMENT_DIR: string;
    readonly VITE_CDN_TOOL_DIR: string;
    readonly VITE_LOGIN_URL: string;
    readonly VITE_GRAFANA_READER_STATS_URL: string;
    readonly VITE_DISABLE_STOREFRONT_CART: string;
    readonly VITE_ORIGIN: string;
}

interface ImportMeta {
    readonly env: ImportMetaEnv;
}

declare module "*.png" {
    const value: any;
    export = value;
}