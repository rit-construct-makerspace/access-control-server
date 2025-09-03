export enum CurrencySource{
    Printers = "printers",
    Store = "store",
    Website = "website",
    Unknown = "unknown",
};

export enum CurrencyType{
    Atrium = "atrium",
    Credit = "construct_credit",
}

export enum MakeMoneyError {
    NoAccount = "NoAccount",
    ConnectionError = "ConnectionError",
    SomethingElse = "SomethingElse",
    InvalidSign = "InvalidSign",
    NoFunds = "NoFunds",
    DuplicateTransaction = "DuplicateTransaction",
    RefundTooLarge = "RefundTooLarge",
    Unimplemented = "Unimplemented",
  };
  