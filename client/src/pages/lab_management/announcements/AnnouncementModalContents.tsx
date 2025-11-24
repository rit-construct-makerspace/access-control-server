import React, { ChangeEvent, useEffect, useState } from "react";
import { Button, FormControlLabel, Grid, Stack, Switch, TextField, Typography } from "@mui/material";
import SaveIcon from "@mui/icons-material/Save";
import { Announcement } from "../../../queries/announcementsQueries";
import { useNavigate } from "react-router-dom";
import DeleteAnnouncementButton from "./button/DeleteAnnouncementButton";
import AnnouncementCard from "../../both/homepage/AnnouncementCard.js";
import { toast } from "react-toastify";

interface InputErrors {
  title?: boolean;
  description?: boolean;
  linkText?: boolean;
  linkUrl?: boolean;
}

interface AnnouncementPageProps {
  isNewAnnouncement: boolean;
  announcementDraft: Partial<Announcement>;
  setAnnouncementDraft: (i: Partial<Announcement>) => void;
  onSave: () => void;
  onDelete: () => void;
  loading: boolean;
}

export default function AnnouncementModalContents({
  isNewAnnouncement,
  announcementDraft,
  setAnnouncementDraft,
  onSave,
  onDelete,
  loading,
}: AnnouncementPageProps) {
  const navigate = useNavigate();

  const [showLinkFields, setShowLinkFields] = useState(!!announcementDraft.linkUrl || !!announcementDraft.linkText);
  useEffect(() => {
    setShowLinkFields(Boolean(announcementDraft.linkUrl || announcementDraft.linkText));
  }, [announcementDraft.linkUrl, announcementDraft.linkText]);

  const [inputErrors, setInputErrors] = useState<InputErrors>({});

  const handleStringChange = (property: keyof Announcement) => (e: ChangeEvent<HTMLInputElement>) =>
    setAnnouncementDraft({ ...announcementDraft, [property]: e.target.value });

  const handleHasLinkSwitch = (e: ChangeEvent<HTMLInputElement>) => {
    const checked = e.target.checked;
    setShowLinkFields(checked);
    if (!checked) {
      setAnnouncementDraft({
        ...announcementDraft,
        linkText: "",
        linkUrl: "",
      });
    }
  };

  const normalizeUrl = (url: string) => {
    if (!url) return "";
    return /^https?:\/\//.test(url) ? url : "https://" + url;
  };

  const handleUrlBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const raw = e.target.value.trim();
    const normalized = normalizeUrl(raw);

    setAnnouncementDraft({ ...announcementDraft, linkUrl: normalized });
  };

  const handleSaveClick = async () => {
    const updatedInputErrors: InputErrors = {
      title: !announcementDraft.title,
      description: !announcementDraft.description,
      linkText: showLinkFields && !announcementDraft.linkText,
      linkUrl: showLinkFields && !announcementDraft.linkUrl,
    };

    setInputErrors(updatedInputErrors);

    const hasInputErrors = Object.values(updatedInputErrors).some((e) => e);
    if (hasInputErrors) return;

    try {
      await onSave();
      navigate("/admin/announcements");
    } catch (error) {
      toast.error("Failed to save announcement. " + (error instanceof Error ? error.message : ""));
    }
  };

  const handleDeleteClick = async () => {
    try {
      await onDelete();
      navigate("/admin/announcements");
    } catch (error) {
      toast.error("Failed to delete announcement." + (error instanceof Error ? error.message : ""));
    }
  };

  const title = `${isNewAnnouncement ? "New" : "Edit"} Announcement`;

  return (
    <Stack padding="25px" spacing={2}>
      <Typography variant="h5">{title}</Typography>
      <Stack direction="row" spacing={2}>
        <Stack spacing={2} flexGrow={1}>
          <TextField
            label="Name"
            value={announcementDraft.title ?? ""}
            error={inputErrors.title}
            onChange={handleStringChange("title")}
          />
          <Stack direction="row" spacing={2}>
            <TextField
              label="Description"
              sx={{ flex: 1 }}
              type="string"
              value={announcementDraft.description ?? ""}
              error={inputErrors.description}
              onChange={handleStringChange("description")}
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
                value={announcementDraft.linkText ?? ""}
                error={inputErrors.linkText}
                onChange={handleStringChange("linkText")}
                required
              />
              <TextField
                helperText="Please enter a valid URL, including 'http://' or 'https://'. If you leave it out, we'll assume 'https://'."
                label="Link URL"
                type="url"
                value={announcementDraft.linkUrl ?? ""}
                error={inputErrors.linkUrl}
                onChange={handleStringChange("linkUrl")}
                onBlur={handleUrlBlur}
                required
              />
            </>
          )}
        </Stack>
      </Stack>

      <Stack direction="row" justifyContent="flex-end" spacing={2}>
        {!isNewAnnouncement && (
          <Stack direction="row" spacing={2}>
            <DeleteAnnouncementButton onDelete={handleDeleteClick} />
          </Stack>
        )}

        <Button
          loading={loading}
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
          <AnnouncementCard announcement={announcementDraft} />
        </Grid>
      </Grid>
    </Stack>
  );
}
