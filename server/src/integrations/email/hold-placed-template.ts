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
    <h1>Account Hold Notice</h1>
    <br>
    <h2> A hold has been placed on your account.</h2>
    <h4> Reason: <%= desc %> </h4>

    <br>
    <br>

    Please see Makerspace staff to remove hold.

</div>
`

let template = ejs.compile(templateSource, { async: false })

function generateHTMLHold(desc: string) {
    let data = {
        desc: desc,
    };
    return template(data);
}

export function generateHoldPlacedEmail(desc: string): {text: string, html: string} {
    const html = generateHTMLHold(desc);
    return {text: html, html}
}