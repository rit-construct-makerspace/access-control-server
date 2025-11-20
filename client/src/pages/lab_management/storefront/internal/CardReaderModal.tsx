import { Stack } from "@mui/system"
import PrettyModal from "../../../../common/PrettyModal"
import { Alert, Button, CircularProgress, TextField, Typography } from "@mui/material"
import { useState } from "react"

export interface CardReaderModalProps{
    open: boolean
    loading: boolean
    failed: boolean
    onSubmit: (uid: string) => void
    onCancel: () => void
}

export default function CardReaderModal(props: CardReaderModalProps){
    const [uidState, setUidState] = useState<string>("");

    return <PrettyModal open={props.open} onClose={() => { }}>
      <Stack direction={"column"} spacing={"5px"}>
        <Stack direction={"row"} justifyContent={"space-between"}>
        <Typography variant="h4">Tap Card to Charge</Typography>
        {props.loading ? <CircularProgress/> : undefined}
        </Stack>
        <TextField value={uidState} autoFocus type="password" onChange={(e) => setUidState(e.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') { props.onSubmit(uidState) } }} defaultChecked />

        <Button variant="contained" color="secondary" onClick={() => props.onSubmit(uidState)}>Lookup ID</Button>
        <Button variant="contained" color="error" onClick={props.onCancel}>Cancel</Button>
        {props.failed ? <Alert severity="error">Card not found</Alert>: undefined}
      </Stack>
    </PrettyModal>
}
