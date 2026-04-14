import { ApolloClient, ApolloProvider, InMemoryCache } from "@apollo/client";
import { CssBaseline, ThemeProvider } from "@mui/material";
import { ThemeController } from "./Theme";
import { IsMobileProvider } from "./common/IsMobileProvider";
import { ReactNode, useState } from "react";
import { ToastContainer, Slide } from "react-toastify";
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFnsV2';
import { LocalizationProvider } from '@mui/x-date-pickers';
import ClientOnly from "./common/ClientOnly";

const apolloClient = new ApolloClient({
  uri: import.meta.env.VITE_GRAPHQL_URL ?? "http://localhost:3000/graphql",
  credentials: "include",
  cache: new InMemoryCache(),
});

export default function App(props: { siteSettings: any, children: ReactNode }) {
  const [theme, setTheme] = useState(ThemeController.activeTheme.getTheme());

  ThemeController.addThemeWatcher(setTheme);

  console.log(props.siteSettings)

  return (
    <ApolloProvider client={apolloClient}>
      <LocalizationProvider dateAdapter={AdapterDateFns}>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          <ClientOnly fallback="isMobile requires window">
            <IsMobileProvider>
              <>
                {props.children}
                <ToastContainer position="bottom-left" transition={Slide} />
              </>
            </IsMobileProvider>
          </ClientOnly>
        </ThemeProvider>
      </LocalizationProvider>
    </ApolloProvider>
  );
}
