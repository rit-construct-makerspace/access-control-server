import * as Atrium from "../atrium-integration/atrium.js"
import * as CurrencyAccountRepo from "../../repositories/Currency/CurrencyAccountsRepository.js"
import { CurrencySource, MakeMoneyError } from "./types.js";
import { getUserByAccountID } from "../../repositories/Users/UserRepository.js";

const USE_ATRIUM_FOR_CURRENCY = process.env.ATRIUM_ENABLED == "true";

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
  const user = await getUserByAccountID(accountId);
  if (user == null) {
    return MakeMoneyError.NoAccount;
  }
  if (!USE_ATRIUM_FOR_CURRENCY) {
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
    console.error("Currency: Could not charge to construct credits", e);
    return MakeMoneyError.NoAccount;
  }
  let toCredit = cents - remaining;

  // no atrium needed
  if (remaining == 0) {
    return true;
  }

  let atriumSuccess = false;
  try {
    let res: Atrium.Error | { success: boolean, atxid: number, refid: number } = await Atrium.adjustBalanceIfPossible(source, user.ritUsername, accountId, -remaining, description, transactionEntryId);
    if ('type' in res) {
      // Failed
      console.error(`Currency: Failed to charge atrium for ${user.ritUsername} for ${cents} cents`, res);
    } else {
      atriumSuccess = true;
    }
  } catch (e) {
    console.error(`Currency: Failed to charge atrium for ${user.ritUsername} for ${cents} cents, ${e}`)
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
 * Return money to a user without ever transferring more to them in atrium money than they originally put in
 * User of this function passes in the amount of money sent to credits or to atrium so far for this transaction
 * This function will make sure the amount refunded to atrium does not exceed the amount taken from atrium
 * This function will make sure the amount refunded to credit does not exceed the amount taken from credit
 * However, this function will bias refunds towards atrium if they are not complete.
 * @param accountId the account to refund to
 * @param cents a positive amount of cents to give to thi account
 * @param split the amount of sents per currency type split of a refund into. Both parameters must be > 0. 
 * @param transactionEntryId the transaction this refund is a part of
 * @returns true if transfer was successful
 * @returns RefundTooBig if the requested amount of refund exceeds the amount we are willing to give (the amount we have already taken)
 * @returns InvalidSign if atrium or credit values of split are negative or if cents is negative.
 * @returns NoAccount if no user with that account id can be found
 */
export async function refundAccountSplitting(accountId: number, cents: number, source: CurrencySource, split: { atrium: number, credit: number }, description: string, transactionEntryId: number): Promise<boolean | MakeMoneyError> {
  if (split.atrium < 0 || split.credit < 0) {
    return MakeMoneyError.InvalidSign;
  }
  if (cents < 0) {
    return MakeMoneyError.InvalidSign;
  }
  const user = await getUserByAccountID(accountId);
  if (user == null) {
    return MakeMoneyError.NoAccount;
  }

  const availToRefund = split.atrium + split.credit;
  if (cents > availToRefund) {
    return MakeMoneyError.RefundTooLarge;
  }


  let toAtrium = split.atrium;
  if (toAtrium > cents) {
    toAtrium = cents;
  }

  if (toAtrium > 0) {
    const res = await Atrium.adjustBalanceIfPossible(source, user.ritUsername, accountId, toAtrium, description, transactionEntryId)
    // handle errors here, if fine, continue to credit side 
    if ('success' in res && res.success == false) {
      return false;
    } else {
      console.error("Currency: Couldn't refund to atrium", res);
      return MakeMoneyError.SomethingElse
    }
  }

  let toCredit = cents - toAtrium;
  if (toCredit > split.credit) {
    console.warn(`Currency: At some point keeping track of currency failed. Trying to refund ${toCredit} but only ${split.credit} available`);
    toCredit = split.credit;
  }
  if (toCredit != 0) {
    try {
      const creditRes = await CurrencyAccountRepo.adjustAccountBalanceCents(accountId, toCredit, source, description, transactionEntryId);
      return creditRes;
    } catch {
      return MakeMoneyError.NoAccount;
    }
  }

  // case where it all went to atrium
  return true;
}
