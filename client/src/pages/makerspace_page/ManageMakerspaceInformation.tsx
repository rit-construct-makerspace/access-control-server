import { Button, Stack, TextField, Typography } from "@mui/material";
import FileUploadButton from "../../common/FileUploadButton";
import MakerspaceCard from "../both/homepage/MakerspaceCard";
import { useIsMobile } from "../../common/IsMobileProvider";
import MakerspaceHours from "../../types/MakerspaceHours";
import SaveIcon from '@mui/icons-material/Save';
import { useEffect, useState } from "react";
import { useMutation } from "@apollo/client";
import { UPDATE_MAKERSPACE } from "../../queries/makerspaceQueries";
import { toast } from "react-toastify";

interface MakerspaceInforamtionProps {
  id: number;
  name: string;
  hours: MakerspaceHours[];
  imageUrl: string;
}

export default function ManageMakerspaceInformation(props: MakerspaceInforamtionProps) {
  const isMobile = useIsMobile();

  const [updateMakerspace] = useMutation(UPDATE_MAKERSPACE, { refetchQueries: ["GetMakerspaceByID"] });

  const [makerspaceName, setMakerspaceName] = useState(props.name);
  const [imgUrl, setImgUrl] = useState(props.imageUrl);

  const handleUpdateMakerspace = async () => {
    await updateMakerspace({
      variables: { id: props.id, name: makerspaceName, imageUrl: imgUrl },
      onCompleted() {
        toast.success("Updated makerspace");
      },
      onError(error) {
        toast.error(`Failed to update makerspace: ${error.message}`);
      },
    });
  };

  useEffect(() => {
    if (imgUrl !== props.imageUrl) {
      handleUpdateMakerspace();
    }
  }, [imgUrl])

  return (
    <Stack spacing={3} alignItems={"center"}>
      <Typography variant="h5" fontWeight={"bold"} alignSelf={"flex-start"}>Makerspace Information</Typography>
      <MakerspaceCard
        id={props.id}
        name={makerspaceName}
        hours={props.hours}
        imageUrl={imgUrl}
        isMobile={isMobile}
        clickable={false}
      />
      <Stack direction={"row"} spacing={2} width={"100%"} alignItems={"center"} justifyContent={"center"}>
        <TextField label="Name" value={makerspaceName} onChange={(e) => (setMakerspaceName(e.target.value))} sx={{ width: "50%" }} />
        <FileUploadButton
          variant="contained"
          text="Upload Image"
          color="info"
          onUpload={(fileName: string) => setImgUrl(fileName)}
        />
        <Button
          color="primary"
          variant="contained"
          startIcon={<SaveIcon />}
          onClick={() => { if (makerspaceName !== props.name) handleUpdateMakerspace(); }}
        >
          Save
        </Button>
      </Stack>
    </Stack>
  );
}