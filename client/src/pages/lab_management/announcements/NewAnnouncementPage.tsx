import { ChangeEvent, useState } from "react";
import { useMutation } from "@apollo/client/react";
import { GET_ANNOUNCEMENTS, CREATE_ANNOUNCEMENT } from "../../../queries/announcementsQueries";
import { Button, FormControlLabel, Grid, Stack, Switch, TextField, Typography } from "@mui/material";
import SaveIcon from "@mui/icons-material/Save";
import { useNavigate } from "react-router-dom";
import CloseIcon from "@mui/icons-material/Close";
import AnnouncementCard from "../../both/homepage/AnnouncementCard.js";
import { useMakeTheme } from "../../../common/MakeThemeProvider";

interface InputErrors {
  title?: boolean;
  description?: boolean;
  linkText?: boolean;
  linkUrl?: boolean;
}

export default function NewAnnouncementPage() {
  const navigate = useNavigate();
  const makeTheme = useMakeTheme();

  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [showLinkFields, setShowLinkFields] = useState(false);
  const [newLinkUrl, setNewLinkUrl] = useState("");
  const [newLinkText, setNewLinkText] = useState("");

  const [inputErrors, setInputErrors] = useState<InputErrors>({});

  const [createAnnouncement, mutation] = useMutation(CREATE_ANNOUNCEMENT);

  const handleHasLinkSwitch = (e: ChangeEvent<HTMLInputElement>) => {
    const checked = e.target.checked;
    setShowLinkFields(checked);
    if (!checked) {
      setNewLinkText("");
      setNewLinkUrl("");
    }
  };

  const normalizeUrl = (url: string) => {
    if (!url) return "";
    return /^https?:\/\//.test(url) ? url : "https://" + url;
  };

  const handleUrlBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const raw = e.target.value.trim();
    const normalized = normalizeUrl(raw);

    setNewLinkUrl(normalized);
  };

  const handleSaveClick = async () => {
    const updatedInputErrors: InputErrors = {
      title: !newTitle,
      description: !newDescription,
      linkText: showLinkFields && !newLinkText,
      linkUrl: showLinkFields && !newLinkUrl,
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
      <title>{`New Announcment | ${makeTheme.title}`}</title>
      <Typography variant="h5">New Announcement</Typography>
      <Stack direction="row" spacing={2}>
        <Stack spacing={2} flexGrow={1}>
          <TextField
            label="Name"
            value={newTitle ?? ""}
            error={inputErrors.title}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setNewTitle(e.target.value)}
          />
          <Stack direction="row" spacing={2}>
            <TextField
              label="Description"
              sx={{ flex: 1 }}
              type="string"
              value={newDescription ?? ""}
              error={inputErrors.description}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setNewDescription(e.target.value)}
              multiline
              minRows={3}
            />
          </Stack>
          <FormControlLabel
            control={<Switch checked={showLinkFields} onChange={handleHasLinkSwitch} />}
            label={<b>Link Button</b>}
            labelPlacement="top"
          />
          {showLinkFields && (
            <>
              <TextField
                label="Link Text"
                type="string"
                value={newLinkText ?? ""}
                error={inputErrors.linkText}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setNewLinkText(e.target.value)}
                required
              />
              <TextField
                helperText="Please enter a valid URL, including 'http://' or 'https://'. If you leave it out, we'll assume 'https://'."
                label="Link URL"
                type="string"
                value={newLinkUrl ?? ""}
                error={inputErrors.linkUrl}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setNewLinkUrl(e.target.value)}
                onBlur={handleUrlBlur}
                required
              />
            </>
          )}
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

      <Grid margin="10px" display="flex" justifyContent="center" alignItems="center">
        <Grid width="400px">
          <AnnouncementCard announcement={announcement} />
        </Grid>
      </Grid>
    </Stack>
  );
}
