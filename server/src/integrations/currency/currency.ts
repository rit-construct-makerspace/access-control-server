import * as Atrium from "../atrium-integration/atrium.js"
import * as CurrencyAccountRepo from "../../repositories/Currency/CurrencyAccountsRepository.js"
import { CurrencySource, MakeMoneyError } from "./types.js";
import { getUserByAccountID } from "../../repositories/Users/UserRepository.js";
import { getTransactionById } from "../../repositories/Currency/TransactionRepository.js";
import { TransactionRow } from "../../db/tables.js";
import { getCurrencyLedgerEntries, getCurrencyLedgerEntry } from "../../repositories/Currency/CurrencyLedgerRepository.js";

const USE_ATRIUM_FOR_CURRENCY = process.env.ATRIUM_ENABLED == "true";

/**
 * get the balance of a users total funds (construct credits + tiger bucks)
 * @param username the rit username for the account to query
 * @returns the balance of the users account or MakeMoneyError if problem executing
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
    return MakeMoneyError.NoAccount;
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


export function centsToDollarString(cents: number) {
  if (cents == -0) {
    cents = 0;
  }
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100);
}

export async function chargeAccount(accountId: number, cents: number, source: CurrencySource, description: string, transactionEntryId: number): Promise<boolean | MakeMoneyError> {
  if (cents < 0) {
    return MakeMoneyError.InvalidSign;
  }
  const owner = await CurrencyAccountRepo.getAccountOwner(accountId);
  if (owner === undefined) {
    return MakeMoneyError.NoAccount;
  }
  // if we cant use atrium bc its turned off or we're an org, just use CC
  if (!USE_ATRIUM_FOR_CURRENCY || owner.orgID != null) {
    try {
      return await CurrencyAccountRepo.adjustAccountBalanceIfAvailableCents(accountId, -cents, description, transactionEntryId);
    } catch {
      return MakeMoneyError.NoAccount;
    }
  }

  let remaining = cents;
  try {
    remaining = await CurrencyAccountRepo.chargeAccountReturnRemainingCents(accountId, cents, source, description, transactionEntryId);
  } catch (e) {
    console.log(`Failed to charge account: ${owner.username}`, e)
    return MakeMoneyError.NoAccount;
  }
  const toCredit = cents - remaining;

  // no atrium needed
  if (remaining === 0) {
    return true;
  }

  let atriumSuccess = false;
  try {
    const res: Atrium.Error | { success: boolean, atxid: number, refid: number } = await Atrium.adjustBalanceIfPossible(source, owner.username, accountId, -remaining, description, transactionEntryId);
    if ('type' in res) {
      // Failed
      console.error(`Currency: Failed to charge atrium for ${owner.username} for ${cents} cents`, res);
    } else {
      atriumSuccess = true;
    }
  } catch (e) {
    console.error(`Currency: Failed to charge atrium for ${owner.username} for ${cents} cents, ${e}`)
  }

  if (!atriumSuccess) {
    await CurrencyAccountRepo.adjustAccountBalanceCents(accountId, toCredit, source, "rectification for: " + description, transactionEntryId);
    return false;
  }

  return true
}

/**
 * "Safe" way to refund money. Will never go to atrium money, only ever to credit
 * @param accountId the account to give money to
 * @param cents the number of cents to give to that account
 * @returns true/false for success changing account amount, MakeMoneyError if failure operating
 */
export async function refundCreditAccount(accountId: number, cents: number, source: CurrencySource, description: string, transactionEntryId?: number): Promise<boolean | MakeMoneyError> {
  try {
    return await CurrencyAccountRepo.adjustAccountBalanceCents(accountId, cents, source, description, transactionEntryId)
  } catch {
    return MakeMoneyError.NoAccount;
  }
}


/**
 * Refunds a group of charges associated with a transaction
 * This is used to update a transaction to a new price. Worklflow looks like
 * Reverse Old Charges -> Calculate New Total -> Charge New total 
 * In order to handle tigerbuck account types correctly
 * @param group the description of the group of charges
 * @returns true if everything worked correctly
 * @returns false if there was nothing to refund
 * @returns Error if something went fundementally wrong while processing
 */
export async function refundChargeGroup(group: {
  transactionEntryId: number,
  atrium?: {
    amount: number, txid: number, currencyLedgerId: number
  },
  credit?: {
    amount: number, currencyLedgerId: number
  }
}, transaction: TransactionRow): Promise<boolean | MakeMoneyError> {
  if (group.atrium === undefined && group.credit === undefined) {
    // no work to do
    return false;
  }
  if (group.atrium) {
    const atriumRes = await Atrium.reverseCharge(transaction.origin, group.atrium?.currencyLedgerId);
    if (atriumRes.type)
  }
  if (group.credit) {
    const originalLedger = getCurrencyLedgerEntry(group.credit.currencyLedgerId);
    if (originalLedger) {
      const creditRes = refundCreditAccount(transaction.accountID, group.credit.amount, transaction.origin,))
    }
  }
  return MakeMoneyError.Unimplemented;
}