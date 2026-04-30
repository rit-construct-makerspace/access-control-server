import { Button, Stack, TextField, Typography } from "@mui/material";
import FileUploadButton from "../../common/FileUploadButton";
import MakerspaceCard from "../both/homepage/MakerspaceCard";
import { useIsMobile } from "../../common/IsMobileProvider";
import MakerspaceHours from "../../types/MakerspaceHours";
import SaveIcon from '@mui/icons-material/Save';
import { useCallback, useEffect, useState } from "react";
import { useMutation } from "@apollo/client/react";
import { UPDATE_MAKERSPACE } from "../../queries/makerspaceQueries";
import { toast } from "react-toastify";

interface MakerspaceInforamtionProps {
  id: number;
  name: string;
  subtitle: string | null;
  location: string | null;
  hours: MakerspaceHours[];
  imageUrl: string;
  docsLink: string;
  description: string;
}

export default function ManageMakerspaceInformation(props: MakerspaceInforamtionProps) {
  const isMobile = useIsMobile();

  const [updateMakerspace] = useMutation(UPDATE_MAKERSPACE, { refetchQueries: ["GetMakerspaceByID"] });

  const [makerspaceName, setMakerspaceName] = useState(props.name);
  const [makerspaceSubtitle, setMakerspaceSubtitle] = useState(props.subtitle ?? "");
  const [makerspaceLocation, setMakerspaceLocation] = useState(props.location ?? "");
  const [imgUrl, setImgUrl] = useState(props.imageUrl);
  const [docsLink, setDocsLink] = useState(props.docsLink);
  const [description, setDescription] = useState(props.description);

  const handleUpdateMakerspace = useCallback(async () => {
    await updateMakerspace({
      variables: { id: props.id, name: makerspaceName, subtitle: makerspaceSubtitle, location: makerspaceLocation, imageUrl: imgUrl, docsLink: docsLink, description: description },
      onCompleted() {
        toast.success("Updated makerspace");
      },
      onError(error) {
        toast.error(`Failed to update makerspace: ${error.message}`);
      },
    });
  }, [updateMakerspace, props, makerspaceName, makerspaceSubtitle, makerspaceLocation, imgUrl, docsLink, description]);

  useEffect(() => {
    if (imgUrl !== props.imageUrl) {
      handleUpdateMakerspace();
    }
  }, [props.imageUrl, imgUrl, handleUpdateMakerspace])

  return (
    <Stack spacing={3} alignItems={"center"} width={isMobile ? "100%" : undefined}>
      <Typography variant="h5" fontWeight={"bold"} alignSelf={"flex-start"}>Makerspace Information</Typography>
      <MakerspaceCard
        id={props.id}
        name={makerspaceName}
        subtitle={makerspaceSubtitle}
        location={makerspaceLocation}
        hours={props.hours}
        imageUrl={imgUrl}
        isMobile={isMobile}
        clickable={false}
      />
      <Stack direction={isMobile ? "column" : "row"} spacing={2} width={"100%"} alignItems={"center"} justifyContent={"center"}>
        <TextField label="Name" value={makerspaceName} onChange={(e) => (setMakerspaceName(e.target.value))} sx={{ width: isMobile ? "100%" : "50%" }} />
        <FileUploadButton
          variant="contained"
          text="Upload Image"
          color="info"
          onUpload={(fileName: string) => setImgUrl(fileName)}
          width={isMobile ? "100%" : undefined}
        />
        <Button
          color="primary"
          variant="contained"
          startIcon={<SaveIcon />}
          onClick={() => {
            const changed = makerspaceName !== props.name || makerspaceLocation !== props.location || makerspaceSubtitle !== props.subtitle || docsLink !== props.docsLink || description !== props.description;
            if (changed) handleUpdateMakerspace();
          }}
          fullWidth={isMobile}
        >
          Save
        </Button>
      </Stack>
      <TextField
        label="Subtitle"
        value={makerspaceSubtitle}
        onChange={(e) => (setMakerspaceSubtitle(e.target.value))}
        sx={{ width: isMobile ? "100%" : "90%" }}
      />
      <TextField
        label="Location"
        value={makerspaceLocation}
        onChange={(e) => (setMakerspaceLocation(e.target.value))}
        sx={{ width: isMobile ? "100%" : "90%" }}
      />
      <TextField
        label="Docs URL"
        value={docsLink}
        onChange={(e) => (setDocsLink(e.target.value))}
        sx={{ width: isMobile ? "100%" : "90%" }}
      />
      <TextField
        multiline
        label="Description (Supports Markdown)"
        value={description}
        onChange={(e) => (setDescription(e.target.value))}
        sx={{ width: isMobile ? "100%" : "90%" }}
      />
    </Stack>
  );
}