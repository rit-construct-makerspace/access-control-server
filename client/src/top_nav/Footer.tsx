import { AppBar, Button, Link, Stack, Typography } from "@mui/material";
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';

export default function Footer() {

    return (
        <Stack marginTop="auto" justifyContent="flex-end">
            <AppBar position="static">
                <Stack direction="row" width="auto" padding="20px" justifyContent="space-between" alignItems="center">
                    <Stack spacing={1}>
                        <Typography variant="h4" display={"flex"} alignItems={"end"} >
                            Make Something Interesting

                            <img src="https://emoji.slack-edge.com/T018A0NHZNY/balloonritchie/41333b3f01b96f1a.png" alt="Balloon Ritchie" height="40px" style={{ paddingLeft: "10px" }} />
                        </Typography>
                        <Typography color="inherit">Contact Us: <Link href="mailto:make@rit.edu" underline="hover" color="inherit">make@rit.edu</Link></Typography>
                        <Typography variant="body1">This website uses cookies to provide better user experience and functionality. You can control and configure cookies in your web browser. <Link href="https://www.rit.edu/cookie-statement" underline="always" color="inherit" >Cookie Statement.</Link></Typography>
                    </Stack>

                    <Button variant="contained" color="info" onClick={() =>
                        open(import.meta.env.VITE_HELP_PAGE_URL, "_blank")
                    }>
                        <Stack direction={"column"} spacing={"10px"} alignItems={"center"}>
                            <HelpOutlineIcon fontSize="large" />
                            Help
                        </Stack>
                    </Button>
                </Stack>
            </AppBar >
        </Stack >
    );
}