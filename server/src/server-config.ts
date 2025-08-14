type AuthConfig = {
    // Session secret for express-sessions
    readonly SESSION_SECRET: string,
    readonly SAML: {
        readonly ID_FORMAT: string,
        readonly ISSUER: string,
        readonly CALLBACK_URL: string,
        readonly ENTRY_POINT: string,
        readonly SSL_PVKEY: string,
        readonly IDP_PUBKEY: string,
    }
}

type AppConfig = {
    readonly ORIGIN: string,
    readonly URL: string, // usually origin + base_url
    readonly LOGGED_OUT_URL: string
}

type PrinterOSConfig = {
    PAPERCUT: { SECURITY_SECRET: string; }
    FREE_3D_PRINTS: boolean;

    PRINTEROS_QUIZ_ID: number;
    API_FS_WORKGROUP: number;
    CLOUDPRINT: {
        URL: string;
        PASSWORD: string;
        WORKGROUP: number;
    }
}

type MailgunConfig = {
    API_KEY: string;
    DOMAIN: string;
    SENDING_KEY: string;
    // BCC_ADDRESS
}

type AtriumConfig = {
    URL: string;
    API_KEY: string;
}

type DatabaseConfig = {
    URL: string;
    USER: string;
    PASSWORD: string;
    DB: string;
}

type EventbriteConfig = {
    LIST_EVENTS_URL: string;
    API_KEY: string;
}

type SlackConfig = {
    API_TOKEN: string;
    CHANNEL_ID: string;
}

type InventoryConfig = {
    API_KEY: string;
    DISABLE_CARTS: string;
}

type Config = {
    readonly NODE_ENV: "development" | "staging" | "production",
    readonly CDN_URL: string;
    readonly TIMEZONE: string;
    readonly INV: InventoryConfig
    readonly VITE: AppConfig
    readonly AUTH: AuthConfig,
    readonly PRINTER_OS?: PrinterOSConfig
}

function load_auth(): AuthConfig | undefined {
    if (!process.env.SESSION_SECRET) {
        console.error("Missing Required Env Variable: SESSION_SECRET (Express Sessions)");
        return undefined;
    }

    if (!process.env.ISSUER) {
        console.error("Missing Required Env Variable: ISSUER (SAML Auth)");
        return undefined;
    }
    if (!process.env.CALLBACK_URL) {
        console.error("Missing Required Env Variable: CALLBACK_URL (SAML Auth)");
        return undefined;
    }
    if (!process.env.ENTRY_POINT) {
        console.error("Missing Required Env Variable: ENTRY_POINT (SAML Auth)");
        return undefined;
    }
    if (!process.env.SSL_PVKEY) {
        console.error("Missing Required Env Variable: SSL_PVKEY (SAML Auth)");
        return undefined;
    }
    if (!process.env.IDP_PUBKEY) {
        console.error("Missing Required Env Variable: IDP_PUBKEY (SAML Auth)");
        return undefined;
    }

    return {
        SESSION_SECRET: process.env.SESSION_SECRET,
        SAML: {
            ISSUER: process.env.ISSUER,
            CALLBACK_URL: process.env.CALLBACK_URL,
            ENTRY_POINT: process.env.ENTRY_POINT,
            IDP_PUBKEY: process.env.IDP_PUBKEY,
            SSL_PVKEY: process.env.SSL_PVKEY,

        }
    };
}

function load_app(): AppConfig | undefined {
    if (!process.env.VITE_URL) {
        console.error("Missing Required Env Variable: VITE_URL");
        return undefined;
    }
    if (!process.env.VITE_ORIGIN) {
        console.error("Missing Required Env Variable: VITE_ORIGIN");
        return undefined;
    }
    if (!process.env.VITE_LOGGED_OUT_URL) {
        console.error("Missing Required Env Variable: VITE_ORIGIN");
        return undefined;
    }

    return {
        URL: process.env.VITE_URL,
        ORIGIN: process.env.VITE_ORIGIN,
        LOGGED_OUT_URL: process.env.VITE_LOGGED_OUT_URL,
    }
}

function load_inventory(): InventoryConfig | undefined {
    if (!process.env.INV_API_KEY) {
        console.log("Missing Required Env Variable: INV_API_KEY (inventory management)");
        return undefined;
    }
    return {
        API_KEY: process.env.INV_API_KEY,
        DISABLE_CARTS: (process.env.VITE_DISABLE_STOREFRONT_CART ? (process.env.VITE_DISABLE_STOREFRONT_CART == "true") : false)
    };
}

function load_config(): Config {
    const auth = load_auth();
    if (!auth) {
        process.exit(1);
    }
    const app = load_app();
    if (!app) {
        process.exit(1);
    }

    const inventory = load_inventory();
    if (!inventory) {
        process.exit(1);
    }


    return {
        NODE_ENV: "development",
        VITE: app,
        AUTH: auth,
        INV: inventory,
    }
}

const serverConfig: Config = load_config();


export default serverConfig;