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
import SearchBar from "../../../../common/SearchBar";
import { useIsMobile } from "../../../../common/IsMobileProvider";

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
  const isMobile = useIsMobile();

  const [createAccessCheckModal, setCreateAccessCheckModal] = useState(false);
  const [searchText, setSearchtext] = useState("");

  const [refreshCheck, refreshCheckResult] = useMutation(REFRESH_CHECKS, { variables: { userID: props.user.id }, refetchQueries: [{ query: GET_USER, variables: { id: props.user.id } }] });

  const filteredACs: AccessCheckExtraInfo[] = props.user.accessChecks.filter(
    (ac: AccessCheckExtraInfo) => (
      ac.equipment.requiresTrainerApproval
        ? isTrainerFor(currentUser, Number(ac.equipment.id), Number(ac.equipment.room.makerspace.id))
        : (isStaffFor(currentUser, Number(ac.equipment.room.makerspace.id)) || isTrainerFor(currentUser, Number(ac.equipment.id), Number(ac.equipment.room.makerspace.id)))
    )
  );

  const searchedACs: AccessCheckExtraInfo[] = filteredACs.filter(
    (ac: AccessCheckExtraInfo) => (
      ac.equipment.name.toLowerCase().includes(searchText.toLowerCase()) || ac.equipment.subName.toLowerCase().includes(searchText.toLowerCase())
    )
  )

  return (
    <Stack spacing={1}>
      <Stack direction={isMobile ? "column" : "row"} justifyContent={"space-between"}>
        <Typography variant="h6" component="div">
          Access Checks
        </Typography>
        <Stack direction={"row"} spacing={1}>
          {isManager(currentUser) && <ActionButton iconSize={5} color="primary" appearance={"small"} variant="outlined" handleClick={async () => { setCreateAccessCheckModal(true) }} loading={false} buttonText="Create Check" />}
          <ActionButton iconSize={5} color="info" appearance={"small"} variant="outlined" handleClick={async () => { refreshCheck() }} loading={refreshCheckResult.loading} buttonText="Refresh Checks" tooltipText="Purge all unapproved checks and repopulate based on currently passed modules." />
        </Stack>
      </Stack>
      <SearchBar
        onChange={(e) => setSearchtext(e.target.value)}
        onClear={() => setSearchtext("")}
        sx={{
          width: "100%"
        }}
      />
      <Stack spacing={1}>
        {searchedACs != null && searchedACs.map((accessCheck: AccessCheckExtraInfo) => (
          <AccessCheckCard key={accessCheck.id} accessCheck={accessCheck} userID={props.user.id} />
        ))}
      </Stack>

      {(searchedACs == null || (searchedACs.length === 0)) && (
        <Alert severity="info">No Access Checks Available</Alert>
      )}

      <CreateAccessCheckModal open={createAccessCheckModal} onClose={() => setCreateAccessCheckModal(false)} user={props.user} />
    </Stack>
  )
}