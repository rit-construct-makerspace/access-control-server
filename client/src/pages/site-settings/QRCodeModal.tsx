import QRCode from "react-qr-code";
import PrettyModal from "../../common/PrettyModal";
import { Stack, Typography } from "@mui/material";


export default function QRCodeModal(props: {
  open: boolean,
  onClose: () => void,
  link: string
}) {

  return (
    <PrettyModal open={props.open} onClose={props.onClose} width={"max-content"}>
      <Stack spacing={2} width={"max-content"} alignItems={"center"}>
        <Typography color="primary" variant="h4">{`/${props.link}`}</Typography>
        <QRCode value={`https://make.rit.edu/${props.link}`} size={500} />
      </Stack>
    </PrettyModal>
  );
}