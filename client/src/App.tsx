import { ApolloClient, ApolloProvider, NormalizedCacheObject } from "@apollo/client";
import { CssBaseline, ThemeProvider } from "@mui/material";
import { ThemeController } from "./types/site_settings/ThemeController";
import { IsMobileProvider } from "./common/IsMobileProvider";
import { ReactNode, useEffect, useState } from "react";
import { ToastContainer, Slide } from "react-toastify";
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFnsV2';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { SiteSettings } from "./types/site_settings/SiteSettings";
import { MakeTheme } from "./types/site_settings/MakeTheme";
import { MakeThemeProvider } from "./common/MakeThemeProvider";

export default function App(props: { siteSettings: SiteSettings, children: ReactNode, apolloClient: ApolloClient<NormalizedCacheObject> }) {
  const [theme, setTheme] = useState(ThemeController.activeTheme.getTheme());

  ThemeController.addThemeWatcher(setTheme);
  props.siteSettings.themes.map((theme) => ThemeController.registerTheme(theme.key, new MakeTheme(theme)))

  useEffect(() => {
    // Executes once when client is loaded
    ThemeController.setActiveTheme(localStorage.getItem("themeMode") ?? "")
  }, [])

  return (
    <ApolloProvider client={props.apolloClient}>
      <LocalizationProvider dateAdapter={AdapterDateFns}>
        <MakeThemeProvider>
          <ThemeProvider theme={theme}>
            <CssBaseline />
            <IsMobileProvider>
              <>
                {props.children}
                <ToastContainer position="bottom-left" transition={Slide} />
              </>
            </IsMobileProvider>
          </ThemeProvider>
        </MakeThemeProvider>
      </LocalizationProvider>
    </ApolloProvider>
  );
}
