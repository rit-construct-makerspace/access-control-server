import { ApolloClient, ApolloProvider, InMemoryCache } from "@apollo/client";
import { CssBaseline, ThemeProvider } from "@mui/material";
import { ThemeController } from "./types/site_settings/ThemeController";
import { IsMobileProvider } from "./common/IsMobileProvider";
import { ReactNode, useEffect, useState } from "react";
import { ToastContainer, Slide } from "react-toastify";
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFnsV2';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { SiteSettings } from "./types/site_settings/SiteSettings";

const apolloClient = new ApolloClient({
  uri: import.meta.env.VITE_GRAPHQL_URL ?? "http://localhost:3000/graphql",
  credentials: "include",
  cache: new InMemoryCache(),
});

export default function App(props: { siteSettings: SiteSettings, children: ReactNode }) {
  const [theme, setTheme] = useState(ThemeController.activeTheme.getTheme());

  ThemeController.addThemeWatcher(setTheme);

  useEffect(() => {
    // Executes once when client is loaded
    ThemeController.setActiveTheme(localStorage.getItem("themeMode") ?? "fallback")
  }, [])

  return (
    <ApolloProvider client={apolloClient}>
      <LocalizationProvider dateAdapter={AdapterDateFns}>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          <IsMobileProvider>
            <>
              {props.children}
              <ToastContainer position="bottom-left" transition={Slide} />
            </>
          </IsMobileProvider>
        </ThemeProvider>
      </LocalizationProvider>
    </ApolloProvider>
  );
}
