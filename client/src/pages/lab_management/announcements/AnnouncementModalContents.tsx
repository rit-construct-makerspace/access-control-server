import { ChangeEvent, useState } from "react";
import {
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { LoadingButton } from "@mui/lab";
import SaveIcon from "@mui/icons-material/Save";
import { Announcement } from "../../../queries/announcementsQueries";
import { useNavigate } from "react-router-dom";
import DeleteAnnouncementButton from "./button/DeleteAnnouncementButton";

interface InputErrors {
  title?: boolean;
  description?: boolean;
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
  
  const [inputErrors, setInputErrors] = useState<InputErrors>({});

  const handleStringChange =
    (property: keyof Announcement) =>
    (e: ChangeEvent<HTMLInputElement>) =>
      setAnnouncementDraft({ ...announcementDraft, [property]: e.target.value });

  const handleSaveClick = async () => {
    const updatedInputErrors: InputErrors = {
      title: !announcementDraft.title,
      description: !announcementDraft.description,
    };

    setInputErrors(updatedInputErrors);

    const hasInputErrors = Object.values(updatedInputErrors).some((e) => e);
    if (hasInputErrors) return;

    await onSave();

    navigate("/admin/announcements");
  };

  const handleDeleteClick = async () => {
    await onDelete()
    navigate("/admin/announcements");
  }

  const title = `${isNewAnnouncement ? "New" : "Edit"} Announcement`;

  return (
    <Stack padding="25px" spacing={2}>
      <Typography variant="h5">
        {title}
      </Typography>
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
        </Stack>
      </Stack>

      <Stack direction="row" justifyContent="flex-end" spacing={2}>
        {!isNewAnnouncement && (
          <Stack direction="row" spacing={2}>
            <DeleteAnnouncementButton 
              onDelete={handleDeleteClick}
            />
          </Stack>
        )}

        <LoadingButton
          loading={loading}
          size="large"
          variant="contained"
          color="success"
          startIcon={<SaveIcon />}
          sx={{ ml: "auto" }}
          onClick={handleSaveClick}
        >
          Save
        </LoadingButton>
      </Stack>
    </Stack>
  );
}
