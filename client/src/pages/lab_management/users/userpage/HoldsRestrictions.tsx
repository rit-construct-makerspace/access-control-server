import { Alert, Button, FormControl, InputLabel, MenuItem, Select, Stack, Typography } from "@mui/material";
import { useCurrentUser } from "../../../../common/CurrentUserProvider";
import RequestWrapper2 from "../../../../common/RequestWrapper2";
import LockIcon from '@mui/icons-material/Lock';
import BlockIcon from '@mui/icons-material/Block';
import { gql } from "@apollo/client";
import { useMutation, useQuery } from "@apollo/client/react";
import { GET_USER, Hold, Restriction } from "../../../../queries/userQueries";
import HoldCard from "../HoldCard";
import RestrictionCard from "../RestrictionCard";
import { isStaff, isStaffFor } from "../../../../common/PrivilegeUtils";
import { FullMakerspace, GET_FULL_MAKERSPACES } from "../../../../queries/makerspaceQueries";
import { useState } from "react";

const CREATE_HOLD = gql`
  mutation CreateHold($userID: ID!, $description: String!) {
    createHold(userID: $userID, description: $description) {
      id
    }
  }
`;

const CREATE_RESTRICTION = gql`
  mutation CreateRestriction($userID: ID!, $makerspaceID: ID!, $reason: String!) {
    createRestriction(targetID: $userID, makerspaceID: $makerspaceID, reason: $reason) {
      id
    }
  }
`;

interface HoldsRestrictionsProps {
  user: any;
}

// ALSO RESTRICTIONS
export default function HoldsRestrictions(props: HoldsRestrictionsProps) {
  const currentUser = useCurrentUser();

  const [restrictionMakerspace, setRestrictionMakerspace] = useState(-1);

  const [createHold] = useMutation(CREATE_HOLD, { refetchQueries: [{ query: GET_USER, variables: { id: props.user.id } }] });
  const [createRestriction] = useMutation(CREATE_RESTRICTION, { refetchQueries: [{ query: GET_USER, variables: { id: props.user.id } }] });
  const getMakerspacesResult = useQuery(GET_FULL_MAKERSPACES);

  const handlePlaceHoldClicked = () => {
    const description = window.prompt("Enter hold description:");
    if (description === "") {
      window.alert("Description required.");
      return;
    }
    else if (!description) {
      return;
    }

    createHold({
      variables: { userID: props.user.id, description }
    });
  };

  function handleCreateRestriction() {
    if (restrictionMakerspace === -1) {
      window.alert("Makerspace Required");
      return;
    }

    const reason = window.prompt("Enter reason for restriction:")
    if (reason === "") {
      window.alert("Reason required.");
      return;
    } else if (!reason) {
      return;
    }

    createRestriction({
      variables: { userID: props.user.id, makerspaceID: restrictionMakerspace, reason: reason }
    });
  }


  return (
    <Stack spacing={3}>
      <Stack spacing={1}>
        <Stack direction="row" justifyContent={"space-between"}>
          <Typography variant="h6">
            Account Holds
          </Typography>
          <Button
            color="error"
            variant="contained"
            onClick={handlePlaceHoldClicked}
            startIcon={<BlockIcon />}
            disabled={!isStaff(currentUser)}
          >
            Place hold
          </Button>
        </Stack>

        {props.user.holds.length === 0 && (
          <Alert severity="success">No Holds!</Alert>
        )}

        <Stack spacing={2}>
          {props.user.holds.map((hold: Hold) => (
            <HoldCard key={hold.id} hold={hold} userID={props.user.id} />
          ))}
        </Stack>
      </Stack>
      <Stack spacing={1}>
        <Typography variant="h6" component="div" mt={2} mb={1}>
          Account Restrictions
        </Typography>
        {
          isStaff(currentUser)
            ? < RequestWrapper2 result={getMakerspacesResult} render={(data) => {

              const fullSpaces: FullMakerspace[] = data.makerspaces;
              // I hate typescript I hate typescript I hate typescript I hate typescript I hate typescript I hate typescript I hate typescript I hate typescript 
              const potentialRestrictions = fullSpaces.filter((space: FullMakerspace) => isStaffFor(currentUser, Number(space.id)))

              return (
                <Stack direction="row" spacing={1} mt={2} alignItems={"center"}>
                  <FormControl fullWidth>
                    <InputLabel id="restriction-makerspace">Makerspace</InputLabel>
                    <Select id="restriction-makerspace"
                      label="Makerspace"
                      onChange={(e) => setRestrictionMakerspace(Number(e.target.value))}
                      fullWidth
                    >
                      {
                        potentialRestrictions.map((space: FullMakerspace) => (
                          <MenuItem value={space.id}>{space.name} ID: {space.id}</MenuItem>
                        ))
                      }
                    </Select>
                  </FormControl>
                  <Button
                    variant="contained"
                    color="warning"
                    onClick={handleCreateRestriction}
                    startIcon={<LockIcon />}
                    sx={{ whiteSpace: "nowrap", minWidth: "unset", height: "100%" }}
                  >
                    Place Restriction
                  </Button>
                </Stack>
              );
            }
            } />
            : null
        }

        {props.user.restrictions.length === 0 && (
          <Alert severity="success" variant="filled">No Restrictions!</Alert>
        )}

        <Stack spacing={2}>
          {props.user.restrictions.map((restriction: Restriction) => (
            <RestrictionCard key={restriction.id} restriction={restriction} userID={props.user.id} />
          ))}
        </Stack>
      </Stack>
    </Stack>
  )
}