import ejs from "ejs"
import { centsToDollarString } from "../currency/currency.js"
import { getAccountOwner } from "../../repositories/Currency/CurrencyAccountsRepository.js";

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

</style>
<div class="email-body">
    <img src="https://d1msoab4sbdxmc.cloudfront.net/email-images/SHED_all_horizontal_black_orange_white_bg.png"
        alt="RIT SHED Logo" width="600px">
    <h1>Account Balance Modification Notice</h1>
    
    <% if (info.type == "credit") { %>
    <h2> Your balance has been credited <%= formatCents(info.amount) %></h2>
    <% } else { %> 
    <h2> Your balance has been charged <%= formatCents(info.amount) %></h2>
    <% } %>


Reason: <%= info.desc %>

</div>
`

let template = ejs.compile(templateSource, { async: false })

function generateHTMLChange(desc:balChangeInfo) {
    let data = {
        info: desc,
        formatCents: centsToDollarString,
    };
    return template(data);
}

function generateTextChange(desc: balChangeInfo) {
    return desc.type
}

export type balChangeInfo ={
    amount: number
    type: "credit" | "charge"
    desc: string
}

export function generateBalanceChangeEmail(desc: balChangeInfo): {text: string, html: string} {
    const text = generateTextChange(desc);
    const html = generateHTMLChange(desc);
    return {text, html}
}
