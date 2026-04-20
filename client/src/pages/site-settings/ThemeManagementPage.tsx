import { useQuery } from "@apollo/client";
import { Alert, Button, CardActionArea, Stack, Typography } from "@mui/material";
import { GET_THEMES } from "../../queries/themeQueries";
import { ServerThemeData } from "../../types/site_settings/MakeTheme";
import { useNavigate } from "react-router-dom";
import { ThemeController } from "../../types/site_settings/ThemeController";
import { useState } from "react";
import AddIcon from '@mui/icons-material/Add';

export default function ThemeManagementPage() {
  const navigate = useNavigate();
  const [activeTheme, setActiveTheme] = useState(ThemeController.getActiveTheme());

  ThemeController.addThemeWatcher((theme) => setActiveTheme(ThemeController.getActiveTheme()))

  const getThemesResult = useQuery(GET_THEMES);

  const themes: ServerThemeData[] = getThemesResult.data?.getThemes ?? [];


  return (
    <Stack padding={"10px 15px"} spacing={3}>
      <title>{`Themes | ${activeTheme.title}`}</title>
      <Stack direction={"row"} justifyContent={"space-between"} alignItems={"center"}>
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
          ? themes.map((serverTheme) => (
            <CardActionArea onClick={() => navigate(`/admin/themes/${serverTheme.key}`)}>
              <Stack direction={"row"}>
                <Typography variant="subtitle1">{serverTheme.themeName}</Typography>
              </Stack>
            </CardActionArea>
          ))
          : <Alert
            severity="info"
          >
            No Themes
          </Alert>
      }
    </Stack>
  );
}