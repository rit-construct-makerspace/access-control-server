import * as Atrium from "../atrium-integration/atrium.js"
import * as CurrencyAccountRepo from "../../repositories/Currency/CurrencyAccountsRepository.js"

const TAX_RATE_PERCENT: number = process.env.TAX_RATE_PERCENT ? Number(process.env.TAX_RATE_PERCENT) : 0;

export enum MakeMoneyError {
  NoAccount = "NoAccount",
  ConnectionError = "ConnectionError",
  SomethingElse = "SomethingElse"
};

function calculateTax(amountCents: number): number {
  return Math.round(amountCents * TAX_RATE_PERCENT / 100);
}

// Split the price of something such that newItemPrice + taxOnItem = amountCents
function splitTax(amountCents: number): { nonTax: number, tax: number } {
  const nonTax = Math.round(amountCents / ((1 + TAX_RATE_PERCENT / 100)));
  const tax = amountCents - nonTax;
  return { nonTax: nonTax, tax: tax };
}


export class Transaction {
  date: Date
  source: string;
  description?: string;
  items: { name: string, cents: number }[];
  // subtotal is sum(items.cents)
  tigerbucksUsed: number;
  taxCents: number;
  constructor(date: Date, source: string, description: string, items: { name: string, cents: number }[], applyTax: boolean) {
    this.date = date;
    this.source = source;
    this.items = items;
    this.description = description;
    const subtotalCents = items.reduce((acc, obj) => acc + obj.cents, 0);
    if (applyTax) {
      this.taxCents = calculateTax(subtotalCents);
    } else {
      this.taxCents = 0
    }

  }

  public totalCents(): number {
    const subtotalCents = this.items.reduce((acc, obj) => acc + obj.cents, 0);
    return subtotalCents + this.taxCents;
  }
}


export async function getAccountBalance(username: string): Promise<number | MakeMoneyError> {
  const makeAccountID = await CurrencyAccountRepo.getAccountIDByUsername(username);

  if (!makeAccountID) {
    return MakeMoneyError.NoAccount;
  }
  try {
    const make_bal = await CurrencyAccountRepo.getAccountBalanceCents(makeAccountID);
    return make_bal;
  } catch {
    return MakeMoneyError.SomethingElse;
  }
}

export async function adjustAccountBalanceIfAvailableCents(username: string, transaction: Transaction): Promise<boolean> {
  const makeAccountID = await CurrencyAccountRepo.getAccountIDByUsername(username);
  const deltaCents = -transaction.totalCents(); // - if a charge, + if a refund
  if (makeAccountID) { // found make account, use that first
    const success = await CurrencyAccountRepo.adjustAccountBalanceIfAvailableCents(makeAccountID, deltaCents, transaction.source, transaction.description);
    return success;
  }

  // ATRIUM IS NOT YET WIRED UP SO IF IT CANT CONSTRUCT CREDITS, IT FAILS
  return false;
}


export function centsToDollarString(cents: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100);
}