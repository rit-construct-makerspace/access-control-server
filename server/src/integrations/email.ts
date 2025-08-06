import FormData from "form-data";
import * as Mailgun from "mailgun.js"
import { generateEmail } from "./email/receipt-template.js"
import { Transaction } from "./currency/currency.js";
const mailgun = new Mailgun.default(FormData);
const mg = mailgun.client({ username: 'api', key: process.env.MAILGUN_API_KEY || 'key-yourkeyhere' });
const MAILGUN_DOMAIN = process.env.MAILGUN_DOMAIN ?? "";

export function send_email() {
    const content = generateEmail(new Transaction(
        new Date(),
        "Farmers Shmarket",
        "Farmers Shmarket Purchase",
        [
            { name: "Carrot", cents: 100 },
            { name: "Bell Peppers", cents: 150 }
        ], 
        true
    )
    );
    // console.log(content.html)
    // mg.messages.create(MAILGUN_DOMAIN, {
    //     from: `make.rit.edu <receipts@${MAILGUN_DOMAIN}>`,
    //     to: ["res3453@rit.edu"],
    //     subject: "RIT SHED Receipt",
    //     text: content.text,
    //     html: content.html
    // })
    //     .then((msg: any) => console.log(msg)) // logs response data
    //     .catch((err: any) => console.error(err)); // logs any error
}