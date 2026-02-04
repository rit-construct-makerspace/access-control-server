import { AppBar, Box, Button, Link, Stack, Typography } from "@mui/material";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";
import SlackIcon from "../common/SlackIcon";
import { useIsMobile } from "../common/IsMobileProvider";

export default function Footer() {
  const isMobile = useIsMobile();

  const cookieStatement = <Typography variant="body1">
    This website uses cookies to provide better user experience and functionality. You can control and
    configure cookies in your web browser.{" "}
    <Link href="https://www.rit.edu/cookie-statement" underline="always" color="inherit">
      Cookie Statement.
    </Link>
  </Typography>;

  return (
    <Stack marginTop="auto" justifyContent="flex-end">
      <AppBar position="static">
        <Stack
          direction={isMobile ? "column" : "row"}
          width="auto" padding="20px"
          justifyContent="space-between"
          alignItems={isMobile ? "start" : "center"}
          spacing={1}
        >
          <Stack spacing={1}>
            <Typography variant={isMobile ? "h5" : "h4"} display={"flex"} alignItems={"center"}>
              Make Something Interesting
              {
                isMobile ? null :
                  <img
                    src="https://d1msoab4sbdxmc.cloudfront.net/misc-images/balloon_ritchie.png"
                    alt="Balloon Ritchie"
                    height="40px"
                    style={{ paddingLeft: "10px" }}
                  />
              }
            </Typography>
            <Typography color="inherit">
              Contact Us:{" "}
              <Link href="mailto:make@rit.edu" underline="always" color="inherit">
                make@rit.edu
              </Link>

            </Typography>
            {isMobile ? null : cookieStatement}
          </Stack>
          <Stack
            direction={"row"}
            spacing={2}
            justifyContent={isMobile ? "space-between" : "start"}
            width={isMobile ? "100%" : undefined}
            alignItems={"center"}
          >
            <Button
              variant="contained"
              color="secondary"
              onClick={() => open("https://rit.enterprise.slack.com/archives/C0440KNF916", "_blank")}
            >
              <Stack direction={"column"} spacing={"10px"} alignItems={"center"}>
                <Box display="flex" alignItems="center" justifyContent="center" sx={{ width: "35px", height: "35px" }} >
                  <SlackIcon sx={{ fontSize: "29px" }} />
                </Box>
                Slack
              </Stack>
            </Button>
            {
              isMobile ?
                <img
                  src="https://d1msoab4sbdxmc.cloudfront.net/misc-images/balloon_ritchie.png"
                  alt="Balloon Ritchie"
                  height="40px"
                  style={{ paddingLeft: "10px" }}
                />
                : null
            }
            <Button variant="contained" color="info" onClick={() => open(import.meta.env.VITE_HELP_PAGE_URL, "_blank")}>
              <Stack direction={"column"} spacing={"10px"} alignItems={"center"}>
                <HelpOutlineIcon fontSize="large" />
                Help
              </Stack>
            </Button>

          </Stack>
          {isMobile ? cookieStatement : null}
        </Stack>
      </AppBar>
    </Stack>
  );
}
