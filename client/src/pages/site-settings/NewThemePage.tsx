import { AppBar, Box, Button, Card, createTheme, Paper, Stack, TextField, ThemeOptions, ThemeProvider, ToggleButton, ToggleButtonGroup, Tooltip, Typography } from "@mui/material";
import { useNavigate } from "react-router-dom";
import NotInterestedIcon from '@mui/icons-material/NotInterested';
import { useState } from "react";
import FileUploadButton from "../../common/FileUploadButton";
import styled from "styled-components";
import { makeCDNLink } from "../../common/ImageFinder";
import AddIcon from '@mui/icons-material/Add';
import { useMutation } from "@apollo/client/react";
import { CREATE_THEME, GET_THEMES } from "../../queries/themeQueries";
import { toast } from "react-toastify";
import { useMakeTheme } from "../../common/MakeThemeProvider";
import AnnouncementIcon from '@mui/icons-material/Announcement';
import ThemePreview from "./ThemePreview";

const StyledImg = styled.img`
  padding: 12px;
  &:hover {
    cursor: pointer;
  }
`;

export default function NewThemePage() {
  const navigate = useNavigate();

  const [createMakeTheme] = useMutation(CREATE_THEME, { refetchQueries: [{ query: GET_THEMES, variables: {}} ], awaitRefetchQueries: true });

  const makeTheme = useMakeTheme();

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

  const newTheme = createTheme({
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

  function handleCreateTheme() {
    try {
      createMakeTheme({
        variables: {
          themeName: themeName,
          title: siteTitle,
          muiThemeOptions: JSON.stringify(muiThemeOptions),
          logo: logo
        }
      })
      navigate(`/admin/themes`);
    } catch (e) {
      toast.error(`Failed to create theme: ${e}`);
    }
  }

  return (
    <ThemeProvider theme={newTheme}>
      <Paper elevation={0}>
        <Stack spacing={3} padding={"10px 15px"} alignItems={"center"}>
          <title>{`New Theme | ${makeTheme.title}`}</title>
          <Stack direction={"row"} justifyContent={"space-between"} width={"100%"}>
            <Typography variant="h4">Create New Theme</Typography>
            <Stack
              direction={"row"}
              spacing={1}
            >
              <Button
                variant="contained"
                color="error"
                startIcon={<NotInterestedIcon />}
                onClick={() => navigate("/admin/themes")}
              >
                Cancel
              </Button>
              <Button
                variant="contained"
                color="success"
                startIcon={<AddIcon />}
                onClick={handleCreateTheme}
              >
                Create
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
            <ThemePreview />
          </Stack>
        </Stack>
      </Paper>
    </ThemeProvider>
  );
}