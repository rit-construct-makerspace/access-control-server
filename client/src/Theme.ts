import { createTheme } from "@mui/material";

export const theme = createTheme({
    palette: {
        primary: {
            main: "#F76902",
            dark: "#F76902",
            contrastText: "#FFFFFF",
        },
        secondary: {
            main: "#7D55C7",
            contrastText: "#FFFFFF",
        },
        warning: {
            main: '#FFAB00',
        },
        mode: localStorage.getItem("themeMode") === "dark" ? "dark" : "light"
    },
    typography: {
        fontFamily: 'Roboto',
        subtitle1: {
            fontWeight: "bold",
        },
        body1: {
            fontWeight: undefined,
        },
    },
});
