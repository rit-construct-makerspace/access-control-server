import * as Atrium from "../atrium-integration/atrium.js"
import * as CurrencyAccountRepo from "../../repositories/Currency/CurrencyAccountsRepository.js"
import { getCurrencyLedgerEntry } from "../../repositories/Currency/CurrencyLedgerRepository.js";

const USE_ATRIUM_FOR_CURRENCY = process.env.ATRIUM_ENABLED == "true";

export enum MakeMoneyError {
  NoAccount = "NoAccount",
  ConnectionError = "ConnectionError",
  SomethingElse = "SomethingElse"
};

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
  public isCharge(): boolean {
    return this.subtotal() > 0;
  }
  public isRefund(): boolean {
    return !this.isCharge();
  }
}

/**
 * get the balance of a users total funds (construct credits + tiger bucks)
 * @param username the rit username for the accoun to query
 * @returns 
 */
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
  let atriumBalance = 0;
  if (USE_ATRIUM_FOR_CURRENCY) {
    const res = await Atrium.getBalance(username);
    if (typeof res !== "number") {
      // error retrieving atrium info
      console.log(`Unable to query atrium balance for '${username}'. ${atriumBalance}.\nThis user will only access tigerbucks`)
      atriumBalance = 0;
    } else {
      atriumBalance = res;
    }
  }
  return makeBalance + atriumBalance;
}

/**
 * 
 * @param ledgerId the ledger id of the transaction to reverse
 * @param partialAmount optional: if specified, only specify up that amount biased towards tigerbucks, but not exceeding the original amount of tigerbucks used. If not specefied, the full amount is returned in the original split
 * @return true if the reversal was successful. False otherwise (couldn't find original, couldn't adjust funds)
 */
export async function reversePreviousTransaction(ledgerId: number, partialAmount: number | undefined = undefined): Promise<boolean> {
  const original = await getCurrencyLedgerEntry(ledgerId);
  if (original == undefined){
    // couldn't find original to refund
    return false;
  }
  if (partialAmount == undefined || partialAmount > original.amount){
    partialAmount = original.accountID;
  }

  return false; 
}
export async function adjustAccountBalanceIfAvailableCents(username: string, transaction: Transaction): Promise<boolean> {
  try {
    const makeAccountID = await CurrencyAccountRepo.getAccountIDByUsername(username);
    if (makeAccountID === undefined) {
      // Don't have a make account -> don't have Atrium or CC -> Can't charge them
      return false;
    }


    const deltaCents = -transaction.subtotal(); // - if a charge, + if a refund if modifying directly, not splitting
    // All refunds go to CC. If they want to argue, resolve manually
    if (transaction.isRefund()) {
      const success = CurrencyAccountRepo.adjustAccountBalanceIfAvailableCents(makeAccountID, deltaCents, transaction.source, transaction.description);
      return success;
    }

    if (!USE_ATRIUM_FOR_CURRENCY) {
      // If Atrium is turned off, we charge only to CC. if that fails, we have nothing to charge the rest to so the transaction fails
      const success = await CurrencyAccountRepo.adjustAccountBalanceIfAvailableCents(makeAccountID, deltaCents, transaction.source, transaction.description);
      return success;
    }

    const remainingToCharge = await CurrencyAccountRepo.chargeAccountReturnRemainingCents(makeAccountID, transaction.subtotal(), transaction.source, transaction.description);
    if (remainingToCharge == 0) {
      // all was taken care of with CC, don't need to charge atrium
      return true;
    }

    const amountAppliedToCC = transaction.subtotal() - remainingToCharge;
    const atriumRes = await Atrium.adjustBalanceIfPossible(Atrium.Terminal.Printers, username, makeAccountID, -remainingToCharge, transaction.source, transaction?.description ?? "");
    if (typeof atriumRes == "boolean" && atriumRes == true) {
      // total success
      return true;
    } else {
      console.log("atriumRes", atriumRes);
    }
    // failure to charge remaining to atrium, need to refund to CC
    CurrencyAccountRepo.adjustAccountBalanceIfAvailableCents(makeAccountID, amountAppliedToCC, transaction.source, "Rectifying refund (atrium failed): " + transaction.description)

    return false;
  } catch (e) {
    console.error(`Failed to adjust balances for ${username} - ${JSON.stringify(transaction)}: ${e}`);
    return false;
  }
}


export function centsToDollarString(cents: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100);
}