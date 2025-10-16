import { useState } from "react";
import { useMutation } from "@apollo/client";
import { GET_ANNOUNCEMENTS, CREATE_ANNOUNCEMENT } from "../../../queries/announcementsQueries";
import { Box, Button, FormControlLabel, Stack, Switch, TextField, Typography } from "@mui/material";
import SaveIcon from "@mui/icons-material/Save";
import { useNavigate } from "react-router-dom";
import CloseIcon from "@mui/icons-material/Close";
import AnnouncementCard from "../../both/homepage/AnnouncementCard.js";

interface InputErrors {
  title?: boolean;
  description?: boolean;
  linkText?: boolean;
  linkUrl?: boolean;
}

export default function NewAnnouncementPage() {
  const navigate = useNavigate();

  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [hasLinkButton, setHasLinkButton] = useState(false);
  const [newLinkUrl, setNewLinkUrl] = useState("");
  const [newLinkText, setNewLinkText] = useState("");

  const [inputErrors, setInputErrors] = useState<InputErrors>({});

  const [createAnnouncement, mutation] = useMutation(CREATE_ANNOUNCEMENT);

  const handleSaveClick = async () => {
    const updatedInputErrors: InputErrors = {
      title: !newTitle,
      description: !newDescription,
      linkText: hasLinkButton && !newLinkText,
      linkUrl: hasLinkButton && !newLinkUrl,
    };

    setInputErrors(updatedInputErrors);

    const hasInputErrors = Object.values(updatedInputErrors).some((e) => e);
    if (hasInputErrors) return;

    createAnnouncement({
      variables: {
        title: newTitle,
        description: newDescription,
        linkText: newLinkText,
        linkUrl: newLinkUrl,
      },
      refetchQueries: [
        { query: GET_ANNOUNCEMENTS },
        //{ query: GET_ANNOUNCEMENT, variables: { id: announcementID } },
      ],
      onCompleted: () => navigate("/admin/announcements"),
    });
  };

  const announcement: any = {
    title: newTitle,
    description: newDescription,
    linkText: newLinkText,
    linkUrl: newLinkUrl,
  };

  return (
    <Stack padding={"25px"} spacing={2}>
      <title>New Announcment | Make @ RIT</title>
      <Typography variant="h5">New Announcement</Typography>

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
          <FormControlLabel
            control={<Switch checked={hasLinkButton} onChange={(e) => setHasLinkButton(e.target.checked)} />}
            label={<b>Link Button</b>}
            labelPlacement="top"
          />
          {hasLinkButton ? (
            <>
              <TextField
                label="Link Text"
                type="string"
                value={newLinkText ?? ""}
                error={inputErrors.linkText}
                onChange={(e: any) => setNewLinkText(e.target.value)}
                required
              />
              <TextField
                label="Link URL"
                type="string"
                value={newLinkUrl ?? ""}
                error={inputErrors.linkUrl}
                onChange={(e: any) => setNewLinkUrl(e.target.value)}
                required
              />
            </>
          ) : null}
        </Stack>
      </Stack>

      <Stack direction="row" justifyContent="flex-end" spacing={2}>
        <Button
          startIcon={<CloseIcon />}
          variant="contained"
          color="error"
          onClick={() => navigate("/admin/announcements")}
        >
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

      <Stack justifyContent={"center"} alignItems={"center"}>
        <Box width={"100%"} height={"min-content"} justifyContent={"center"} display={"grid"}>
          <AnnouncementCard announcement={announcement} />
        </Box>
      </Stack>
    </Stack>
  );
}
