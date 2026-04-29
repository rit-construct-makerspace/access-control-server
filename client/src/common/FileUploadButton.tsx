import { Button, ButtonOwnProps, styled, SxProps } from "@mui/material";
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import { toast } from "react-toastify";

const VisuallyHiddenInput = styled('input')({
  clip: 'rect(0 0 0 0)',
  clipPath: 'inset(50%)',
  height: 1,
  overflow: 'hidden',
  position: 'absolute',
  bottom: 0,
  left: 0,
  whiteSpace: 'nowrap',
  width: 1,
});

interface FileUploadProps {
  color?: ButtonOwnProps["color"];
  variant?: ButtonOwnProps["variant"];
  text?: string;
  onUpload: (name: string) => void;
  width?: string;
  sx?: SxProps;
}

export default function FileUploadButton(props: FileUploadProps) {

  async function handleUpload(files: FileList | null) {
    if (files === null || files.length < 1) {
      return;
    }
    const response = await fetch(import.meta.env.VITE_ORIGIN + "/api/uploads/web-content", {
      method: "POST",
      headers: {
        "Content-Type": "application/octet-stream"
      },
      body: new Uint8Array(await files[0].arrayBuffer())
    });

    if (response.status !== 201) {
      toast.error(`Failed to upload image: Code ${response.status}`, {
        position: "bottom-left",
      });
    } else {
      toast.success("Image Uploaded", {
        position: "bottom-left",
      });
    }

    props.onUpload(await response.text());
  }

  return (
    <Button
      color={props.color}
      component="label"
      role={undefined}
      variant={props.variant}
      tabIndex={-1}
      startIcon={<CloudUploadIcon />}
      sx={{
        width: props.width,
        ...props.sx
      }}
    >
      {props.text ?? "Upload files"}
      <VisuallyHiddenInput
        type="file"
        onChange={(event) => handleUpload(event.target.files)}
        multiple={false}
      />
    </Button>
  )
}