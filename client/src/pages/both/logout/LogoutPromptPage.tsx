import Page from "../../Page";
import {Button, Typography} from "@mui/material";
import {useCallback} from "react";
import {redirect} from "react-router-dom";

export default function LogoutPromptPage() {
    const logout = useCallback(() => {
        fetch("/logout", {
            mode: 'cors',
            method: 'POST',
            credentials: 'include',
            redirect: 'follow'
        })
            .then(() => {
                //reload is needed to force logout user, in the future should make this happen in a better way
                //possibly redirect to login page?

            })
            .catch(function(err) {
                console.info(err);
            });
        redirect("https://shibboleth.main.ad.rit.edu/logout.html");
    }, []);


    return (
        <Page title="Logout" maxWidth="1250px">


            <Typography variant={"h5"} style={{ color: "grey" }}>Are you sure you would like to logout?</Typography>

            <Button onClick={logout}>
                Logout
            </Button>


        </Page>
    );
}
