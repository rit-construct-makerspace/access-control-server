/**
 * Multi-part charges
 * 
 */

import { CurrencySource } from "./types.js"

type Transaction = {
    id: number,
    accountID: number,
    owner: string,
    source: CurrencySource,
    description: string,
    outstandingCharge: number,
    cartID?: number;
    printerJobID?: number;
}

type TransactionEntry = {
    id: number,
    amount: number,
    description: string,
    transactionID: number,
};

function NewTransaction(cents: number, source: string, description: string){
    if (cents == 1){
        // this is an outstanding one, dont charge yet
    }
}
function UpdateTransaction(transactionID: number, deltaCents: number, reason: string, ){

}