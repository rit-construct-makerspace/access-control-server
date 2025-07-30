import * as Atrium from "../atrium-integration/atrium.js"
import * as CurrencyAccountRepo from "../../repositories/Currency/CurrencyAccountsRepository.js"

export enum MakeMoneyError {
    NoAccount,
    ConnectionError,
    SomethingElse
};

export async function getAccountBalance(username: string): Promise<number | MakeMoneyError> {
    const makeAccountID = await CurrencyAccountRepo.getAccountIDByUsername(username);

    const atriumBalance = await Atrium.getBalance(username);

    var sum_bal = 0;
    if (makeAccountID) {
        const make_bal = await CurrencyAccountRepo.getAccountBalanceCents(makeAccountID);
        sum_bal = sum_bal + make_bal;
    }
}

export async function adjustAccountBalanceIfAvailableCents(username: string, deltaCents: number, source: string, description?: string): Promise<boolean> {

}