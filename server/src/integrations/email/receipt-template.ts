import ejs from "ejs"
import { centsToDollarString } from "../currency/currency.js"
import { readFileSync } from "fs"

const templateSource: string= `
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

    .total-table td {
        padding-left: 15px;
        padding-right: 15px;
    }

    .item-table {
        margin: 0px auto;
        padding: 15px;
    }
    .item-table td{
        text-align: left;
        padding-left: 15px;
        padding-right: 15px;
    }

    tr.separator {
        border-bottom: 1px solid gray;
    }

    picture>img {
        width: 100%;
    }
</style>
<div class="email-body">
    <picture id="logo-image">
        <source srcset="https://d1msoab4sbdxmc.cloudfront.net/email-images/SHED_all_horizontal_black_orange.svg"
            media="(prefers-color-scheme: light)" />
        <source srcset="https://d1msoab4sbdxmc.cloudfront.net/email-images/SHED_all_horizontal_orange_white.svg"
            media="(prefers-color-scheme: dark)" />
        <img src="https://d1msoab4sbdxmc.cloudfront.net/email-images/SHED_all_horizontal_black_orange.svg"
            alt="RIT The Shed Logo">
    </picture>
    <h1>Transaction Receipt - {DATE}</h1>

    <table class="item-table">
        <tr>
            <th>Quantity</th>
            <th>Item</th>
            <th>Price</th>
        </tr>
        <tr>
            <td>1</td>
            <td>Carrot</td>
            <td>$0.30</td>
        </tr>
    </table>

    <br>
    <hr>
    <br>

    <table class="total-table">
        <tr>
            <td>Subtotal: </td>
            <td>{SUBTOTAL}</td>
        </tr>
        <tr>
            <td>Tigerbucks: </td>
            <td>-{AMT OF TIGERBUCKS USED}</td>
        </tr>
        <tr class="separator"></tr>
        <tr>
            <td>Total: </td>
            <td>{TOTAL}</td>
        </tr>

        <tr>
            <td> Tax: </td>
            <td>{SUBTOTAL}</td>
        </tr>
        <tr class="separator"></tr>

        <tr>
            <td>Grand Total: </td>
            <td>{TOTAL}</td>
        </tr>


    </table>

    <ul style="list-style-type: none; padding: 0; ">
        <!-- If tax -->

    </ul>
</div>
`
let template = ejs.compile(templateSource, {async: false})

type R = {
    items: { name: string, quantity: number, price: number }[]
    tax: number;
}


function generateTextReceipt(r: R): string {
    const subTotal = r.items.reduce((a, v) => a + v.price, 0);
    return `
**make.rit.edu receipt**
-----------------
Items:
${r.items.map(item => `${item.quantity}  ${centsToDollarString(item.price)}\t${item.name}\n`)}

-----------------
Subtotal: ${subTotal}
Tax:      ${r.tax}

Total:    ${centsToDollarString(subTotal + r.tax)}
`
}

export function generateEmail(r: R): { text: string, html: string } {
    const text = generateTextReceipt(r);
    const html = template(r);
    return { text, html }
}


