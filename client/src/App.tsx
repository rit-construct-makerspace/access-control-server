import { ApolloClient, ApolloProvider, InMemoryCache } from "@apollo/client";
import { CssBaseline, ThemeProvider } from "@mui/material";
import { RouterProvider } from "react-router-dom";
import { ThemeController } from "./Theme";
import { IsMobileProvider } from "./common/IsMobileProvider";
import { useState } from "react";
import { appRouter } from "./AppRouter";
import { ToastContainer, Slide } from "react-toastify";

const apolloClient = new ApolloClient({
  uri: import.meta.env.VITE_GRAPHQL_URL ?? "http://localhost:3000/graphql",
  credentials: "include",
  cache: new InMemoryCache(),
});

export default function App() {
  const [theme, setTheme] = useState(ThemeController.activeTheme.getTheme());

  ThemeController.addThemeWatcher(setTheme);

  return (
    <ApolloProvider client={apolloClient}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
          <IsMobileProvider>
            <>
              <RouterProvider router={appRouter} />
              <ToastContainer position="bottom-left" transition={Slide} />
            </>
          </IsMobileProvider>
      </ThemeProvider>
    </ApolloProvider>
  );
}
