export enum CurrencySource {
    Printers = "printers",
    Store = "store",
    Website = "website",
    Unknown = "unknown",
};

export enum CurrencyType {
    Atrium = "atrium",
    Credit = "construct_credit",
}

export enum MakeMoneyError {
    NoAccount = "no_account",
    ConnectionError = "connection_error",
    SomethingElse = "something_else",
    NoHistoryForTransaction = "no_history_for_transaction",
    InvalidSign = "invalid_sign",
    DuplicateTransaction = "duplicate_transaction",
    RefundTooLarge = "refund_too_large",
    Unimplemented = "unimplemented",
};
