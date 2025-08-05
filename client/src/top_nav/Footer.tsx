import { AppBar, Link, Stack, Typography } from "@mui/material";


export default function Footer() {

    return (
        <Stack marginTop="auto" justifyContent="flex-end">
            <AppBar position="static">
                <Stack direction="row" width="auto" padding="20px" justifyContent="space-between" alignItems="center">
                    <Stack spacing={1}>
                        <Typography variant="h4">Make Something Interesting</Typography>
                        <Typography color="inherit">Contact Us: <Link href="mailto:make@rit.edu" underline="hover" color="inherit">make@rit.edu</Link></Typography>
                        <Typography variant="body1">This website uses cookies to provide better user experience and functionality. You can control and configure cookies in your web browser. <Link href="https://www.rit.edu/cookie-statement" underline="always" color="inherit" >Cookie Statement.</Link></Typography>
                    </Stack>
                    <img src="https://emoji.slack-edge.com/T018A0NHZNY/balloonritchie/41333b3f01b96f1a.png" alt="Balloon Ritchie" height="60px"/>
                </Stack>
            </AppBar>
        </Stack>
    );
}