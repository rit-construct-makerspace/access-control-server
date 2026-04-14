import { ApolloClient, ApolloProvider, InMemoryCache } from "@apollo/client";
import { CssBaseline, ThemeProvider } from "@mui/material";
import { RouterProvider } from "react-router-dom";
import { ThemeController } from "./Theme";
import { IsMobileProvider } from "./common/IsMobileProvider";
import { useState } from "react";
import { appRouter } from "./AppRouter";
import { ToastContainer, Slide } from "react-toastify";
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFnsV2';
import { LocalizationProvider } from '@mui/x-date-pickers';

const apolloClient = new ApolloClient({
  uri: import.meta.env.VITE_GRAPHQL_URL ?? "http://localhost:3000/graphql",
  credentials: "include",
  cache: new InMemoryCache(),
});

export default function App(props: { siteSettings: any }) {
  const [theme, setTheme] = useState(ThemeController.activeTheme.getTheme());

  ThemeController.addThemeWatcher(setTheme);

  return (
    <ApolloProvider client={apolloClient}>
      <LocalizationProvider dateAdapter={AdapterDateFns}>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          <IsMobileProvider>
            <>
              <RouterProvider router={appRouter} />
              <ToastContainer position="bottom-left" transition={Slide} />
            </>
          </IsMobileProvider>
        </ThemeProvider>
      </LocalizationProvider>
    </ApolloProvider>
  );
}
