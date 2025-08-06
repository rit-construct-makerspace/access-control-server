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
    this.tigerbucksUsed = 0;
    this.taxCents = calculateTax(subtotalCents);
  }

  // add tigerbucks 'promotion'
  // if amount > cost, this will saturate at 0 and return the remaining
  // this will recalculate tax such that remainingCents = subtotal + subtotal*taxRate
  public useTigerbucks(amountUsed: number): number {
    if (this.grandTotalIncludingTax() < 0) {
      // this was a refund, dont use any tigerbucks
      return amountUsed;
    }

    // if tigerbucks were already used for some reason, combine them to prepare for new calculation
    if (this.tigerbucksUsed !== 0) {
      throw "alreadt applied tigerbucks";
      // amountUsed += this.tigerbucksUsed;
      // this.tigerbucksUsed = 0;
      // this.taxCents = calculateTax(this.subtotalBeforeTigerbucks())
    }

    // too much or just enough
    if (amountUsed >= this.grandTotalIncludingTax()) {
      const unused = amountUsed - this.grandTotalIncludingTax();
      this.tigerbucksUsed = this.grandTotalIncludingTax();
      this.taxCents = 0;
      return unused;
    }

    // from here, amountUsed == grandTotal

    // not entire cost, no tigerbucks leftover, NO TAX, dont need to split funny
    if (this.taxCents == 0) {
      this.tigerbucksUsed = amountUsed;
      return 0;
    }

    // not entire cost, no tigerbucks leftover, YES TAX, need to split remaining funny s.t. subtotal + tax*subtotal = remaining cost
    // TODO talk to lawyers about taxing original total vs post-tigerbucks total
    // const centsRemaining = this.grandTotalIncludingTax() - amountUsed; 
    // IDK what to do in this situation
    this.tigerbucksUsed = 0;
    // charge it all to atriumt
    this.taxCents = calculateTax(this.subtotalBeforeTigerbucks());
    return amountUsed;
  }
  /**
   * @returns sum(items)
   */
  public subtotalBeforeTigerbucks(): number {
    return this.items.reduce((acc, obj) => acc + obj.cents, 0);
  }
  /**
   * 
   * @returns sum(items) - tigerbucksUsed
   */
  public subtotalAfterTigerbucks(): number {
    return this.subtotalBeforeTigerbucks() - (this.tigerbucksUsed ?? 0);
  }
  /**
   * Calculate complete total
   * @returns sum(items) - tigerbucksUsed + tax
   */
  public grandTotalIncludingTax(): number {
    return this.subtotalAfterTigerbucks() + this.taxCents;
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
  const deltaCents = -transaction.grandTotalIncludingTax(); // - if a charge, + if a refund
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