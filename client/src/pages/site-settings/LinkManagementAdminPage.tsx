import { Button, Card, Grid, Link, Stack, Typography } from "@mui/material";
import RequestWrapper2 from "../../common/RequestWrapper2";
import CreateCustomUrlModal from "./CreateCustomUrlModal";
import DeleteCustomUrlModal from "./DeleteCustomUrlModal";
import QRCodeModal from "./QRCodeModal";
import UpdateCustomUrlModal from "./UpdateCustomUrlModal";
import { useState } from "react";
import { useQuery } from "@apollo/client/react";
import { GET_ALL_CUSTOM_URLS } from "../../queries/customUrlQueries";
import { toast } from "react-toastify";
import QrCodeIcon from '@mui/icons-material/QrCode';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';


export default function LinkManagementAdminPage() {

  const getCustomUrlsResult = useQuery(GET_ALL_CUSTOM_URLS);

  const [createCustomUrlModal, setCreateCustomUrlModal] = useState(false);
  const [deleteCustomUrlModal, setDeleteCustomUrlModal] = useState(false);
  const [updateCustomUrlModal, setUpdateCustomUrlModal] = useState(false);
  const [deleteUrl, setDeleteUrl] = useState({ id: 0, shortUrl: "" });
  const [updateUrl, setUpdateUrl] = useState({ id: 0, shortUrl: "", longUrl: "" })

  const [qrTarget, setQrTarget] = useState("");
  const [qrModal, setQrModal] = useState(false);

  function handleDelete(id: number, shortUrl: string) {
    setDeleteUrl({ id: id, shortUrl: shortUrl });
    setDeleteCustomUrlModal(true);
  }

  function handleUpdateUrl(id: number, shortUrl: string, longUrl: string) {
    setUpdateUrl({ id: id, shortUrl: shortUrl, longUrl: longUrl })
    setUpdateCustomUrlModal(true);
  }

  async function copyShortLink(link: string) {
    await navigator.clipboard.writeText(`https://make.rit.edu/${link}`);
    toast.success("Link copied to clipboard");
  }

  function handleQr(link: string) {
    setQrTarget(link);
    setQrModal(true);
  }

  return (
    <Stack spacing={3} padding={"20px"}>
      <Stack direction={"column"} spacing={1}>
        <Stack direction={"row"} spacing={2}>
          <Typography variant="h4">Custom Links</Typography>
          <Button color="success" variant="contained" onClick={() => setCreateCustomUrlModal(true)} startIcon={<AddIcon />}>
            Create Custom Link
          </Button>
        </Stack>
      </Stack>
      <RequestWrapper2 result={getCustomUrlsResult} render={(data) => {
        return (
          <Grid container spacing={3}>
            {
              data.urls.map((customUrl: { id: number, shortUrl: string, longUrl: string }) => (
                <Grid>
                  <Card variant="outlined">
                    <Stack width={"300px"} padding={"10px"} spacing={1}>
                      <Stack direction={"row"} spacing={1} alignItems={"center"} width={"max-content"} sx={{ ":hover": { cursor: "pointer" } }} onClick={() => copyShortLink(`link/${customUrl.shortUrl}`)}>
                        <Typography variant="subtitle1" color="primary">/link/{customUrl.shortUrl}</Typography>
                        <ContentCopyIcon color="primary" />
                      </Stack>
                      <Typography noWrap>Links to: <Link rel="noopener noreferrer" href={customUrl.longUrl} target="_blank">{customUrl.longUrl}</Link></Typography>
                      <Stack direction={"row"} justifyContent={"space-between"}>
                        <Button
                          color="error"
                          variant="contained"
                          startIcon={<DeleteIcon />}
                          onClick={() => handleDelete(customUrl.id, customUrl.shortUrl)}
                        >
                          Delete
                        </Button>
                        <Button
                          color="primary"
                          variant="contained"
                          onClick={() => handleQr("link/" + customUrl.shortUrl)}
                        >
                          <QrCodeIcon />
                        </Button>
                        <Button color="secondary" variant="outlined" onClick={() => { handleUpdateUrl(customUrl.id, customUrl.shortUrl, customUrl.longUrl) }}>
                          Edit
                        </Button>
                      </Stack>
                    </Stack>
                  </Card>
                </Grid>
              )
              )
            }
          </Grid>

        );
      }} />

      <DeleteCustomUrlModal open={deleteCustomUrlModal} onClose={() => setDeleteCustomUrlModal(false)} id={deleteUrl.id} shortUrl={deleteUrl.shortUrl} />
      <CreateCustomUrlModal open={createCustomUrlModal} onClose={() => setCreateCustomUrlModal(false)} />
      <UpdateCustomUrlModal open={updateCustomUrlModal} onClose={() => setUpdateCustomUrlModal(false)} id={updateUrl.id} shortUrl={updateUrl.shortUrl} longUrl={updateUrl.longUrl} />
      <QRCodeModal open={qrModal} onClose={() => setQrModal(false)} link={qrTarget} />
    </Stack>
  );
}