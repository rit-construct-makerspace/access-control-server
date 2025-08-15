import { Button, Stack, TextField, Typography } from "@mui/material";
import FileUploadButton from "../../common/FileUploadButton";
import ZoneCard from "../both/homepage/ZoneCard";
import { useIsMobile } from "../../common/IsMobileProvider";
import ZoneHours from "../../types/ZoneHours";
import SaveIcon from '@mui/icons-material/Save';
import { useEffect, useState } from "react";
import { useMutation } from "@apollo/client";
import { UPDATE_ZONE } from "../../queries/zoneQueries";
import { toast } from "react-toastify";

interface MakerspaceInforamtionProps {
  id: number;
  name: string;
  hours: ZoneHours[];
  imageUrl: string;
}

export default function ManageMakerspaceInformation(props: MakerspaceInforamtionProps) {
  const isMobile = useIsMobile();

  const [updateZone] = useMutation(UPDATE_ZONE, { refetchQueries: ["GetZoneByID"] });

  const [zoneName, setZoneName] = useState(props.name);
  const [imgUrl, setImgUrl] = useState(props.imageUrl);

  const handleUpdateZone = async () => {
    await updateZone({
      variables: { id: props.id, name: zoneName, imageUrl: imgUrl },
      onCompleted() {
        toast.success("Updated makerspace");
      },
      onError(error) {
        toast.error(`Failed to update zone: ${error.message}`);
      },
    });
  };

  useEffect(() => {
    if (imgUrl !== props.imageUrl) {
      handleUpdateZone();
    }
  }, [imgUrl])

  return (
    <Stack spacing={3} alignItems={"center"}>
      <Typography variant="h5" fontWeight={"bold"} alignSelf={"flex-start"}>Makerspace Information</Typography>
      <ZoneCard
        id={props.id}
        name={zoneName}
        hours={props.hours}
        imageUrl={imgUrl}
        isMobile={isMobile}
      />
      <Stack direction={"row"} spacing={2} width={"100%"} alignItems={"center"} justifyContent={"center"}>
        <TextField label="Name" value={zoneName} onChange={(e) => (setZoneName(e.target.value))} sx={{ width: "50%" }} />
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
          onClick={() => { if (zoneName !== props.name) handleUpdateZone(); }}
        >
          Save
        </Button>
      </Stack>
    </Stack>
  );
}