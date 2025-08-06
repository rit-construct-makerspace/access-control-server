import * as Atrium from "../atrium-integration/atrium.js"
import * as CurrencyAccountRepo from "../../repositories/Currency/CurrencyAccountsRepository.js"

const TAX_RATE_PERCENT: number = process.env.TAX_RATE_PERCENT ? Number(process.env.TAX_RATE_PERCENT) : 0;

export enum MakeMoneyError {
  NoAccount = "NoAccount",
  ConnectionError = "ConnectionError",
  SomethingElse = "SomethingElse"
};

function calculateTax(amountCents: number): number {
  const taxRatePercent = 4.5;
  return Math.round(amountCents * taxRatePercent / 100);
}

// Split the price of something such that newItemPrice + taxOnItem = amountCents
function splitTax(amountCents: number): { nonTax: number, tax: number } {
  const nonTax = Math.round(amountCents / ((1 + TAX_RATE_PERCENT / 100)));
  const tax = amountCents - nonTax;
  return { nonTax: nonTax, tax: tax };
}


export class Transaction {
  source: string;
  description?: string;
  items: { name: string, cents: number }[];
  // subtotal is sum(items.cents)
  taxCents: number;
  constructor(source: string, description: string, items: { name: string, cents: number }[], applyTax: boolean) {
    this.source = source;
    this.items = items;
    this.description = description;
    const subtotalCents = items.reduce((acc, obj) => acc + obj.cents, 0);
    this.taxCents = calculateTax(subtotalCents);

  }

  public totalCents(): number {
    const subtotalCents = this.items.reduce((acc, obj) => acc + obj.cents, 0);
    return subtotalCents + this.taxCents;
  }
}


export async function getAccountBalance(username: string): Promise<number | MakeMoneyError> {
  const makeAccountID = await CurrencyAccountRepo.getAccountIDByUsername(username);

  const atriumBalance = await Atrium.getBalance(username);

  var sum_bal = 0;
  if (makeAccountID) {
    const make_bal = await CurrencyAccountRepo.getAccountBalanceCents(makeAccountID);
    sum_bal = sum_bal + make_bal;
  }

  if (typeof (atriumBalance) === "number") {
    sum_bal = sum_bal + atriumBalance;
  }

  if (typeof (atriumBalance) === "number" || makeAccountID) {
    return sum_bal;
  } else {
    return MakeMoneyError.NoAccount;
  }
}

export async function adjustAccountBalanceIfAvailableCents(username: string, transaction: Transaction): Promise<boolean> {
  const makeAccountID = await CurrencyAccountRepo.getAccountIDByUsername(username);
  const deltaCents = -transaction.totalCents(); // - if a charge, + if a refund
  var remaining = deltaCents;
  if (makeAccountID) { // found make account, use that first
    if (deltaCents < 0) { // Delta cents is negative, indicating a charge
      remaining = -(await CurrencyAccountRepo.chargeAccountReturnRemainingCents(makeAccountID, -deltaCents, transaction.source, transaction.description));
    }
    // If it is positive, do nothing. We want to refund entirely to tigerbucks.
  }


  if (remaining == 0) {
    return true;
  }

  const split = splitTax(remaining);
  const wasAdjusted = await Atrium.adjustBalanceIfPossible(username, split.nonTax, split.tax);

  if (wasAdjusted) {
    return true;
  }

  if (makeAccountID && (deltaCents - remaining != 0)) {
    await CurrencyAccountRepo.adjustAccountBalanceCents(makeAccountID, deltaCents - remaining, transaction.source, "Rectification due to failed atrium charge");
  }

  return false;
}


export function centsToDollarString(cents: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100);
}