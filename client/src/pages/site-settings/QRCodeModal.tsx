import QRCode from "react-qr-code";
import PrettyModal from "../../common/PrettyModal";
import { Button, Stack, Typography } from "@mui/material";
import { useRef } from "react";


export default function QRCodeModal(props: {
  open: boolean,
  onClose: () => void,
  link: string
}) {

  const svgRef = useRef(null);

  function copyQRCode() {
    const svg = svgRef.current;
    if (svg === null) { return; }
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();

    const svgBlob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(svgBlob);

    img.onload = () => {
      // Set canvas dimensions to match SVG
      canvas.width = img.width;
      canvas.height = img.height;
      if (ctx === null) { return; }
      ctx.drawImage(img, 0, 0);

      // Copy to clipboard as a PNG
      canvas.toBlob((blob) => {
        if (blob === null) { return; }
        const item = new ClipboardItem({ "image/png": blob });
        navigator.clipboard.write([item]);
      });

      URL.revokeObjectURL(url);
    };

    img.src = url;
  }

  return (
    <PrettyModal open={props.open} onClose={props.onClose} width={"max-content"}>
      <Stack spacing={2} width={"max-content"} alignItems={"center"}>
        <Stack direction={"row"} justifyContent={"space-between"} alignItems={"center"} width={"100%"}>
          <Typography color="primary" variant="h4">{`/${props.link}`}</Typography>
          <Button
            color="primary"
            variant="contained"
            onClick={copyQRCode}
          >
            Copy
          </Button>
        </Stack>
        <QRCode value={`https://make.rit.edu/${props.link}`} size={500} ref={svgRef} />
      </Stack>
    </PrettyModal>
  );
}