import React from "react";
import { ApolloClient, ApolloProvider, InMemoryCache } from "@apollo/client";
import { CssBaseline, ThemeProvider } from "@mui/material";
import { CurrentUserProvider } from "./common/CurrentUserProvider";
import AppRoutes from "./AppRoutes";
import { BrowserRouter } from "react-router-dom";
import { theme } from "./Theme";
import { IsMobileProvider } from "./common/IsMobileProvider";

const apolloClient = new ApolloClient({
  uri: process.env.REACT_APP_GRAPHQL_URL ?? "https://localhost:3000/graphql",
  credentials: "include",
  cache: new InMemoryCache(),
});

export default function App() {
  return (
    <ApolloProvider client={apolloClient}>
      <ThemeProvider theme={theme}>
        <CssBaseline/>
        <BrowserRouter basename={ process.env.PUBLIC_URL }>
          <CurrentUserProvider>
            <IsMobileProvider>
              <AppRoutes />
            </IsMobileProvider>
          </CurrentUserProvider>
        </BrowserRouter>
      </ThemeProvider>
    </ApolloProvider>
  );
}
