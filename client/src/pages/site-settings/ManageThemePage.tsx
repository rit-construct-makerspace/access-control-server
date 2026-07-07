import { useMutation, useQuery } from "@apollo/client/react";
import { Button, LinearProgress, Stack, Typography } from "@mui/material";
import { GET_THEME, GET_THEMES, MARK_DEFAULT_THEME, UPDATE_THEME } from "../../queries/themeQueries";
import { useNavigate, useParams } from "react-router-dom";
import { ServerThemeData } from "../../types/site_settings/MakeTheme";
import SaveIcon from '@mui/icons-material/Save';
import NotInterestedIcon from '@mui/icons-material/NotInterested';
import { toast } from "react-toastify";
import { useMakeTheme } from "../../common/MakeThemeProvider";
import StarIcon from '@mui/icons-material/Star';
import ThemeEditor from "./ThemeEditor";
import { ComponentProps } from "react";

export default function ManageThemePage() {
  const { themeKey } = useParams<{ themeKey: string }>();
  const navigate = useNavigate();
  const makeTheme = useMakeTheme();

  type ThemeEditorProps = ComponentProps<typeof ThemeEditor>;

  const [updateTheme] = useMutation(UPDATE_THEME, { refetchQueries: [{ query: GET_THEMES, variables: {} }, { query: GET_THEME, variables: { key: themeKey } }], awaitRefetchQueries: true });
  const [markDefaultTheme] = useMutation(MARK_DEFAULT_THEME, { refetchQueries: [{ query: GET_THEMES, variables: {} }, GET_THEME], awaitRefetchQueries: true });

  const themeResult = useQuery(GET_THEME, {
    variables: { key: themeKey },
  });

  const currentTheme: ServerThemeData = themeResult.data ? {
    ...themeResult.data?.getTheme,
    muiThemeOptions: JSON.parse(themeResult.data?.getTheme.muiThemeOptions)
  } : undefined;

  const updatedTheme = currentTheme

  async function handleUpdateTheme() {
    try {
      await updateTheme({
        variables: {
          key: themeKey,
          themeName: updatedTheme.themeName,
          title: updatedTheme.title,
          muiThemeOptions: JSON.stringify(updatedTheme.muiThemeOptions),
          logo: updatedTheme.logo
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

  async function themeChanged(theme: ThemeEditorProps) {
    updatedTheme.logo = theme.logo
    updatedTheme.muiThemeOptions = {
      palette: {
        primary: {
          main: theme.primary
        },
        secondary: {
          main: theme.secondary
        },
        error: {
          main: theme.error,
        },
        warning: {
          main: theme.warning
        },
        info: {
          main: theme.info
        },
        success: {
          main: theme.success
        },
        mode: theme.mode == "light" ? "light" : "dark"
      }
    }
    updatedTheme.themeName = theme.themeName
    updatedTheme.title = theme.siteTitle

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
          onChange={themeChanged}
          themeKey={currentTheme.key}
          themeName={currentTheme.themeName}
          siteTitle={currentTheme.title}
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