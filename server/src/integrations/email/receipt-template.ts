import ejs from "ejs"
import { centsToDollarString } from "../currency/currency.js"
import { TransactionEntryRow, TransactionRow } from "../../db/tables.js"
import { getCurrencyLedgerEntriesForTransactionEntryByEntryId, getTransactionById, getTransactionEntriesByTransactionId } from "../../repositories/Currency/TransactionRepository.js"
import { CurrencyType } from "../currency/types.js"
import { getAccountBalanceCents } from "../../repositories/Currency/CurrencyAccountsRepository.js"

const templateSource: string = `
<link rel="stylesheet" href="https://fonts.googleapis.com/css?family=Roboto:300,400,500,700&display=swap" />

<style>
    body {
        font-family: 'Courier New', Courier, monospace;
        padding: 1%;
        text-align: center;
    }

    @media (prefers-color-scheme: dark) {
        body {
            background-color: black;
            color: white;
        }
    }
    .email-body{
        margin: 0px auto;
        width: 90%;
    }


    .total-table {
        margin: 0px auto;
        border-collapse: collapse;
        text-align: left;
    }


    .item-table > td,th {
        padding-left: 50px;
        padding-right: 50px;
        margin: 10px;
        display: block;
    }

    .item-table {
      border-spacing: 30px;

        margin: 0px auto;
    }
    .item-table td{
        text-align: left;
    }

    tr.separator {
        border-bottom: 1px solid gray;
    }    
</style>
<div class="email-body">
    <img src="https://d1msoab4sbdxmc.cloudfront.net/email-images/SHED_all_horizontal_black_orange_white_bg.png"
        alt="RIT SHED Logo" width="600px">
    <h1>Transaction Receipt - <%= info.transaction.dateTime.toLocaleString() %></h1>

    <% if (typeof info.transaction.description !== 'undefined') { %>
    <h4><%= info.transaction.description?.text ?? "" %></h4>
    <% } %>
    
    <table class="item-table">
        <tr>
            <th>Date</th>
            <th>Item</th>
            <th>CC*</th>
            <th>TB*</th>
            <th>Combined ($)</th>
        </tr>
        <% info.transactionEntries.forEach(function (entry){ %>
        <tr>
            <td><%= entry.entry.dateTime.toLocaleString() %></td>
            <td><%= entry.entry.description %></td>
            <td><%= formatCents(-entry.credit) %></td>
            <td><%= formatCents(-entry.atrium) %></td>
            <td><%= formatCents(-entry.atrium - entry.credit) %></td>
        </tr>
        <% }); %>
        
    </table>

    Net Charge: <%= formatCents(-info.totalCents)%>

    *CC = Construct Credits, *TB = Tiger Bucks
    <br>
    You have <%= formatCents(info.creditCentsRemaining) %> Construct Credits remaining.

</div>
`
let template = ejs.compile(templateSource, { async: false })



function generateHTMLReceipt(r: ReceiptInfo) {
    let data = {
        info: r,
        formatCents: centsToDollarString,
    };
    return template(data);
}

export type ReceiptInfo = {
    title: string,
    transaction: TransactionRow,
    transactionEntries: { entry: TransactionEntryRow, credit: number, atrium: number }[],
    totalCents: number,
    creditCentsRemaining: number
}

export async function generateReceiptEmail(transactionId: number): Promise<{ subject: string, text: string, html: string } | undefined> {
    const transaction = await getTransactionById(transactionId);
    if (transaction == null) {
        return undefined;
    }
    const entries = await getTransactionEntriesByTransactionId(transactionId);
    let entriesAndSplits: { entry: TransactionEntryRow, credit: number, atrium: number }[] = [];
    entries.forEach(async (entry) => {
        const ledgers = await getCurrencyLedgerEntriesForTransactionEntryByEntryId(entry.id)
        let credit = 0;
        let atrium = 0;
        ledgers.forEach(val => {
            if (val.currencyType == CurrencyType.Atrium) {
                atrium += val.amount;
            } else if (val.currencyType == CurrencyType.Credit) {
                credit += val.amount;
            }
        });
        entriesAndSplits.push({ entry: entry, credit: credit, atrium: atrium });
    });

    let creditsRemaining = 0;
    try {
        creditsRemaining = await getAccountBalanceCents(transaction.accountID);
    } catch {
        // account not found. shouldnt happen since we're generating a receipt for it
    }
    const totalCents = entriesAndSplits.reduce((acc, val) => (acc + val.atrium + val.credit), 0);
    const subject = `SHED Makerspace Receipt: 3D Printer OS Job #${transaction.printerJobId} - ${transaction.dateTime.toLocaleString()}`;
    const html = generateHTMLReceipt({ title: subject, transaction: transaction, transactionEntries: entriesAndSplits, creditCentsRemaining: creditsRemaining, totalCents: totalCents });
    return { subject: subject, text: html, html }
}


