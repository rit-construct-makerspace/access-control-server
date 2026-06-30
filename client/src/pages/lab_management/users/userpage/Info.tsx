import { Alert, Avatar, Button, Stack, Typography } from "@mui/material";
import { useIsMobile } from "../../../../common/IsMobileProvider";
import { stringAvatar } from "../../../../common/avatarGenerator";
import { useNavigate, useParams } from "react-router-dom";
import HistoryIcon from "@mui/icons-material/History";
import InfoBlob from "../InfoBlob";
import { format, parseISO } from "date-fns";


interface InfoProps {
  user: any;
}

export default function Info(props: InfoProps) {
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const { makerspaceID } = useParams<{ makerspaceID: string }>();


  return (
    <Stack>
      <Stack direction="row" justifyContent="space-between">
        <Stack direction="row" alignItems="center" spacing={2}>
          {
            isMobile
              ? null
              : <Avatar
                alt="Profile Picture"
                {...stringAvatar(props.user.firstName, props.user.lastName, { width: 80, height: 80, fontSize: 35 })}
              />
          }
          <Stack>
            <Typography variant={isMobile ? "h6" : "h5"} component="div" fontWeight={500}>
              {`${props.user.firstName} ${props.user.lastName} (${props.user.ritUsername})`}
            </Typography>
            <Typography>{props.user.pronouns}</Typography>
          </Stack>
        </Stack>
        <Button
          startIcon={<HistoryIcon />}
          variant="contained"
          color="secondary"
          onClick={() => navigate(`/makerspace/${makerspaceID}/history?q=<user:${props.user.id}:`)}
          size={isMobile ? "small" : undefined}
          sx={{
            height: "max-content"
          }}
        >
          View logs
        </Button>
      </Stack>
      {
        isMobile ? null
          : <Stack direction={isMobile ? "row" : "row"} spacing={isMobile ? undefined : 6} justifyContent={isMobile ? "space-between" : undefined}>
            <InfoBlob
              label="Member Since"
              value={format(parseISO(props.user.registrationDate), "MM/dd/yyyy")}
            />
            <InfoBlob
              label="College"
              value={props.user.college}
            />
            <InfoBlob
              label="Expected Graduation"
              value={props.user.expectedGraduation}
            />
          </Stack>
      }
      {
        props.user.archived && <Alert severity="warning" variant="filled">This user is archived!</Alert>
      }
    </Stack>
  )
}