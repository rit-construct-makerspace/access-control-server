import { useState } from "react";
import { useMutation } from "@apollo/client";
import { GET_ANNOUNCEMENTS, CREATE_ANNOUNCEMENT } from "../../../queries/announcementsQueries";
import { Button, Stack, TextField, Typography } from "@mui/material";
import LoadingButton from "@mui/lab/LoadingButton";
import SaveIcon from "@mui/icons-material/Save";
import { useNavigate } from "react-router-dom";
import CloseIcon from '@mui/icons-material/Close';


interface InputErrors {
    title?: boolean;
    description?: boolean;
  }

export default function NewAnnouncementPage() {

    const navigate = useNavigate();


    const [newTitle, setNewTitle] = useState('');
    const [newDescription, setNewDescription] = useState('');

    const [inputErrors, setInputErrors] = useState<InputErrors>({});

    const [createAnnouncement, mutation] = useMutation(CREATE_ANNOUNCEMENT);

    const handleSaveClick = async () => {
        const updatedInputErrors: InputErrors = {
            title: !newTitle,
            description: !newDescription,
        };
    
        setInputErrors(updatedInputErrors);
    
        const hasInputErrors = Object.values(updatedInputErrors).some((e) => e);
        if (hasInputErrors) return;
    
        createAnnouncement({
            variables: {
                title: newTitle,
                description: newDescription,
            },
            refetchQueries: [
                { query: GET_ANNOUNCEMENTS },
                //{ query: GET_ANNOUNCEMENT, variables: { id: announcementID } },
            ],
            onCompleted: () => navigate("/admin/announcements"),
        });
    };

    return (
        <Stack padding={"25px"} spacing={2}>
            <title>New Announcment | Make @ RIT</title>
            <Typography variant="h5">
                New Announcement
            </Typography>
            <Stack direction="row" spacing={2}>
                <Stack spacing={2} flexGrow={1}>
                    <TextField
                        label="Name"
                        value={newTitle ?? ""}
                        error={inputErrors.title}
                        onChange={(e) => setNewTitle(e.target.value)}
                    />
                    <Stack direction="row" spacing={2}>
                        <TextField
                            label="Description"
                            sx={{ flex: 1 }}
                            type="string"
                            value={newDescription ?? ""}
                            error={inputErrors.description}
                            onChange={(e) => setNewDescription(e.target.value)}
                            multiline
                            minRows={3}
                        />
                    </Stack>
                </Stack>
            </Stack>

            <Stack direction="row" justifyContent="flex-end" spacing={2}>
                <Button startIcon={<CloseIcon/>} variant="contained" color="error" onClick={() => navigate("/admin/announcements")}>
                    Cancel
                </Button>

                <Button
                    loading={mutation.loading}
                    size="large"
                    variant="contained"
                    color="success"
                    startIcon={<SaveIcon />}
                    sx={{ ml: "auto" }}
                    onClick={handleSaveClick}
                >
                    Save
                </Button>
            </Stack>
        </Stack>
    );
}
