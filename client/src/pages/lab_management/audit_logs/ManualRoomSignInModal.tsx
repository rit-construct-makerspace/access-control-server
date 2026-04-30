import { gql } from "@apollo/client";
import { useLazyQuery, useMutation, useQuery } from "@apollo/client/react";
import PrettyModal from "../../../common/PrettyModal";
import { Box, Button, CircularProgress, MenuItem, Select, Stack, TextField, Typography } from "@mui/material";
import { useState } from "react";
import { GET_USER_BY_USERNAME_OR_UID, PartialUser } from "../../../queries/userQueries";
import AuditLogEntity from "../audit_logs/AuditLogEntity";
import CloseIcon from '@mui/icons-material/Close';
import CheckIcon from '@mui/icons-material/Check';
import GET_ROOMS from "../../../queries/roomQueries";
import RequestWrapper from "../../../common/RequestWrapper";
import Room from "../../../types/Room";


const SWIPE_IN = gql`
  mutation SwipeIntoRoomWithID($roomID: ID!, $id: ID!) {
    swipeIntoRoomWithID(roomID: $roomID, id: $id) {
      id
    }
  }
`;

export function ManualRoomSignInModal({modalOpen, setModalOpen}: {modalOpen: boolean, setModalOpen: React.Dispatch<React.SetStateAction<boolean>>}) {
  const getRoomsResult = useQuery(GET_ROOMS);
  const [room, setRoom] = useState<number>();

  const [swipeIn] = useMutation(SWIPE_IN);

  const [getUser, getUserResult] = useLazyQuery(GET_USER_BY_USERNAME_OR_UID);
  const getUserSafe: PartialUser | undefined = getUserResult.data?.userByUsernameorUID ?? undefined;

  const [userSearch, setUserSearch] = useState<string>();

  function handleUserSearchChange(e: any) {
    setUserSearch(e.target.value.toLowerCase());

    getUser({ variables: { value: e.target.value.toLowerCase() } });
  }

  function handleSubmit () {
    swipeIn({variables: {roomID: room, id: getUserSafe?.id}}).then((_result) => {
      setModalOpen(false);
      setRoom(undefined);
      setUserSearch("");
    });
  }

  const USER_LOADING = (<Stack direction={"row"}>
    <CircularProgress />
    <Typography variant="body1">
      Loading
    </Typography>
  </Stack>);

  const USER_NOT_FOUND = (<Stack direction={"row"}>
    <CloseIcon color="error" />
    <Typography variant="body1">
      User Not Found
    </Typography>
  </Stack>);

  const USER_FOUND = (<Stack direction={"row"}>
    <CheckIcon color="success" />
    <Typography variant="body1">
      Found: <AuditLogEntity entityCode={`user:${getUserSafe?.id}:${getUserSafe?.firstName} ${getUserSafe?.lastName}`} />
    </Typography>
  </Stack>);

  const USER_STATE = getUserResult.loading ? USER_LOADING
    : (!getUserSafe ? USER_NOT_FOUND : USER_FOUND);

  return (
    <PrettyModal open={modalOpen} onClose={() => setModalOpen(false)}>
      <Typography variant="h5">Manual Sign-In</Typography>

      <RequestWrapper loading={getRoomsResult.loading} error={getRoomsResult.error}>
        <Box my={5} height={100}>
          <Typography mb={2} variant="body1">Select Room</Typography>
          <Select value={room} onChange={(e) => setRoom(e.target.value as number)} fullWidth>
            {getRoomsResult.data?.rooms.map((room: Room) => (
              <MenuItem value={room.id}>{room.name}</MenuItem>
            ))}
          </Select>
        </Box>
      </RequestWrapper>

      <Box my={5} height={100}>
        <Typography mb={2} variant="body1">Enter User Card ID or Username</Typography>
        <TextField label="Find User" placeholder="ex: 1234567890 or abc1234" value={userSearch} onChange={handleUserSearchChange} sx={{minWidth: "70%"}} />
        {USER_STATE}
      </Box>
      
      <Button fullWidth variant="contained" onClick={handleSubmit} disabled={!getUserSafe || !room}>Sign-In</Button>
    </PrettyModal>
  );
}