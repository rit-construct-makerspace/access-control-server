/**
 * Multi-part charges
 * 
 */

import { CurrencySource } from "./types.js"


function NewTransaction(cents: number, source: string, description: string){
    if (cents == 1){
        // this is an outstanding one, dont charge yet
    }
}
function UpdateTransaction(transactionID: number, deltaCents: number, reason: string, ){

}