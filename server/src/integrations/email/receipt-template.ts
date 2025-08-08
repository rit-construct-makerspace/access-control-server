import ejs from "ejs"
import { centsToDollarString, Transaction } from "../currency/currency.js"

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
</style>
<div class="email-body">
    <img src="https://d1msoab4sbdxmc.cloudfront.net/email-images/SHED_all_horizontal_black_orange_white_bg.png"
        alt="RIT The Shed Logo" width="600px">
    <h1>Transaction Receipt - <%= transaction.date.toLocaleString() %></h1>

    <h2><%= transaction.source %></h2>

    <% if (typeof transaction.description !== 'undefined') { %>
    <h4><%= transaction.description %></h4>
    <% } %>
    
    <table class="item-table">
        <tr>
            <th>Quantity</th>
            <th>Item</th>
            <th>Price</th>
        </tr>
        <% transaction.items.forEach(function(item){ %>
            <tr>
                <td>1</td>
                <td><%= item.name %></td>
                <td><%= formatCents(item.cents) %></td>
            </tr>
        <% }); %>
        %>
    </table>

    <br>
    <hr>
    <br>

    <table class="total-table">
        <tr>
            <td>Subtotal: </td>
            <td><%= formatCents(transaction.subtotal()) %></td>
        </tr>

        <% if (transaction.taxCents) {%>
        <tr>
            <td> Tax: </td>
            <td><%= formatCents(transaction.taxCents) %></td>
        </tr>
        <% } %>

        <tr class="separator"></tr>

        <tr>
            <td>Grand Total: </td>
            <td><%= formatCents(transaction.grandTotalIncludingTax()) %></td>
        </tr>


    </table>

</div>
`
let template = ejs.compile(templateSource, { async: false })

function generateTextReceipt(r: Transaction): string {
    return `
**make.rit.edu receipt**
-----------------
Items:
${r.items.map(item => `${1}  ${centsToDollarString(item.cents)}\t${item.name}\n`)}

-----------------
Subtotal: ${centsToDollarString(r.subtotal())}
Tax:      ${centsToDollarString(r.taxCents)}

Total:    ${centsToDollarString(r.grandTotalIncludingTax() + r.taxCents)}
`
}


function generateHTMLReceipt(r: Transaction) {
    let data = {
        transaction: r,
        formatCents: centsToDollarString,
    };
    return template(data);
}

export function generateReceiptEmail(r: Transaction): { text: string, html: string } {
    const text = generateTextReceipt(r);
    const html = generateHTMLReceipt(r);
    return { text, html }
}


