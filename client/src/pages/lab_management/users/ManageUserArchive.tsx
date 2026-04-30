import { gql } from "@apollo/client";
import { useMutation } from "@apollo/client/react";
import { Stack, ToggleButton, ToggleButtonGroup, Typography } from "@mui/material";
import { isManager } from "../../../common/PrivilegeUtils";
import { useCurrentUser } from "../../../common/CurrentUserProvider";
import { GET_USER } from "../../../queries/userQueries";

const SET_USER_FORCE = gql`
  mutation ForceArchiveUser($userID: ID!, $force: Boolean) {
    forceArchiveUser(userID: $userID, force: $force) {
      id
    }
  }
`;

export default function ManageUserArchive(props: { userID: number, forceArchive: boolean | null }) {
  const currentUser = useCurrentUser();

  const [setUserForceArchive] = useMutation(SET_USER_FORCE, { refetchQueries: [{ query: GET_USER, variables: { id: props.userID } }] });

  function handleSelection(event: React.MouseEvent<HTMLElement>, newSelection: boolean | string | null) {
    if (newSelection !== null) {
      setUserForceArchive({ variables: { userID: props.userID, force: newSelection === "unset" ? null : newSelection } })
    }
  }

  return (
    <Stack mt={2} spacing={1}>
      <Typography variant="h6">Force Archive</Typography>
      <ToggleButtonGroup
        exclusive
        value={props.forceArchive === null ? "unset" : props.forceArchive}
        onChange={handleSelection}
        disabled={!isManager(currentUser)}
      >
        <ToggleButton value={true} color="error">
          Force Archive
        </ToggleButton>
        <ToggleButton value={"unset"} color="primary">
          Neutral
        </ToggleButton>
        <ToggleButton value={false} color="success">
          Force Active
        </ToggleButton>
      </ToggleButtonGroup>
    </Stack>
  );
}