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
            <td>Total: </td>
            <td><%= formatCents(transaction.subtotal()) %></td>
        </tr>

    </table>

    <br><br>
    <br><br>
    You have <%= formatCents(constructCreditsRemaining) %> Construct Credits remaining.

</div>
`
let template = ejs.compile(templateSource, { async: false })

function generateTextReceipt(r: Transaction, constructCreditsRemaining: number): string {
    return `
**make.rit.edu receipt**
-----------------
Items:
${r.items.map(item => `${1}  ${centsToDollarString(item.cents)}\t${item.name}\n`)}

-----------------
Total: ${centsToDollarString(r.subtotal())}


You have ${centsToDollarString(constructCreditsRemaining)} Construct Credits remaining.

`
}


function generateHTMLReceipt(r: Transaction, constructCreditsRemaining: number) {
    let data = {
        transaction: r,
        constructCreditsRemaining: constructCreditsRemaining,
        formatCents: centsToDollarString,
    };
    return template(data);
}

export function generateReceiptEmail(r: Transaction, constructCreditsRemaining: number): { text: string, html: string } {
    const text = generateTextReceipt(r, constructCreditsRemaining);
    const html = generateHTMLReceipt(r, constructCreditsRemaining);
    return { text, html }
}


