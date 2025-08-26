import * as CurrencyAccountRepo from "../../repositories/Currency/CurrencyAccountsRepository.js"
import { getBalance } from "../atrium-integration/atrium.js";

export enum MakeMoneyError {
  NoAccount = "NoAccount",
  ConnectionError = "ConnectionError",
  SomethingElse = "SomethingElse"
};

/**
 * Split a charge (NON NEGATIVE) into construct credits cents  and atrium cents  
 * @param amountCents the number of cents to charge
 * @param constructCreditsAvailable the number of construct credits available to use
 * @return undefined if illegal value passed in (negative amount cents or constructCreditsAvailable)
 */
function splitCost(amountCents: number, constructCreditsAvailable: number): { ccUsed: number, atriumUsed: number, ccRemaining: number } | undefined {
  if (amountCents < 0 || constructCreditsAvailable < 0 || isNaN(amountCents) || isNaN(constructCreditsAvailable)) {
    return undefined;
  }

  if (constructCreditsAvailable > amountCents) {
    return { ccUsed: amountCents, atriumUsed: 0, ccRemaining: constructCreditsAvailable - amountCents };
  }

  if (constructCreditsAvailable == 0) {
    return { ccUsed: 0, atriumUsed: amountCents, ccRemaining: 0 };
  }

  // use all CC
  const remaining = amountCents - constructCreditsAvailable;
  return { ccUsed: constructCreditsAvailable, atriumUsed: remaining, ccRemaining: 0 };
}

export class Transaction {
  date: Date
  source: string;
  description?: string;
  items: { name: string, cents: number }[];
  // subtotal is sum(items.cents)
  constructor(date: Date, source: string, description: string, items: { name: string, cents: number }[], isRefund: boolean) {
    this.date = date;
    this.source = source;
    this.description = description;
    const factor = isRefund ? -1 : 1;
    this.items = items.map(item => ({ name: item.name, cents: factor * item.cents }));
  }
  /**
   * Calculate the subtotal of the transaction
   * Will return POSITIVE if this is a charge against an account (a purchase)
   * Will return NEGATIVE if this is a refund
   * @returns the amount to charge against an account
   */
  public subtotal(): number {
    return this.items.reduce((acc, obj) => acc + obj.cents, 0);
  }
}


export async function getAccountBalance(username: string): Promise<number | MakeMoneyError> {
  const makeAccountID = await CurrencyAccountRepo.getAccountIDByUsername(username);

  if (!makeAccountID) {
    return MakeMoneyError.NoAccount;
  }

  let makeBalance = 0;
  try {
    makeBalance = await CurrencyAccountRepo.getAccountBalanceCents(makeAccountID);
  } catch {
    return MakeMoneyError.SomethingElse;
  }
  let atriumBalance = await getBalance(username);
  if (typeof atriumBalance !== "number"){
    // error retrieving atrium info
    console.log(`Unable to query atrium balance for '${username}'. ${atriumBalance}.\nThis user will only access tigerbucks`)
    atriumBalance = 0;
  }
  return  makeBalance + atriumBalance;
}

export async function adjustAccountBalanceIfAvailableCents(username: string, transaction: Transaction): Promise<boolean> {
  const makeAccountID = await CurrencyAccountRepo.getAccountIDByUsername(username);
  const deltaCents = -transaction.subtotal(); // - if a charge, + if a refund
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