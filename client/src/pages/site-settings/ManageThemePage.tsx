import { useMutation, useQuery } from "@apollo/client";
import { Alert, AppBar, Box, Button, Card, createTheme, Paper, Stack, TextField, ThemeOptions, ThemeProvider, ToggleButton, ToggleButtonGroup, Tooltip, Typography } from "@mui/material";
import { GET_THEME, UPDATE_THEME } from "../../queries/themeQueries";
import { useNavigate, useParams } from "react-router-dom";
import { ServerThemeData } from "../../types/site_settings/MakeTheme";
import { useEffect, useState } from "react";
import FileUploadButton from "../../common/FileUploadButton";
import { makeCDNLink } from "../../common/ImageFinder";
import styled from "styled-components";
import SaveIcon from '@mui/icons-material/Save';
import NotInterestedIcon from '@mui/icons-material/NotInterested';
import { toast } from "react-toastify";
import { useMakeTheme } from "../../common/MakeThemeProvider";
import AnnouncementIcon from '@mui/icons-material/Announcement';

const StyledImg = styled.img`
  padding: 12px;
  &:hover {
    cursor: pointer;
  }
`;

export default function ManageThemePage() {
  const { themeKey } = useParams<{ themeKey: string }>();
  const navigate = useNavigate();
  const makeTheme = useMakeTheme();

  const [updaeTheme] = useMutation(UPDATE_THEME, { refetchQueries: ["GetThemes"], awaitRefetchQueries: true })

  const [themeName, setThemeName] = useState("");
  const [siteTitle, setSiteTitle] = useState("Make");
  const [logo, setLogo] = useState("");

  const [primary, setPrimary] = useState("#1976d2");
  const [secondary, setSecondary] = useState("#9c27b0");
  const [error, setError] = useState("#d32f2f");
  const [warning, setWarning] = useState("#ed6c02");
  const [info, setInfo] = useState("#0288d1");
  const [success, setSuccess] = useState("#2e7d32");

  const [themeMode, setThemeMode] = useState<"light" | "dark">("light");

  const themeResult = useQuery(GET_THEME, { variables: { key: themeKey } });

  const currentTheme: ServerThemeData = themeResult.data ? {
    ...themeResult.data?.getTheme,
    muiThemeOptions: JSON.parse(themeResult.data?.getTheme.muiThemeOptions)
  } : undefined

  useEffect(() => {
    if (currentTheme !== undefined) {
      setThemeName(currentTheme.themeName);
      setSiteTitle(currentTheme.title);
      setLogo(currentTheme.logo);

      // @ts-expect-error trust me its fine -SZ
      setPrimary(currentTheme.muiThemeOptions.palette?.primary?.main);
      // @ts-expect-error trust me its fine -SZ
      setSecondary(currentTheme.muiThemeOptions.palette?.secondary?.main);
      // @ts-expect-error trust me its fine -SZ
      setError(currentTheme.muiThemeOptions.palette?.error?.main);
      // @ts-expect-error trust me its fine -SZ
      setWarning(currentTheme.muiThemeOptions.palette?.warning?.main);
      // @ts-expect-error trust me its fine -SZ
      setInfo(currentTheme.muiThemeOptions.palette?.info?.main);
      // @ts-expect-error trust me its fine -SZ
      setSuccess(currentTheme.muiThemeOptions.palette?.success?.main);
      // @ts-expect-error trust me its fine -SZ
      setThemeMode(currentTheme.muiThemeOptions.palette?.mode)
      // I hope anyway
    }
  }, [themeResult.data]);

  const muiThemeOptions: ThemeOptions = {
    palette: {
      primary: {
        main: primary
      },
      secondary: {
        main: secondary
      },
      error: {
        main: error,
      },
      warning: {
        main: warning
      },
      info: {
        main: info
      },
      success: {
        main: success
      },
      mode: themeMode
    }
  }

  const activeTheme = createTheme({
    ...muiThemeOptions,
    typography: {
      fontFamily: 'Roboto',
      subtitle1: {
        fontWeight: "bold",
      },
      body1: {
        fontWeight: undefined,
      },
    },
  });

  async function handleUpdateTheme() {
    try {
      await updaeTheme({
        variables: {
          key: themeKey,
          themeName: themeName,
          title: siteTitle,
          muiThemeOptions: JSON.stringify(muiThemeOptions),
          logo: logo
        }
      })
      toast.success(`Updated Theme!`)
    } catch (e) {
      toast.error(`Failed to update theme: ${e}`)
    }
  }

  return (
    <ThemeProvider theme={activeTheme}>
      <Paper elevation={0} sx={{ padding: "20px 0px 100px 0px" }}>
        <Stack alignItems={"center"} spacing={3}>
          <title>{`Edit Theme | ${makeTheme.title}`}</title>
          <Stack direction="row" width={"80%"} justifyContent={"space-between"}>
            <Typography variant="h4">{currentTheme ? `Edit ${currentTheme.themeName} Theme` : "Loading..."}</Typography>
            <Stack direction={"row"} spacing={2}>
              <Button
                variant="contained"
                color="error"
                startIcon={<NotInterestedIcon />}
                onClick={() => navigate(`/admin/themes`)}
              >
                Cancel
              </Button>
              <Button
                variant="contained"
                color="success"
                startIcon={<SaveIcon />}
                onClick={handleUpdateTheme}
              >
                Save
              </Button>
            </Stack>
          </Stack>
          <Stack spacing={2} width={"80%"}>
            <Stack direction={"row"} spacing={2}>
              <TextField
                label={"Theme Name"}
                value={themeName}
                onChange={(e) => setThemeName(e.target.value)}
                fullWidth
              />
              <TextField
                label={"Site Title"}
                value={siteTitle}
                onChange={(e) => setSiteTitle(e.target.value)}
                fullWidth
              />
            </Stack>
            <Stack direction={"row"} justifyContent={"space-between"}>
              <Stack direction={"row"} alignItems={"center"} spacing={1}>
                <Typography variant="subtitle1">
                  Theme Mode:
                </Typography>
                <ToggleButtonGroup
                  value={themeMode}
                  color="primary"
                  exclusive
                  onChange={(_e, newMode) => newMode ? setThemeMode(newMode) : null}
                >
                  <ToggleButton
                    value={"light"}
                  >
                    Light
                  </ToggleButton>
                  <ToggleButton
                    value={"dark"}
                  >
                    Dark
                  </ToggleButton>
                </ToggleButtonGroup>
              </Stack>
              <Stack direction={"row"} spacing={2} justifyContent={"center"} alignItems={"center"}>
                <FileUploadButton
                  variant="contained"
                  color="info"
                  text="Upload Logo"
                  onUpload={(name) => setLogo(name)}
                  sx={{
                    height: "min-content"
                  }}
                />
                <Tooltip title="Logo should be around 300x75">
                  <AnnouncementIcon color="secondary" />
                </Tooltip>
                {
                  logo === ""
                    ? <Card
                      variant="outlined"
                      sx={{
                        backgroundColor: "lightgray"
                      }}
                    >
                      <Stack alignItems={"center"} justifyContent={"center"} height={"75px"} width={"288px"}>
                        No Logo Uploaded
                      </Stack>
                    </Card>
                    : <Box height={"72px"} width={"288px"}>
                      <AppBar sx={{ position: "relative" }}>
                        <StyledImg width={"100%"} src={makeCDNLink(logo, "user-uploads/")} />
                      </AppBar>
                    </Box>
                }
              </Stack>
            </Stack>
            <Stack direction={"row"} spacing={2}>
              <TextField
                label="Primary"
                type="color"
                fullWidth
                value={primary}
                onChange={(e) => setPrimary(e.target.value)}
              />
              <TextField
                label="Secondary"
                type="color"
                fullWidth
                value={secondary}
                onChange={(e) => setSecondary(e.target.value)}
              />
              <TextField
                label="Error"
                type="color"
                fullWidth
                value={error}
                onChange={(e) => setError(e.target.value)}
              />
              <TextField
                label="Warning"
                type="color"
                fullWidth
                value={warning}
                onChange={(e) => setWarning(e.target.value)}
              />
              <TextField
                label="Info"
                type="color"
                fullWidth
                value={info}
                onChange={(e) => setInfo(e.target.value)}
              />
              <TextField
                label="Success"
                type="color"
                fullWidth
                value={success}
                onChange={(e) => setSuccess(e.target.value)}
              />
            </Stack>
            <Stack direction={"row"} spacing={2}>
              <Stack spacing={1} width={"100%"}>
                <Typography variant="subtitle1">Primary Example</Typography>
                <Button
                  variant="contained"
                  color="primary"
                >
                  I'm a Button!
                </Button>
                <Button
                  variant="outlined"
                  color="primary"
                >
                  I'm a Button!
                </Button>
              </Stack>
              <Stack spacing={1} width={"100%"}>
                <Typography variant="subtitle1">Secondary Example</Typography>
                <Button
                  variant="contained"
                  color="secondary"
                >
                  I'm a Button!
                </Button>
                <Button
                  variant="outlined"
                  color="secondary"
                >
                  I'm a Button!
                </Button>
              </Stack>
              <Stack spacing={1} width={"100%"}>
                <Typography variant="subtitle1">Error Example</Typography>
                <Button
                  variant="contained"
                  color="error"
                >
                  I'm a Button!
                </Button>
                <Button
                  variant="outlined"
                  color="error"
                >
                  I'm a Button!
                </Button>
                <Alert
                  variant="filled"
                  severity="error"
                >
                  Error!
                </Alert>
              </Stack>
              <Stack spacing={1} width={"100%"}>
                <Typography variant="subtitle1">Warning Example</Typography>
                <Button
                  variant="contained"
                  color="warning"
                >
                  I'm a Button!
                </Button>
                <Button
                  variant="outlined"
                  color="warning"
                >
                  I'm a Button!
                </Button>
                <Alert
                  variant="filled"
                  severity="warning"
                >
                  Warning!
                </Alert>
              </Stack>
              <Stack spacing={1} width={"100%"}>
                <Typography variant="subtitle1">Info Example</Typography>
                <Button
                  variant="contained"
                  color="info"
                >
                  I'm a Button!
                </Button>
                <Button
                  variant="outlined"
                  color="info"
                >
                  I'm a Button!
                </Button>
                <Alert
                  variant="filled"
                  severity="info"
                >
                  Info!
                </Alert>
              </Stack>
              <Stack spacing={1} width={"100%"}>
                <Typography variant="subtitle1">Success Example</Typography>
                <Button
                  variant="contained"
                  color="success"
                >
                  I'm a Button!
                </Button>
                <Button
                  variant="outlined"
                  color="success"
                >
                  I'm a Button!
                </Button>
                <Alert
                  variant="filled"
                  severity="success"
                >
                  Success!
                </Alert>
              </Stack>
            </Stack>
          </Stack>
        </Stack>
      </Paper>
    </ThemeProvider>
  );
}