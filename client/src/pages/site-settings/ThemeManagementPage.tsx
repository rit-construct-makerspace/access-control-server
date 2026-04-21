import { useQuery } from "@apollo/client";
import { Alert, Button, CardActionArea, Divider, Stack, Typography } from "@mui/material";
import { GET_THEMES } from "../../queries/themeQueries";
import { ServerThemeData } from "../../types/site_settings/MakeTheme";
import { useNavigate } from "react-router-dom";
import AddIcon from '@mui/icons-material/Add';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import { useMakeTheme } from "../../common/MakeThemeProvider";

export default function ThemeManagementPage() {
  const navigate = useNavigate();
  const makeTheme = useMakeTheme();

  const getThemesResult = useQuery(GET_THEMES);

  const themes: ServerThemeData[] = getThemesResult.data?.getThemes ?? [];

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
                <CardActionArea onClick={() => navigate(`/admin/themes/${serverTheme.key}`)} sx={{ padding: "15px 10px" }}>
                  <Stack direction={"row"} justifyContent={"space-between"}>
                    <Typography variant="subtitle1">{serverTheme.themeName}</Typography>
                    <ArrowForwardIosIcon
                      color="primary"
                    />
                  </Stack>
                </CardActionArea>
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