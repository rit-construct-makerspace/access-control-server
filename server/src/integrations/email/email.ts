import FormData from "form-data";
import * as Mailgun from "mailgun.js"
import { generateReceiptEmail } from "./receipt-template.js"
import { Transaction } from "../currency/currency.js";
import { generateExpiryEmail, ExpiryDescription } from "./training-expiry-template.js"
const mailgun = new Mailgun.default(FormData);
const mg = mailgun.client({ username: 'api', key: process.env.MAILGUN_API_KEY || 'key-yourkeyhere' });
const MAIL_DOMAIN = process.env.MAIL_DOMAIN ?? "";


type MessageSendResult = {
    id?: string;
    message?: string;
    status: number;
    details?: string;
}
export async function send_generic_email(args: { fromAccount: string, to: string[], subject: string, htmlContent: string, textContent: string }): Promise<MessageSendResult> {
    if (true || process.env.NODE_ENV !== 'development') {
        return mg.messages.create(MAIL_DOMAIN, {
            from: `make@rit.edu <${args.fromAccount}@${MAIL_DOMAIN}>`,
            bcc: ((process.env.NODE_ENV !== "development") ? ['make@rit.edu'] : []),
            to: args.to,
            subject: args.subject,
            text: args.textContent,
            html: args.htmlContent,
            "h:Reply-To": 'make@rit.edu'
        });
    } else {
        console.log("NOT SENDING EMAIL BC DEV ENVIRONMENT");
        return {status: 500};
    }
}

const OVERRIDE_RECEIPT_EMAIL = process.env.OVERRIDE_RECEIPT_EMAIL;

/**
 * Send an email describing a transaction of tigerbucks and or construct credits
 * @param emailAddress the email address to send to
 * @param subjectInfo info for the subject line. will appear as "RIT SHED Receipt - ${subjectInfo} - Date"
 * @param transaction the transaction information to generate a receipt for
 */
export async function send_transaction_email(emailAddress: string, subjectInfo: string, transaction: Transaction) {
    const content = generateReceiptEmail(transaction);

    if (OVERRIDE_RECEIPT_EMAIL) {
        emailAddress = OVERRIDE_RECEIPT_EMAIL;
    }
    await send_generic_email({
        fromAccount: 'receipts',
        to: [emailAddress],
        subject: `RIT SHED Receipt - ${subjectInfo} - ${transaction.date.toLocaleString()}`,
        textContent: content.text,
        htmlContent: content.html
    }).catch((err: any) => { console.error("Error sending receipt email", err) });
}



export async function send_training_expiry_email(email: string, desc: ExpiryDescription) {
    const content = generateExpiryEmail(desc);
    send_generic_email({
        fromAccount: "training",
        to: [email],
        subject: "RIT SHED: " + ((desc.type == "warning") ? "Trainings Expiring Soon" : "Training Expiry Notice") + " - " + new Date().toLocaleDateString(),
        textContent: content.text,
        htmlContent: content.html,
    })
}