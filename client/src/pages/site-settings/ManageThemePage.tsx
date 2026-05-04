import { useMutation, useQuery } from "@apollo/client/react";
import { Button, createTheme, LinearProgress, Paper, Stack, ThemeOptions, ThemeProvider, Typography } from "@mui/material";
import { GET_THEME, MARK_DEFAULT_THEME, UPDATE_THEME } from "../../queries/themeQueries";
import { useNavigate, useParams } from "react-router-dom";
import { ServerThemeData } from "../../types/site_settings/MakeTheme";
import { useEffect, useState } from "react";
import SaveIcon from '@mui/icons-material/Save';
import NotInterestedIcon from '@mui/icons-material/NotInterested';
import { toast } from "react-toastify";
import { useMakeTheme } from "../../common/MakeThemeProvider";

import StarIcon from '@mui/icons-material/Star';
import ThemeEditor from "./ThemeEditor";

export default function ManageThemePage() {
  const { themeKey } = useParams<{ themeKey: string }>();
  const navigate = useNavigate();
  const makeTheme = useMakeTheme();

  const [updateTheme] = useMutation(UPDATE_THEME, { refetchQueries: ["GetThemes"], awaitRefetchQueries: true });
  const [markDefaultTheme] = useMutation(MARK_DEFAULT_THEME, { refetchQueries: ["GetThemes"], awaitRefetchQueries: true });

  const [themeMode, setThemeMode] = useState<"light" | "dark">("light");

  const themeResult = useQuery(GET_THEME, {
    variables: { key: themeKey },

  });

  const currentTheme: ServerThemeData = themeResult.data ? {
    ...themeResult.data?.getTheme,
    muiThemeOptions: JSON.parse(themeResult.data?.getTheme.muiThemeOptions)
  } : undefined;

  async function handleUpdateTheme() {
    try {
      await updateTheme({
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

  async function handleMarkDefaultTheme() {
    try {
      await markDefaultTheme({
        variables: {
          key: themeKey
        }
      })
      toast.success(`Marked this as the default theme`)
    } catch (e) {
      toast.error(`Failed to update theme: ${e}`)
    }
  }

  return (
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
            color="primary"
            startIcon={<StarIcon />}
            onClick={handleMarkDefaultTheme}
            disabled={currentTheme?.default ?? true}
            loading={themeResult.loading}
          >
            Mark as Default Theme
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
      {currentTheme
        ? <ThemeEditor
          themeName={currentTheme.themeName}
          siteTitle={currentTheme.themeName}
          logo={currentTheme.logo}

          primary={currentTheme.muiThemeOptions.palette?.primary.main}
          secondary={currentTheme.muiThemeOptions.palette?.secondary.main}
          error={currentTheme.muiThemeOptions.palette?.error.main}
          warning={currentTheme.muiThemeOptions.palette?.warning.main}
          info={currentTheme.muiThemeOptions.palette?.info.main}
          success={currentTheme.muiThemeOptions.palette?.success.main}
          mode={currentTheme.muiThemeOptions.palette?.mode}
        />
        : <LinearProgress />
      }
    </Stack>
  );
}