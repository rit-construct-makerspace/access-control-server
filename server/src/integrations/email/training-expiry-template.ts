import ejs from "ejs"



export type ExpiryDescription = {
    type: "expiry" | "warning",
    modules: {name: string, link: string}[],
}

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
    <picture id="logo-image">
        <source srcset="https://d1msoab4sbdxmc.cloudfront.net/email-images/SHED_all_horizontal_black_orange.png"
            media="(prefers-color-scheme: light)" />
        <source srcset="https://d1msoab4sbdxmc.cloudfront.net/email-images/SHED_all_horizontal_orange_white.png"
            media="(prefers-color-scheme: dark)" />
        <img src="https://d1msoab4sbdxmc.cloudfront.net/email-images/SHED_all_horizontal_black_orange.png"
            alt="RIT The Shed Logo" width="600px">
    </picture>
    <h1>Training Expiry <%= (type == "warning") ? "Warning" : "Notice" %></h1>

    <b>If your training lapses, you will be unable to use this equipment. Once you re-take the trainings, your access will be restored. </b>

    <ul>
    <% for (const training of modules) { %>
        <li><a href=<%= training.link %>> <%= training.name %> </a></li>
    <% } %>
    
    </ul>

If you have already passed the in-person competency check, you will not need to re-take it.

</div>
`
let template = ejs.compile(templateSource, { async: false })

function generateTextReceipt(desc: ExpiryDescription): string {
    return `warning`
}


function generateHTMLReceipt(desc: ExpiryDescription) {
    return template(desc);
}


export function generateExpiryEmail(r: ExpiryDescription): { text: string, html: string } {
    const text = generateTextReceipt(r);
    const html = generateHTMLReceipt(r);
    return { text, html }
}


