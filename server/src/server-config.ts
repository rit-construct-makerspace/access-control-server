type SamlConfig = {
    readonly ID_FORMAT: string,
    readonly ISSUER: string,
    readonly CALLBACK_URL: string,
    readonly ENTRY_POINT: string,
    readonly SSL_PVKEY: string,
    readonly SSL_PUBKEY: string,
    readonly IDP_PUBKEY: string,
}
function SamlConfigIsValid(cfg: Partial<SamlConfig>): cfg is SamlConfig {
    return cfg.ID_FORMAT !== undefined &&
        cfg.ISSUER !== undefined &&
        cfg.CALLBACK_URL !== undefined &&
        cfg.ENTRY_POINT !== undefined &&
        cfg.SSL_PVKEY !== undefined &&
        cfg.SSL_PUBKEY !== undefined &&
        cfg.IDP_PUBKEY !== undefined;
}

type AuthConfig = {
    // Session secret for express-sessions
    readonly SESSION_SECRET: string,
    readonly USER_WHITELIST: string[]
    readonly SAML: SamlConfig;
}
function AuthConfigIsValid(cfg: Partial<AuthConfig>): cfg is AuthConfig {
    return cfg.SESSION_SECRET !== undefined && cfg.USER_WHITELIST !== undefined && cfg.SAML !== undefined;
}

type AppConfig = {
    readonly ORIGIN: string,
    readonly URL: string, // usually origin + base_url
    readonly LOGIN_URL: string; // the url that will use SSO to sign you in
    readonly LOGOUT_URL: string; // the url that will sign you out
    readonly LOGGED_OUT_URL: string // the url you will be sent to after logout
}

type PrinterOSConfig = {
    PAPERCUT?: { SECURITY_SECRET: string; }
    FREE_3D_PRINTS: boolean;

    SELF_SERVE_QUIZ_ID: number;
    SELF_SERVE_WORKGROUP_ID: number;

    FULL_SERVE_QUIZ_ID: number;
    FULL_SERVE_WORKGROUP_ID: number;

    API_URL: string;
    API_USERNAME: string;
    API_PASSWORD: string;
}

function PrinterOSConfigIsValid(cfg: Partial<PrinterOSConfig>): cfg is PrinterOSConfig {
    const invalid = cfg.FREE_3D_PRINTS === undefined
        || cfg.SELF_SERVE_QUIZ_ID === undefined
        || cfg.FULL_SERVE_QUIZ_ID == undefined
        || cfg.SELF_SERVE_WORKGROUP_ID === undefined
        || cfg.FULL_SERVE_WORKGROUP_ID == undefined
        || cfg.API_URL === undefined
        || cfg.API_USERNAME === undefined
        || cfg.API_PASSWORD === undefined;
    return !invalid;
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
    API_KEY: string; // API key for inventory devices to connect with
    DISABLE_CARTS: boolean; // TRUE to disable add to cart buttons so users cant go shopping
}

type AWSConfig = {
    readonly AWS_DELETER_EMAIL: string;
}

type Config = {
    readonly NODE_ENV: "development" | "staging" | "production",
    readonly CDN_URL: string;
    readonly STATISTICS_TIMEZONE: string;
    readonly INV: InventoryConfig
    readonly VITE: AppConfig
    readonly AUTH: AuthConfig,
    readonly PRINTER_OS: PrinterOSConfig
}

function required_string(key: string, reason: string): string | undefined {
    const value = process.env[key];
    if (!value) {
        console.error(`Missing Required Env Variable '${key}' (${reason})`);
        return undefined;
    }
    return value;
}
function defaulted_string(key: string, reason: string, defaultValue: string): string {
    const value = process.env[key];
    if (!value) {
        console.warn(`Missing Suggested Env Variable '${key}' (${reason})`);
        return defaultValue;
    }
    return value;
}

function defaulted_boolean(key: string, reason: string, defaultValue: boolean): boolean {
    const value = process.env[key];
    if (!value) {
        console.warn(`Missing Suggested Env Variable '${key}' (${reason})  Defaulting to ${defaultValue}`);
        return defaultValue;
    }
    if (value.toLowerCase() === "true") {
        return true
    }
    if (value.toLowerCase() === "false") {
        return true
    }
    console.warn(`Malformed boolean for Suggested Env Variable '${key}' (${reason}) Defaulting to ${defaultValue}`);
    return defaultValue;
}

function required_nonnan(key: string, reason: string): number | undefined {
    const value = process.env[key];
    if (!value) {
        console.error(`Missing Numeric Env Variable '${key}' (${reason}). Value: ${value}`);
        return undefined;
    }
    if (isNaN(Number(value))) {
        console.error(`Invalid Numeric Env Variable '${key}' (${reason}). Value: ${value}`);
        return undefined;
    }
    return Number(value);
}


function load_auth(): AuthConfig | undefined {
    const saml: Partial<SamlConfig> = {
        ISSUER: required_string("ISSUER", "SAML Auth"),
        CALLBACK_URL: required_string("CALLBACK_URL", "SAML Auth"),
        ENTRY_POINT: required_string("ENTRY_POINT", "(SAML Auth)"),
        SSL_PVKEY: required_string("SSL_PVKEY", "SAML Auth"),
        SSL_PUBKEY: required_string("SSL_PUBKEY", "SAML Auth"),
        IDP_PUBKEY: required_string("IDP_PUBKEY", "SAML Auth"),
        ID_FORMAT: required_string("ID_FORMAT", "SAML Auth"),
    }
    if (!SamlConfigIsValid(saml)) {
        console.error("Invalid SAML configuration");
        return undefined;
    }
    const allowlist = required_string("USER_WHITELIST", "SAML Auth");
    const cfg: Partial<AuthConfig> = {
        SESSION_SECRET: required_string("SESSION_SECRET", "Express Sessions"),
        SAML: saml,
        USER_WHITELIST: allowlist?.split(","),
    }
    if (!AuthConfigIsValid(cfg)) {
        console.error("Invalid Auth configuration");
        return undefined;
    }
    return cfg;

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


function load_printer_os(): PrinterOSConfig | undefined {
    const cfg: Partial<PrinterOSConfig> = {
        FREE_3D_PRINTS: defaulted_boolean("FREE_3D_PRINTS", "3DPrinterOS Payment", false),
        SELF_SERVE_QUIZ_ID: required_nonnan("ID_3DPRINTEROS_QUIZ", "Printer OS Workgroup Management"),
        SELF_SERVE_WORKGROUP_ID: required_nonnan("CLOUDPRINT_API_WORKGROUP", "Printer OS Workgroup Management"),
        FULL_SERVE_QUIZ_ID: required_nonnan("ID_3DPRINTEROS_FS_QUIZ", "Printer OS Workgroup Management"),
        FULL_SERVE_WORKGROUP_ID: required_nonnan("CLOUDPRINT_API_FS_WORKGROUP", "Printer OS Workgroup Management"),
        API_URL: required_string("CLOUDPRINT_API_URL", "Printer OS Workgroup Management"),
        API_USERNAME: required_string("CLOUDPRINT_API_USERNAME", "Printer OS Workgroup Management"),
        API_PASSWORD: required_string("CLOUDPRINT_API_PASSWORD", "Printer OS Workgroup Management"),
    };

    if (!PrinterOSConfigIsValid(cfg)) {
        return undefined;
    }
    return cfg
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

    const e = process.env.NODE_ENV;
    if (!(e == "development" || e === "staging" || e === "production")) {
        process.exit(1);
    }
    if (!process.env.VITE_CDN_URL) {
        console.warn("Missing Env Variable VITE_CDN_URL (WARN)")
    }
    if (!process.env.STAT_TIMEZONE) {
        console.error("Missing Required Env Variable STAT_TIMEZONE (Statistics Queries)")
        process.exit(1);
    }
    const printer_os = load_printer_os();
    if (!printer_os) {
        process.exit(1);
    }

    return {
        NODE_ENV: e,
        CDN_URL: process.env.VITE_CDN_URL ?? "",
        STATISTICS_TIMEZONE: process.env.STAT_TIMEZONE,
        VITE: app,
        AUTH: auth,
        INV: inventory,
        PRINTER_OS: printer_os,
    }
}

const serverConfig: Config = load_config();
console.log(serverConfig);

export default serverConfig;