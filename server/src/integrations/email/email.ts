import FormData from "form-data";
import * as Mailgun from "mailgun.js"
import { generateReceiptEmail } from "./receipt-template.js"
import { Transaction } from "../currency/currency.js";

const mailgun = new Mailgun.default(FormData);
const mg = mailgun.client({ username: 'api', key: process.env.MAILGUN_API_KEY || 'key-yourkeyhere' });
const MAILGUN_DOMAIN = process.env.MAILGUN_DOMAIN ?? "";


type MessageSendResult = {
    id?: string;
    message?: string;
    status: number;
    details?: string;
}
export function send_generic_email(args: { fromAccount: string, to: string[], subject: string, htmlContent: string, textContent: string }): Promise<MessageSendResult> {
    console.log(`make@rit.edu <${args.fromAccount}@${MAILGUN_DOMAIN}`, process.env.NODE_ENV);
    return mg.messages.create(MAILGUN_DOMAIN, {
        from: `make@rit.edu <${args.fromAccount}@${MAILGUN_DOMAIN}>`,
        bcc: ((process.env.NODE_ENV !== "development") ? ['make@rit.edu'] : []),
        to: args.to,
        subject: args.subject,
        text: args.textContent,
        html: args.htmlContent,
        "h:Reply-To": 'make@rit.edu'
    });
}



export async function send_transaction_email(transaction: Transaction) {
    const content = generateReceiptEmail(transaction);
    console.log(content.html)

    await send_generic_email({
        fromAccount: 'receipts',
        to: ['res3453@rit.edu'],
        subject: 'RIT SHED Receipt',
        textContent: content.text,
        htmlContent: content.html
    }).then(res => {console.log("Email Sent: ",res)})
    .catch((err: any) => {console.error("Error sending receipt email", err)});
}