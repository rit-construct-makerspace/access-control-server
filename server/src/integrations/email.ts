import FormData from "form-data";
import * as Mailgun from "mailgun.js"
import { generateEmail } from "./email/receipt-template.js"
const mailgun = new Mailgun.default(FormData);
const mg = mailgun.client({ username: 'api', key: process.env.MAILGUN_API_KEY || 'key-yourkeyhere' });
const MAILGUN_DOMAIN = process.env.MAILGUN_DOMAIN ?? "";

export function send_email() {
    const content = generateEmail({ items: [
        {name: "carrots", price: 100, quantity: 3}
    ], tax: 243 });
    
    mg.messages.create(MAILGUN_DOMAIN, {
        from: `make.rit.edu <mailgun@${MAILGUN_DOMAIN}>`,
        to: ["res3453@rit.edu"],
        subject: "Test Receipt",
        text: content.text,
        html: content.html
    })
        .then(msg => console.log(msg)) // logs response data
        .catch(err => console.error(err)); // logs any error
}