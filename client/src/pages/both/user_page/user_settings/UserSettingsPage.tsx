import { useCurrentUser } from "../../../../common/CurrentUserProvider";
import { Avatar, Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, Divider, Grid, IconButton, Stack, TextField, Typography } from "@mui/material";
import { useMutation, useQuery } from "@apollo/client/react";
import InfoBlob from "../../../lab_management/users/InfoBlob";
import EditIcon from '@mui/icons-material/Edit';
import { useState } from "react";
import RequestWrapper2 from "../../../../common/RequestWrapper2";
import { stringAvatar } from "../../../../common/avatarGenerator";
import ThemeToggle from "../../../../common/ThemeToggle";
import { GET_USER, UPDATE_STUDENT_PROFILE } from "../../../../queries/userQueries";
import { useIsMobile } from "../../../../common/IsMobileProvider";
import { useMakeTheme } from "../../../../common/MakeThemeProvider";

export default function UserSettingsPage() {
    const currentUser = useCurrentUser();
    const makeTheme = useMakeTheme();

    const userResult = useQuery(GET_USER, { variables: { id: currentUser.id } });
    const [updateStudentProfile] = useMutation(UPDATE_STUDENT_PROFILE);

    const [editInfo, setEditInfo] = useState(false);
    const [pronouns, setPronouns] = useState("");

    function handleSubmit() {
        setEditInfo(false);
        updateStudentProfile({
            variables: {
                userID: currentUser.id,
                pronouns,
                college: userResult.data?.user.college,
                expectedGraduation: userResult.data?.user.expectedGraduation
            },
            refetchQueries: [{ query: GET_USER, variables: { id: currentUser.id } }],
        });
    }

    const isMobile = useIsMobile();

    return (
        <Stack margin={isMobile ? "10px" : "30px"} width={isMobile ? "fit-content" : "auto"} spacing={2} divider={<Divider orientation="horizontal" flexItem />}>
            <title>{`User Settings | ${makeTheme.title}`}</title>
            {/* Personal info */}
            <RequestWrapper2 result={userResult} render={({ user }) => {

                if (pronouns === "") {
                    setPronouns(user.pronouns)
                }

                function handleOpen() {
                    setEditInfo(true);
                }

                function handleClose() {
                    setEditInfo(false);
                    setPronouns(user.pronouns);
                }

                return (
                    <Stack spacing={1}>
                        <Stack direction="row" alignItems="center" spacing={2}>
                            <Stack direction="row" spacing={2} alignItems="center">
                                <Avatar
                                    alt={`Profile Picture for ${user.firstName} ${user.lastName}`}
                                    {
                                    ...stringAvatar(
                                        user.firstName,
                                        user.lastName,
                                        { width: "60px", height: "60px", fontSize: 28 }
                                    )
                                    }
                                />
                                <Typography variant={isMobile ? "h5" : "h3"}>{user.firstName} {user.lastName} ({user.ritUsername})</Typography>
                            </Stack>
                            <IconButton aria-label="edit information" onClick={handleOpen}>
                                <EditIcon sx={{ width: "30px", height: "30px", color: "gray" }} />
                            </IconButton>
                            <Dialog open={editInfo} onClose={handleClose}>
                                <DialogTitle>Edit Personal Information</DialogTitle>
                                <DialogContent>
                                    <DialogContentText>
                                        Currently, only a limited amount of information can be edited.
                                    </DialogContentText>
                                    <TextField
                                        id="pronouns"
                                        name="pronouns"
                                        label="Pronouns"
                                        fullWidth
                                        variant="standard"
                                        defaultValue={pronouns}
                                        onChange={(e) => setPronouns(e.target.value)}
                                    />
                                </DialogContent>
                                <DialogActions>
                                    <Button onClick={handleClose}>Cancel</Button>
                                    <Button onClick={handleSubmit}>Submit</Button>
                                </DialogActions>
                            </Dialog>
                        </Stack>
                        <Grid container justifyContent="space-around" maxWidth={isMobile ? undefined : "750px"}>
                            <Grid minWidth="155px">
                                <InfoBlob label="Pronous" value={pronouns} />
                            </Grid>
                            <Grid minWidth="155px">
                                <InfoBlob label="College" value={user.college} />
                            </Grid>
                            <Grid minWidth="155px">
                                <InfoBlob label="Expected Graduation" value={user.expectedGraduation} />
                            </Grid>
                        </Grid>
                        <InfoBlob label="Member Since" value={user.registrationDate.slice(0, 10)} />
                    </Stack>
                );
            }} />

            {/* Appearence (Dark Mode toggle) */}
            <Stack spacing={1}>
                <Typography variant="h3">Appearance</Typography>
                <ThemeToggle />
            </Stack>
        </Stack>
    );
}