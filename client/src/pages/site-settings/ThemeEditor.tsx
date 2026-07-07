import { AppBar, Box, Card, createTheme, PaletteMode, Paper, Stack, TextField, ThemeOptions, ThemeProvider, ToggleButton, ToggleButtonGroup, Tooltip, Typography } from "@mui/material";
import { useEffect, useState } from "react";
import ThemePreview from "./ThemePreview";
import FileUploadButton from "../../common/FileUploadButton";
import { makeCDNLink } from "../../common/ImageFinder";
import AnnouncementIcon from '@mui/icons-material/Announcement';
import styled from "styled-components";


const StyledImg = styled.img`
  padding: 12px;
  &:hover {
    cursor: pointer;
  }
`;

interface ThemeEditorProps {
  onChange: (theme: ThemeEditorProps) => void
  themeKey: string
  themeName: string;
  siteTitle: string;
  logo: string;

  primary: string;
  secondary: string;
  error: string;
  warning: string;
  info: string;
  success: string;
  mode: string;
}

export default function ThemeEditor(props: ThemeEditorProps) {

  const [themeName, setThemeName] = useState(props.themeName);
  const [siteTitle, setSiteTitle] = useState(props.siteTitle);
  const [logo, setLogo] = useState(props.logo);

  const [primary, setPrimary] = useState(props.primary);
  const [secondary, setSecondary] = useState(props.secondary);
  const [error, setError] = useState(props.error);
  const [warning, setWarning] = useState(props.warning);
  const [info, setInfo] = useState(props.info);
  const [success, setSuccess] = useState(props.success);
  const [mode, setMode] = useState(props.mode);


  useEffect(() => {
    const new_props: ThemeEditorProps = {
      onChange: props.onChange,
      themeKey: props.themeKey,

      themeName: themeName,
      siteTitle: siteTitle,
      logo: logo,
      primary: primary,
      secondary: secondary,
      error: error,
      warning: warning,
      info: info,
      success: success,
      mode: mode,
    }

    if (props.onChange) {
      props.onChange(new_props)
    }

  }, [props, themeName, siteTitle, logo, primary, secondary, error, warning, info, success, mode
  ]);


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
      mode: mode as PaletteMode
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

  return (
    <ThemeProvider theme={activeTheme}>
      <Paper elevation={0} sx={{ padding: "20px 0px 100px 0px", width: "100%", display: "grid" }}>
        <Stack spacing={2} width={"80%"} justifySelf={"center"}>
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
                value={mode}
                color="primary"
                exclusive
                onChange={(_e, newMode) => newMode ? setMode(newMode) : null}
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
      </Paper>
    </ThemeProvider>
  );
}