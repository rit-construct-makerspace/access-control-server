import * as Atrium from "../atrium-integration/atrium.js"
import * as CurrencyAccountRepo from "../../repositories/Currency/CurrencyAccountsRepository.js"
import { createCurrencyLedgerEntry, getCurrencyLedgerEntry } from "../../repositories/Currency/CurrencyLedgerRepository.js";

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
      console.log(`Unable to query atrium balance for '${username}'. ${atriumBalance}.\nThis user will only access tigerbucks`, res)
      atriumBalance = 0;
    } else {
      atriumBalance = res;
    }
  }
  return makeBalance + atriumBalance;
}

/**
 * Reverse a previously recorded transaction, up to an optional limit
 * @param ledgerId the ledger id of the transaction to reverse (if undefiend, this always fails)
 * @param partialAmount optional: if specified, only specify up that amount biased towards tigerbucks, but not exceeding the original amount of tigerbucks used. 
 * If not specefied, the full amount is returned in the original split
 * @return true if the reversal was successful. False otherwise (couldn't find original, couldn't adjust funds)
 */
export async function reversePreviousTransaction(ledgerId: number | undefined, partialAmount: number | undefined = undefined): Promise<boolean> {
  if (ledgerId == undefined) {
    return false;
  }
  const original = await getCurrencyLedgerEntry(ledgerId);
  if (original == undefined) {
    // couldn't find original to refund
    return false;
  }

  let toRefund = 0;
  if (partialAmount == undefined || partialAmount > original.creditAmount + original.atriumAmount) {
    toRefund = original.creditAmount + original.atriumAmount;
  } else {
    toRefund = partialAmount;
  }
  const toAtrium = (original.atriumAmount > toRefund) ? original.atriumAmount : toRefund;
  let toCredits = toRefund - toAtrium;
  if (toCredits < 0) {
    toCredits = 0;
  }

  if (original.accountID == null) {
    // accoutn has probably been deleted since, dont return
    return false;
  }
  console.log("original", original);

  try {
    let creditsReturned = 0;
    try {
      if (original.creditAmount != 0) {
        const res = await CurrencyAccountRepo.adjustAccountBalanceCents(original.accountID, -original.creditAmount, original.source, "Refund for " + original.description, original.printerJobId ?? undefined, false);
        if (res) {
          creditsReturned = -original.creditAmount;
        }
      }
    } catch { }
    let atriumReturned = 0;
    try {
      const term = original.atriumTerminal ? Atrium.TerminalIDToTerminal(original.atriumTerminal) : undefined;
      console.log("term", term);
      if (term != undefined && original.atriumAmount != 0) {
        const res = await Atrium.adjustBalanceIfPossible(term, original.owner, original.accountID, -original.atriumAmount, original.source, original.description ?? undefined, false);
        console.log("rev res", res);
        if ("success" in res && res.success === true) {
          atriumReturned = -original.atriumAmount;
        }
      }
    } catch { }
    createCurrencyLedgerEntry(
      original.accountID,
      creditsReturned,
      atriumReturned,
      original.source,
      {
        description: "Refund for: " + original.description,
        atxID: original.atxID ?? undefined,
        refID: original.refID ?? undefined,
        printerJobId: original.printerJobId ?? undefined
      }
    );
    return true;
  } catch (e) {
    console.error(`Could not reverse previous transaction (ID: ${ledgerId}) for unknown reason. You should probably talk to an admin`, e);
    return false;
  }
}

export async function adjustAccountBalanceIfAvailableCents(username: string, transaction: Transaction, terminal: Atrium.Terminal, printerJobId?: number): Promise<boolean> {
  try {
    const makeAccountID = await CurrencyAccountRepo.getAccountIDByUsername(username);
    if (makeAccountID === undefined) {
      // Don't have a make account -> don't have Atrium or CC -> Can't charge them
      return false;
    }


    const deltaCents = -transaction.subtotal(); // - if a charge, + if a refund if modifying directly, not splitting

    // Refunds should usually be handled by reversePreviousTransaction. But, if we are trying to charge a negative amount, we don't know if it should go to TB or CC. To be safe, send it to CC and we can manually resolve it
    if (transaction.isRefund()) {
      const success = await CurrencyAccountRepo.adjustAccountBalanceIfAvailableCents(makeAccountID, deltaCents, transaction.source, transaction.description, printerJobId, true);
      return success;
    }

    if (!USE_ATRIUM_FOR_CURRENCY) {
      // If Atrium is turned off, we charge only to CC. if that fails, we have nothing to charge the rest to so the transaction fails
      const success = await CurrencyAccountRepo.adjustAccountBalanceIfAvailableCents(makeAccountID, deltaCents, transaction.source, transaction.description, printerJobId, true);
      return success;
    }

    const remainingToCharge = await CurrencyAccountRepo.chargeAccountReturnRemainingCents(makeAccountID, transaction.subtotal(), transaction.source, transaction.description, printerJobId, false);
    if (remainingToCharge == 0) {
      // all was taken care of with CC, don't need to charge atrium
      return true;
    }

    const amountAppliedToCC = transaction.subtotal() - remainingToCharge;
    const atriumRes = await Atrium.adjustBalanceIfPossible(terminal, username, makeAccountID, -remainingToCharge, transaction.source, transaction?.description ?? "", false);

    if ("success" in atriumRes && atriumRes.success == true) {
      // total success
      await createCurrencyLedgerEntry(
        makeAccountID,
        -amountAppliedToCC,
        -remainingToCharge,
        transaction.source,
        {
          description: transaction.description,
          atxID: atriumRes.atxid,
          refID: atriumRes.refid,
          printerJobId: printerJobId,
          atriumTerminal: Atrium.TerminalToID(terminal)
        }
      );
      return true;
    } else {
      console.log("atriumRes", atriumRes);
    }
    // failure to charge remaining to atrium, need to refund to CC
    await CurrencyAccountRepo.adjustAccountBalanceIfAvailableCents(makeAccountID, amountAppliedToCC, transaction.source, "Rectifying refund (atrium failed): " + transaction.description, undefined, false)

    return false;
  } catch (e) {
    console.error(`Failed to adjust balances for ${username} - ${JSON.stringify(transaction)}: ${e}`);
    return false;
  }
}


export function centsToDollarString(cents: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100);
}