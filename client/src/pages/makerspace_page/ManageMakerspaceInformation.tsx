import { Button, Stack, TextField, Typography } from "@mui/material";
import FileUploadButton from "../../common/FileUploadButton";
import ZoneCard from "../both/homepage/ZoneCard";
import { useIsMobile } from "../../common/IsMobileProvider";
import ZoneHours from "../../types/ZoneHours";
import SaveIcon from '@mui/icons-material/Save';

interface MakerspaceInforamtionProps {
  id: number;
  name: string;
  setName: (name: string) => void;
  hours: ZoneHours[];
  imageUrl: string;
  setImageUrl: (url: string) => void;
  updateZone: () => void;
}

export default function ManageMakerspaceInformation(props: MakerspaceInforamtionProps) {
  const isMobile = useIsMobile();

  return (
    <Stack spacing={3} alignItems={"center"}>
      <Typography variant="h5" fontWeight={"bold"} alignSelf={"flex-start"}>Makerspace Information</Typography>
      <ZoneCard
        id={props.id}
        name={props.name}
        hours={props.hours}
        imageUrl={props.imageUrl}
        isMobile={isMobile}
      />
      <Stack direction={"row"} spacing={2} width={"100%"} alignItems={"center"} justifyContent={"center"}>
        <TextField label="Name" value={props.name} onChange={(e) => (props.setName(e.target.value))} sx={{ width: "50%" }} />
        <FileUploadButton
          variant="contained"
          text="Upload Image"
          color="info"
          onUpload={(fileName: string) => { props.setImageUrl(fileName); props.updateZone(); }}
        />
        <Button
          color="primary"
          variant="contained"
          startIcon={<SaveIcon />}
          onClick={props.updateZone}
        >
          Save
        </Button>
      </Stack>
    </Stack>
  );
}