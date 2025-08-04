import * as Atrium from "../atrium-integration/atrium.js"
import * as CurrencyAccountRepo from "../../repositories/Currency/CurrencyAccountsRepository.js"

export enum MakeMoneyError {
  NoAccount = "NoAccount",
  ConnectionError = "ConnectionError",
  SomethingElse = "SomethingElse"
};

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

export async function adjustAccountBalanceIfAvailableCents(username: string, deltaCents: number, source: string, description?: string): Promise<boolean> {
  const makeAccountID = await CurrencyAccountRepo.getAccountIDByUsername(username);
  var remaining = deltaCents;
  if (makeAccountID) { // found make account, use that first
    if (deltaCents < 0) { // Delta cents is negative, indicating a charge
      remaining = -(await CurrencyAccountRepo.chargeAccountReturnRemainingCents(makeAccountID, -deltaCents, source, description));
    }
    // If it is positive, do nothing. We want to refund entirely to tigerbucks.
  }


  if (remaining == 0) {
    return true;
  }
  const wasAdjusted = await Atrium.adjustBalanceIfPossible(username, remaining);

  if (wasAdjusted) {
    return true;
  }

  if (makeAccountID && (deltaCents - remaining != 0)) {
    await CurrencyAccountRepo.adjustAccountBalanceCents(makeAccountID, deltaCents - remaining, source, "Rectification due to failed atrium charge");
  }

  return false;
}


export function centsToDollarString(cents: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100);
}