import { Button, ButtonOwnProps, Input, styled, Typography } from "@mui/material";
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import { height } from "@mui/system";

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
  color: ButtonOwnProps["color"] | undefined;
  variant: ButtonOwnProps["variant"] | undefined;
  text: string | undefined
  onUpload: (name: string) => void;
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
      body: await files[0].bytes()
    });

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