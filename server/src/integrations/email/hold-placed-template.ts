import ejs from "ejs"

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
    <h2> A hold has been placed on your account for the following reason:</h2>
    <blockquote> <%= desc %> </blockquote>
    <p>
        You wont be able to use makerspace equipment until the hold is resolved. Email <a href="mailto:make@rit.edu">make@rit.edu</a> to talk to professional staff for more information. 
    </p>


</div>
`

const template = ejs.compile(templateSource, { async: false })

function generateHTMLHold(desc: string) {
    const data = {
        desc: desc,
    };
    return template(data);
}

export function generateHoldPlacedEmail(desc: string): {text: string, html: string} {
    const html = generateHTMLHold(desc);
    return {text: html, html}
}