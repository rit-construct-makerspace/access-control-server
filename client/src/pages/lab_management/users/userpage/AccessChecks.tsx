import { Alert, Stack, Typography } from "@mui/material"
import ActionButton from "../../../../common/ActionButton"
import { isManager, isStaffFor, isTrainerFor } from "../../../../common/PrivilegeUtils"
import { useCurrentUser } from "../../../../common/CurrentUserProvider";
import { gql } from "@apollo/client";
import { useMutation } from "@apollo/client/react";
import { AccessCheckExtraInfo, GET_USER } from "../../../../queries/userQueries";
import { useState } from "react";
import AccessCheckCard from "../AccessCheckCard";
import CreateAccessCheckModal from "./CreateAccessCheckModal";

const REFRESH_CHECKS = gql`
  mutation RefreshAccessChecks($userID: ID!) {
    refreshAccessChecks(userID: $userID)
  }
`;

interface AccessCheckProps {
  user: any;
}

export default function AccessChecks(props: AccessCheckProps) {
  const currentUser = useCurrentUser();

  const [createAccessCheckModal, setCreateAccessCheckModal] = useState(false);

  const [refreshCheck, refreshCheckResult] = useMutation(REFRESH_CHECKS, { variables: { userID: props.user.id }, refetchQueries: [{ query: GET_USER, variables: { id: props.user.id } }] });

  const filteredACs: AccessCheckExtraInfo[] = props.user.accessChecks.filter(
    (ac: AccessCheckExtraInfo) => (
      ac.equipment.requiresTrainerApproval
        ? isTrainerFor(currentUser, Number(ac.equipment.id), Number(ac.equipment.room.makerspace.id))
        : (isStaffFor(currentUser, Number(ac.equipment.room.makerspace.id)) || isTrainerFor(currentUser, Number(ac.equipment.id), Number(ac.equipment.room.makerspace.id)))
    )
  );

  return (
    <Stack >
      <Typography variant="h6" component="div" mb={1}>
        Access Checks
      </Typography>

      <Stack direction={"row"} spacing={1}>
        <ActionButton iconSize={5} color="info" appearance={"small"} variant="outlined" handleClick={async () => { refreshCheck() }} loading={refreshCheckResult.loading} buttonText="Refresh Checks" tooltipText="Purge all unapproved checks and repopulate based on currently passed modules." />
        {isManager(currentUser) && <ActionButton iconSize={5} color="primary" appearance={"small"} variant="outlined" handleClick={async () => { setCreateAccessCheckModal(true) }} loading={false} buttonText="Create Check" />}
      </Stack>

      <Stack spacing={1} mt={2}>
        {filteredACs != null && filteredACs.map((accessCheck: AccessCheckExtraInfo) => (
          <AccessCheckCard key={accessCheck.id} accessCheck={accessCheck} userID={props.user.id} />
        ))}
      </Stack>

      {(filteredACs == null || (filteredACs.length === 0)) && (
        <Alert severity="info">No Access Checks Available</Alert>
      )}

      <CreateAccessCheckModal open={createAccessCheckModal} onClose={() => setCreateAccessCheckModal(false)} user={props.user} />
    </Stack>
  )
}