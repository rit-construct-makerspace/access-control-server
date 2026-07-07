import { useMutation, useQuery } from "@apollo/client/react";
import { Alert, Button, CardActionArea, Divider, IconButton, Stack, Tooltip, Typography } from "@mui/material";
import { ServerThemeData } from "../../types/site_settings/MakeTheme";
import { useNavigate } from "react-router-dom";
import { useMakeTheme } from "../../common/MakeThemeProvider";
import { DELETE_THEME, GET_THEMES } from "../../queries/themeQueries";
import { toast } from "react-toastify";
import AddIcon from '@mui/icons-material/Add';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import StarIcon from '@mui/icons-material/Star';
import Delete from '@mui/icons-material/Delete';


export default function ThemeManagementPage() {
  const navigate = useNavigate();
  const makeTheme = useMakeTheme();
  const [deleteTheme] = useMutation(DELETE_THEME, { refetchQueries: [{ query: GET_THEMES, variables: {} }], awaitRefetchQueries: true });


  const getThemesResult = useQuery(GET_THEMES);

  const themes: ServerThemeData[] = getThemesResult.data?.getThemes ?? [];

  const DELETE_PROMPT = "Are you sure you want to delete this theme? This action can not be undone."
  async function handleDeleteTheme(themeKey: string) {
    try {
      if (!window.confirm(DELETE_PROMPT)) return;

      await deleteTheme({
        variables: { key: themeKey }
      })
      toast.success(`Deleted Theme!`)
      navigate(`/admin/themes`);
    } catch (e) {
      toast.error(`Failed to delete theme: ${e}`)
    }
  }


  return (
    <Stack padding={"10px 15px"} spacing={2}>
      <title>{`Themes | ${makeTheme.title}`}</title>
      <Stack direction={"row"} justifyContent={"space-between"} alignItems={"center"} alignSelf={"center"} width={"60%"}>
        <Typography variant="h4">Theme Management</Typography>
        <Button
          variant="contained"
          color="success"
          onClick={() => navigate(`/admin/themes/new`)}
          startIcon={<AddIcon />}
        >
          New Theme
        </Button>
      </Stack>
      {
        themes.length > 0
          ? <Stack width={"60%"} alignSelf={"center"} divider={<Divider orientation="horizontal" flexItem />}>
            {
              themes.map((serverTheme) => (
                <Stack direction={"row"} alignItems="center" spacing={2}>
                  <CardActionArea onClick={() => navigate(`/admin/themes/${serverTheme.key}`)} sx={{ padding: "15px 10px" }}>
                    <Stack direction={"row"} justifyContent={"space-between"}>
                      <Stack direction={"row"} spacing={2}>
                        <Typography variant="subtitle1">{serverTheme.themeName}</Typography>
                        {
                          serverTheme.default
                            ? <Tooltip title="Default Theme"><StarIcon color="info" /></Tooltip>
                            : null
                        }
                      </Stack>
                      <ArrowForwardIosIcon
                        color="primary"
                      />
                    </Stack>
                  </CardActionArea>
                  <IconButton onClick={() => handleDeleteTheme(serverTheme.key)} >
                    <Delete />
                  </IconButton>

                </Stack>
              ))
            }
          </Stack>
          : <Alert
            severity="info"
          >
            No Themes
          </Alert>
      }
    </Stack>
  );
}