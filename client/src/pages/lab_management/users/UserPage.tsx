import { ChangeEvent, useEffect, useState } from "react";
import { Alert, Avatar, Box, Button, Card, Chip, FormControl, IconButton, InputLabel, MenuItem, Select, Stack, TextField, Typography } from "@mui/material";
import { gql, useLazyQuery, useMutation, useQuery } from "@apollo/client";
import InfoBlob from "./InfoBlob";
import { format, parseISO } from "date-fns";
import RequestWrapper2 from "../../../common/RequestWrapper2";
import HistoryIcon from "@mui/icons-material/History";
import PrivilegeControl from "./PrivilegeControl";
import { useNavigate, useParams } from "react-router-dom";
import HoldCard from "./HoldCard";
import { useCurrentUser } from "../../../common/CurrentUserProvider";
import CardTagSettings from "./CardTagSettings";
import AccessCheckCard from "./AccessCheckCard";
import ActionButton from "../../../common/ActionButton";
import { GET_ALL_EQUIPMENTS } from "../../../queries/equipmentQueries";
import RequestWrapper from "../../../common/RequestWrapper";
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { stringAvatar } from "../../../common/avatarGenerator";
import { isManager, isStaff, isStaffFor, isTrainerFor } from "../../../common/PrivilegeUtils";
import RestrictionCard from "./RestrictionCard";
import { useIsMobile } from "../../../common/IsMobileProvider";
import { FullMakerspace, GET_FULL_MAKERSPACES } from "../../../queries/makerspaceQueries";
import LockIcon from '@mui/icons-material/Lock';
import BlockIcon from '@mui/icons-material/Block';
import DeleteIcon from '@mui/icons-material/Delete';
import ManageUserArchive from "./ManageUserArchive";
import { AccessCheckExtraInfo, GET_USER, Hold, Restriction } from "../../../queries/userQueries";


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

const SET_NOTES = gql`
  mutation SetNotes($userID: ID!, $notes: String!) {
    setNotes(userID: $userID, notes: $notes) {
      id
    }
  }
`;

const REFRESH_CHECKS = gql`
  mutation RefreshAccessChecks($userID: ID!) {
    refreshAccessChecks(userID: $userID)
  }
`;

const CREATE_CHECK = gql`
  mutation CreateAccessCheck($userID: ID!, $equipmentID: ID!) {
    createAccessCheck(userID: $userID, equipmentID: $equipmentID)
  }
`;

const DELETE_TRAINING_HOLD = gql`
  mutation DeleteTrainingHold($id: ID!) {
    deleteTrainingHold(id: $id)
  }
`;

const DELETE_PASSED_MODULE = gql`
  mutation DeletePassedModule($userID: ID!, $moduleID: ID!) {
    deletePassedModule(userID: $userID, moduleID: $moduleID)
  }
`;

export default function UserPage() {
  const { makerspaceID, userID} = useParams<{ makerspaceID: string, userID: string }>();
  const navigate = useNavigate();
  const currentUser = useCurrentUser();
  const isMobile = useIsMobile();

  const [notes, setNotes] = useState<string>();
  const [openCreateCheckDialouge, setOpenCreateCheckDialouge] = useState<boolean>();
  const [newCheckEquipmentID, setNewCheckEquipmentID] = useState<string>();
  const [restrictionMakerspace, setRestrictionMakerspace] = useState(-1);

  const [getUser, getUserResult] = useLazyQuery(GET_USER);
  const getEquipment = useQuery(GET_ALL_EQUIPMENTS)
  const [createHold] = useMutation(CREATE_HOLD);
  const [createRestriction] = useMutation(CREATE_RESTRICTION);
  const [setNotesMutation, setNotesResult] = useMutation(SET_NOTES);
  const [refreshCheck, refreshCheckResult] = useMutation(REFRESH_CHECKS, { variables: { userID: userID }, refetchQueries: [{ query: GET_USER, variables: { id: userID } }] });
  const [createCheck] = useMutation(CREATE_CHECK, { refetchQueries: [{ query: GET_USER, variables: { id: userID } }] });
  const [deleteTrainingHold] = useMutation(DELETE_TRAINING_HOLD, { refetchQueries: [{ query: GET_USER, variables: { id: userID } }] });
  const [deletePassedModule] = useMutation(DELETE_PASSED_MODULE, { refetchQueries: [{ query: GET_USER, variables: { id: userID } }] });
  const getMakerspacesResult = useQuery(GET_FULL_MAKERSPACES);

  useEffect(() => {
    if (userID) getUser({ variables: { id: userID } });
  }, [userID, getUser]);

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
      variables: { userID: getUserResult.data.user.id, description },
      refetchQueries: [{ query: GET_USER, variables: { id: userID } }],
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
      variables: { userID: getUserResult.data.user.id, makerspaceID: restrictionMakerspace, reason: reason },
      refetchQueries: [{ query: GET_USER, variables: { id: userID } }]
    });
  }

  function handleTrainingHoldDeleteClick(id: number) {
    deleteTrainingHold({ variables: { id } });
  }

  function handleCheckCreate() {
    if (!newCheckEquipmentID) return;
    createCheck({ variables: { userID: userID, equipmentID: newCheckEquipmentID } });
    setOpenCreateCheckDialouge(false);
  }

  const handleNotesChanged = (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setNotes(event.target.value)
  };

  return (
    <Box margin="10px 25px">
      <RequestWrapper2
        result={getUserResult}
        render={({ user }) => {
          const filteredACs: AccessCheckExtraInfo[] = user.accessChecks.filter(
            (ac: AccessCheckExtraInfo) => (
              ac.equipment.requiresTrainerApproval
                ? isTrainerFor(currentUser, Number(ac.equipment.id), Number(ac.equipment.room.makerspace.id))
                : (isStaffFor(currentUser, Number(ac.equipment.room.makerspace.id)) || isTrainerFor(currentUser, Number(ac.equipment.id), Number(ac.equipment.room.makerspace.id)))
            )
          );

          return (
            <Stack>
              <Stack direction="row" justifyContent="space-between">
                <Stack direction="row" alignItems="center" spacing={2}>
                  {
                    isMobile
                      ? null
                      : <Avatar
                        alt="Profile Picture"
                        {...stringAvatar(user.firstName, user.lastName, { width: 80, height: 80, fontSize: 35 })}
                      />
                  }
                  <Stack>
                    <Typography variant={isMobile ? "h6" : "h5"} component="div" fontWeight={500}>
                      {`${user.firstName} ${user.lastName} (${user.ritUsername})`}
                    </Typography>
                    <Typography>{user.pronouns}</Typography>
                  </Stack>
                </Stack>
                <IconButton onClick={() =>navigate(`/makerspace/${makerspaceID}/people`)} sx={{ width: "51px", height: "51px", p: 0, fontSize: 14  }} >
                  <ArrowBackIcon sx = {{fontSize: 18}}/> Back
                </IconButton>
                {/* <NavLink
                  primary={"All People"}
                  to={`/makerspace/${makerspaceID}/people`}
                  icon={<ArrowBackIcon />}
                /> */}
              </Stack>

              <Stack direction={isMobile ? "column" : "row"} justifyContent={isMobile ? undefined : "space-between"} mt={4}>
                <Stack direction={isMobile ? "column" : "row"} spacing={isMobile ? 2 : 6}>
                  <InfoBlob
                    label="Member Since"
                    value={format(parseISO(user.registrationDate), "MM/dd/yyyy")}
                  />
                  <InfoBlob
                    label="College"
                    value={user.college}
                  />
                  <InfoBlob
                    label="Expected Graduation"
                    value={user.expectedGraduation}
                  />
                </Stack>
                <Button
                  startIcon={<HistoryIcon />}
                  variant="outlined"
                  color="secondary"
                  onClick={() => navigate(`/makerspace/${makerspaceID}/history?q=<user:${user.id}:`)}
                >
                  View logs
                </Button>
              </Stack>
              {
                user.archived && <Alert severity="warning" variant="filled">This user is archived!</Alert>
              }
              <Stack direction={isMobile ? "column" : "row"} width="100%" mt={4} spacing={4} justifyContent="center">
                <Stack width="50%">
                  <Typography variant="h6" component="div" mb={1}>
                    Access Checks
                  </Typography>

                  <Stack direction={"row"} spacing={1}>
                    <ActionButton iconSize={5} color="info" appearance={"small"} variant="outlined" handleClick={async () => { refreshCheck() }} loading={refreshCheckResult.loading} buttonText="Refresh Checks" tooltipText="Purge all unapproved checks and repopulate based on currently passed modules." />
                    {isManager(currentUser) && <ActionButton iconSize={5} color="primary" appearance={"small"} variant="outlined" handleClick={async () => { setOpenCreateCheckDialouge(!openCreateCheckDialouge) }} loading={false} buttonText="Create Check" />}
                  </Stack>
                  {openCreateCheckDialouge && <Stack direction={"row"} mt={1}>
                    <RequestWrapper loading={getEquipment.loading} error={getEquipment.error}>
                      <Select value={newCheckEquipmentID} onChange={(e) => setNewCheckEquipmentID(e.target.value)} sx={{ width: "50%" }}>
                        {getEquipment.data?.allEquipment.map((equipment: { id: number, name: string, archived: boolean }) => (
                          <MenuItem value={equipment.id}>{equipment.name} {equipment.archived && <Chip variant="outlined" color="warning" size="small" label="hidden" sx={{ ml: "1em" }} />}</MenuItem>
                        ))}
                      </Select>
                    </RequestWrapper>
                    <Button variant="outlined" color="success" onClick={handleCheckCreate}>Create</Button>
                  </Stack>}

                  <Stack spacing={1} mt={2}>
                    {filteredACs != null && filteredACs.map((accessCheck: AccessCheckExtraInfo) => (
                      <AccessCheckCard key={accessCheck.id} accessCheck={accessCheck} userID={user.id} />
                    ))}
                  </Stack>

                  {(filteredACs == null || (filteredACs.length === 0)) && (
                    <Alert severity="info">No Access Checks Available</Alert>
                  )}

                  <Typography variant="h6" component="div" mt={4} mb={1}>
                    Passed Trainings
                  </Typography>

                  {(user.passedModules == null || (user.passedModules.length === 0)) && (
                    <Alert severity="info">No Passed Trainings</Alert>
                  )}

                  <Box sx={{ maxHeight: "300px", overflowY: "scroll" }}>
                    <Stack spacing={0.5}>
                      {user.passedModules != null && user.passedModules.map((module: { moduleID: number, moduleName: string, passedDate: string, makerspaceID: string }) => (
                        <Card sx={{ p: "0.25em", backgroundColor: (localStorage.getItem("themeMode") === "dark" ? "grey.900" : "grey.100"), border: `1px solid grey` }}>
                          <Stack direction={"row"} sx={{ justifyContent: "space-between" }} alignItems={"center"}>
                            <Typography>{module.moduleName}</Typography>
                            <Stack direction={"row"} spacing={1} alignItems={"center"}>
                              <Typography>{format(new Date(module.passedDate), "M/d/yy h:mmaaa")}</Typography>
                              <IconButton
                                color="error"
                                disabled={!isStaffFor(currentUser, module.moduleID ?? -1)}
                                onClick={() => deletePassedModule({ variables: { userID: userID, moduleID: module.moduleID } })}
                              >
                                <DeleteIcon />
                              </IconButton>
                            </Stack>
                          </Stack>
                        </Card>
                      ))}
                    </Stack>
                  </Box>


                  <Typography variant="h6" component="div" mt={6} mb={1}>
                    Locked Trainings
                  </Typography>

                  {(user.trainingHolds == null || (user.trainingHolds.length === 0)) && (
                    <Alert severity="success">No Locked Trainings</Alert>
                  )}

                  <Box sx={{ maxHeight: "300px", overflowY: "scroll" }}>
                    <Stack spacing={0.5}>
                      {user.trainingHolds != null && user.trainingHolds.map((hold: { id: number; expires: Date; module: { id: number; name: string } }) => (
                        <Card sx={{ p: "0.25em", backgroundColor: (localStorage.getItem("themeMode") === "dark" ? "grey.900" : "grey.100"), border: `1px solid grey` }}>
                          <Stack direction={"row"} alignItems={"center"} sx={{ justifyContent: "space-between" }}>
                            <Stack direction={"row"} alignItems={"center"} spacing={2}>
                              <Typography color={"secondary"}><b>Exp: </b>{format(new Date(hold.expires), "M/d/yy h:mmaaa")}</Typography>
                              <Typography>{hold.module.name}</Typography>
                            </Stack>
                            <Button variant="text" color="success" onClick={() => handleTrainingHoldDeleteClick(hold.id)}>Unlock</Button>
                          </Stack>
                        </Card>
                      ))}
                    </Stack>
                  </Box>
                </Stack>
                <Stack width="50%">
                  <Stack direction="row" justifyContent={"space-between"} mb={1}>
                    <Typography variant="h6">
                      Account Holds
                    </Typography>
                    <Button
                      color="error"
                      variant="contained"
                      onClick={handlePlaceHoldClicked}
                      startIcon={<BlockIcon />}
                    >
                      Place hold
                    </Button>
                  </Stack>


                  {user.holds.length === 0 && (
                    <Alert severity="success">No Holds!</Alert>
                  )}

                  <Stack spacing={2}>
                    {user.holds.map((hold: Hold) => (
                      <HoldCard key={hold.id} hold={hold} userID={user.id} />
                    ))}
                  </Stack>


                  <Typography variant="h6" component="div" mt={2} mb={1}>
                    Account Restrictions
                  </Typography>

                  {user.restrictions.length === 0 && (
                    <Alert severity="success">No Restrictions!</Alert>
                  )}

                  <Stack spacing={2}>
                    {user.restrictions.map((restriction: Restriction) => (
                      <RestrictionCard key={restriction.id} restriction={restriction} userID={user.id} />
                    ))}
                  </Stack>

                  {
                    isStaff(currentUser)
                      ? <RequestWrapper2 result={getMakerspacesResult} render={(data) => {

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
                              color="error"
                              onClick={handleCreateRestriction}
                              startIcon={<LockIcon />}
                              sx={{ whiteSpace: "nowrap", minWidth: "unset" }}
                            >
                              Place Restriction
                            </Button>
                          </Stack>
                        );
                      }} />
                      : null
                  }

                  <PrivilegeControl user={user} isMobile={isMobile} />
                  <CardTagSettings userID={user.id} hasCardTag={(user.cardTagID != null && user.cardTagID !== "")} />
                  <ManageUserArchive userID={user.id} forceArchive={user.forceArchive} />
                </Stack>
              </Stack>

              {
                isManager(currentUser) &&
                <Stack spacing={1} mt={2}>
                  <Typography variant="h6" component="div">
                    Notes
                  </Typography>
                  <TextField
                    aria-label="Notes"
                    defaultValue={user.notes ?? ""}
                    placeholder="Notes"
                    value={notes}
                    onChange={handleNotesChanged}
                    onSubmit={() => setNotesMutation({ variables: { userID: userID, notes: notes } })}
                    multiline
                    minRows={2}
                  />
                  <Button
                    variant="contained"
                    loading={setNotesResult.loading}
                    onClick={() => setNotesMutation({ variables: { userID: userID, notes: notes } })}
                    sx={{ alignSelf: "flex-end" }}
                  >
                    Update Notes
                  </Button>
                </Stack>
              }
            </Stack>
          );
        }}
      />
    </Box>
  );
}
