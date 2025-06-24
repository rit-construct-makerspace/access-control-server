import { ChangeEvent, useEffect, useState } from "react";
import PrettyModal from "../../../common/PrettyModal";
import { Alert, Avatar, Box, Button, Card, Chip, FormControl, IconButton, InputLabel, MenuItem, Select, Stack, TextareaAutosize, Typography } from "@mui/material";
import { gql, useLazyQuery, useMutation, useQuery } from "@apollo/client";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import InfoBlob from "./InfoBlob";
import { format, parseISO } from "date-fns";
import RequestWrapper2 from "../../../common/RequestWrapper2";
import styled from "styled-components";
import HistoryIcon from "@mui/icons-material/History";
import PrivilegeControl from "./PrivilegeControl";
import { useNavigate } from "react-router-dom";
import HoldCard from "./HoldCard";
import { useCurrentUser } from "../../../common/CurrentUserProvider";
import CardTagSettings from "./CardTagSettings";
import AccessCheckCard from "./AccessCheckCard";
import ActionButton from "../../../common/ActionButton";
import { GET_ALL_EQUIPMENTS } from "../../../queries/equipmentQueries";
import RequestWrapper from "../../../common/RequestWrapper";
import CloseIcon from '@mui/icons-material/Close';
import { stringAvatar } from "../../../common/avatarGenerator";
import { isManager, isStaff, isStaffFor, isTrainerFor } from "../../../common/PrivilegeUtils";
import RestricitonCard from "./RestrictionCard";
import RestrictionCard from "./RestrictionCard";
import { useIsMobile } from "../../../common/IsMobileProvider";
import { FullZone, GET_FULL_ZONES } from "../../../queries/zoneQueries";
import LockIcon from '@mui/icons-material/Lock';

const StyledInfo = styled.div`
  margin-top: 16px;
  display: grid;
  grid-template-columns: 1fr 1fr;
  row-gap: 32px;
`;

export interface Hold {
  id: string;
  description: string;
  creator: {
    firstName: string;
    lastName: string;
  };
  remover?: {
    firstName: string;
    lastName: string;
  };
  createDate: string;
  removeDate?: string;
}

export interface Restriction {
  id: number;
  reason: string;
  creator: {
    firstName: string;
    lastName: string;
  };
  makerspace: {
    id: number;
    name: string;
  };
  createDate: string;
}

export interface AccessCheck {
  id: string;
  equipmentID: string;
  approved: boolean;
}

export const GET_USER = gql`
  query GetUser($id: ID!) {
    user(id: $id) {
      id
      firstName
      lastName
      pronouns      
      college
      expectedGraduation
      registrationDate
      privilege
      ritUsername
      cardTagID
      notes
      holds {
        id
        creator {
          firstName
          lastName
        }
        remover {
          firstName
          lastName
        }
        createDate
        removeDate
        description
      }
      restrictions {
        id
        creator {
          firstName
          lastName
        }
        makerspace {
          id
          name
        }
        reason
        createDate
      }
      accessChecks {
        id
        equipment {
          id
          name
          requiresTrainerApproval
          room {
            zone {
              id
            }
          }
        }
        approved
      }
      passedModules {
        moduleID
        moduleName
        submissionDate
      }
      trainingHolds {
        id
        module {
          id
          name
        }
        expires
      }
      admin
      manager
      staff
      trainer
    }
  }
`;

export const CREATE_HOLD = gql`
  mutation CreateHold($userID: ID!, $description: String!) {
    createHold(userID: $userID, description: $description) {
      id
    }
  }
`;

export const CREATE_RESTRICTION = gql`
  mutation CreateRestriction($userID: ID!, $makerspaceID: ID!, $reason: String!) {
    createRestriction(targetID: $userID, makerspaceID: $makerspaceID, reason: $reason) {
      id
    }
  }
`;

export const SET_NOTES = gql`
  mutation SetNotes($userID: ID!, $notes: String!) {
    setNotes(userID: $userID, notes: $notes) {
      id
    }
  }
`;

export const ARCHIVE_USER = gql`
  mutation ArchiveUser($userID: ID!) {
    archiveUser(userID: $userID) {
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


interface UserModalProps {
  selectedUserID: string;
  onClose: () => void;
}

export default function UserModal({ selectedUserID, onClose }: UserModalProps) {
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
  const [deleteUser] = useMutation(ARCHIVE_USER);
  const [setNotesMutation] = useMutation(SET_NOTES);
  const [refreshCheck, refreshCheckResult] = useMutation(REFRESH_CHECKS, { variables: { userID: selectedUserID }, refetchQueries: [{ query: GET_USER, variables: { id: selectedUserID } }] });
  const [createCheck] = useMutation(CREATE_CHECK, { refetchQueries: [{ query: GET_USER, variables: { id: selectedUserID } }] });
  const [deleteTrainingHold] = useMutation(DELETE_TRAINING_HOLD, { refetchQueries: [{ query: GET_USER, variables: { id: selectedUserID } }] });
  const getZonesResult = useQuery(GET_FULL_ZONES);

  useEffect(() => {
    if (selectedUserID) getUser({ variables: { id: selectedUserID } });
  }, [selectedUserID, getUser]);

  const handlePlaceHoldClicked = () => {
    const description = window.prompt("Enter hold description:");
    if (description == "") {
      window.alert("Description required.");
      return;
    }
    else if (!description) {
      return;
    }

    createHold({
      variables: { userID: getUserResult.data.user.id, description },
      refetchQueries: [{ query: GET_USER, variables: { id: selectedUserID } }],
    });
  };

  function handleCreateRestriction() {
    if (restrictionMakerspace == -1) {
      window.alert("Makerspace Required");
      return;
    }

    const reason = window.prompt("Enter reason for restriction:")
    if (reason == "") {
      window.alert("Reason required.");
      return;
    } else if (!reason) {
      return;
    }

    createRestriction({
      variables: { userID: getUserResult.data.user.id, makerspaceID: restrictionMakerspace, reason: reason },
      refetchQueries: [{query: GET_USER, variables: {id: selectedUserID}}]
    });
  }

  function handleTrainingHoldDeleteClick(id: number) {
    deleteTrainingHold({variables: {id}});
  }

  function handleCheckCreate() {
    if (!newCheckEquipmentID) return;
    createCheck({ variables: { userID: selectedUserID, equipmentID: newCheckEquipmentID } });
    setOpenCreateCheckDialouge(false);
  }

  const handleNotesChanged = (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setNotes(event.target.value)
  };

  return (
    <PrettyModal open={!!selectedUserID} onClose={onClose} width={isMobile ? 300 : 800}>
      <RequestWrapper2
        result={getUserResult}
        render={({ user }) => {
          const filteredACs: AccessCheck[] = user.accessChecks.filter(
            (ac: any) => (
              ac.equipment.requiresTrainerApproval
              ? isTrainerFor(currentUser, Number(ac.equipment.id), Number(ac.equipment.room.zone.id))
              : (isStaffFor(currentUser, Number(ac.equipment.room.zone.id)) || isTrainerFor(currentUser, Number(ac.equipment.id), Number(ac.equipment.room.zone.id)))
            )
          );

          return (
          <Stack>
            <Stack direction="row" justifyContent="space-between">
              <Stack direction="row" alignItems="baseline" spacing={2}>
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
              <IconButton color="error" onClick={onClose} sx={{width: "34px", height: "34px"}}>
                <CloseIcon/>
              </IconButton>
            </Stack>

            <StyledInfo>
              <InfoBlob
                label="Member Since"
                value={format(parseISO(user.registrationDate), "MM/dd/yyyy")}
              />
              <InfoBlob label="College" value={user.college} />
              <InfoBlob
                label="Expected Graduation"
                value={user.expectedGraduation}
              />
            </StyledInfo>

            <PrivilegeControl user={user} isMobile={isMobile} />

            <Typography variant="h6" component="div" mt={6} mb={1}>
              Account Holds
            </Typography>

            {user.holds.length === 0 && (
              <Alert severity="success">No Holds!</Alert>
            )}

            <Stack spacing={2}>
              {user.holds.map((hold: Hold) => (
                <HoldCard key={hold.id} hold={hold} userID={user.id} />
              ))}
            </Stack>

            <Button
              sx={{ mt: 2, alignSelf: "flex-start" }}
              variant="outlined"
              onClick={handlePlaceHoldClicked}
            >
              Place hold
            </Button>

            <Typography variant="h6" component="div" mt={6} mb={1}>
              Account Restrictions
            </Typography>

            {user.restrictions.length === 0 && (
              <Alert severity="success">No Restrictions!</Alert>
            )}

            <Stack spacing={2}>
              {user.restrictions.map((restriction: Restriction) => (
                <RestrictionCard key={restriction.id} restriction={restriction} userID={user.id}/>
              ))}
            </Stack>

            {
              isStaff(currentUser)
              ? <RequestWrapper2 result={getZonesResult} render={(data) => {

                const fullZones: FullZone[] = data.zones;
                // I hate typescript I hate typescript I hate typescript I hate typescript I hate typescript I hate typescript I hate typescript I hate typescript 
                const potentialRestrictions = fullZones.filter((zone: FullZone) => isStaffFor(currentUser, Number(zone.id)))

                return (
                  <Stack direction="row" spacing={1} mt={2}>
                    <FormControl fullWidth>
                      <InputLabel id="restriction-makerspace">Makerspace</InputLabel>
                      <Select id="restriction-makerspace"
                        label="Makerspace"
                        onChange={(e) => setRestrictionMakerspace(Number(e.target.value))}
                        fullWidth
                      >
                        {
                          potentialRestrictions.map((zone: FullZone) => (
                            <MenuItem value={zone.id}>{zone.name} ID: {zone.id}</MenuItem>
                          ))
                        }
                      </Select>
                    </FormControl>
                    <Button variant="contained" size="small" onClick={handleCreateRestriction} startIcon={<LockIcon/>}>
                      Place Restriction
                    </Button>
                  </Stack>
                );
              }} />
              : null
            }

            <Typography variant="h6" component="div" mt={6} mb={1}>
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

            <Stack spacing={2} mt={2}>
              {filteredACs != null && filteredACs.map((accessCheck: AccessCheck) => (
                <AccessCheckCard key={accessCheck.id} accessCheck={accessCheck} userID={user.id} />
              ))}
            </Stack>

            {filteredACs == null || filteredACs.length === 0 && (
              <Alert severity="info">No Access Checks Available</Alert>
            )}

            <Typography variant="h6" component="div" mt={6} mb={1}>
              Passed Trainings
            </Typography>

            {user.passedModules == null || user.passedModules.length === 0 && (
              <Alert severity="info">No Passed Trainings</Alert>
            )}

            <Box sx={{ maxHeight: "300px", overflowY: "scroll" }}>
              <Stack spacing={0.5}>
                {user.passedModules != null && user.passedModules.map((module: { moduleID: number, moduleName: string, submissionDate: string }) => (
                  <Card sx={{ p: "0.25em", backgroundColor: (localStorage.getItem("themeMode") == "dark" ? "grey.900" : "grey.100"), border: `1px solid grey` }}>
                    <Stack direction={"row"} sx={{ justifyContent: "space-between" }}>
                      <Typography>{module.moduleName}</Typography>
                      <Typography>{format(new Date(module.submissionDate), "M/d/yy h:mmaaa")}</Typography>
                    </Stack>
                  </Card>
                ))}
              </Stack>
            </Box>


            <Typography variant="h6" component="div" mt={6} mb={1}>
              Locked Trainings
            </Typography>

            {user.trainingHolds == null || user.trainingHolds.length === 0 && (
              <Alert severity="success">No Locked Trainings</Alert>
            )}

            <Box sx={{ maxHeight: "300px", overflowY: "scroll" }}>
              <Stack spacing={0.5}>
                {user.trainingHolds != null && user.trainingHolds.map((hold: { id: number; expires: Date; module: {id: number; name: string} }) => (
                  <Card sx={{ p: "0.25em", backgroundColor: (localStorage.getItem("themeMode") == "dark" ? "grey.900" : "grey.100"), border: `1px solid grey` }}>
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


            <Typography variant="h6" component="div" mt={6} mb={1}>
              Actions
            </Typography>

            <Stack direction="row" spacing={2}>
              <Button
                startIcon={<HistoryIcon />}
                variant="outlined"
                onClick={() => navigate(`/admin/history?q=<user:${user.id}:`)}
              >
                View logs
              </Button>
            </Stack>

            <CardTagSettings userID={user.id} hasCardTag={(user.cardTagID != null && user.cardTagID != "")} />

            {isManager(currentUser) &&
              <>
                <Typography variant="h6" component="div" mt={6} mb={1}>
                  Notes
                </Typography>

                <TextareaAutosize
                  style={{ background: "none", fontFamily: "Roboto", fontSize: "1em", lineHeight: "2em", marginTop: "2em", marginBottom: "2em" }}
                  aria-label="Notes"
                  defaultValue={user.notes ?? ""}
                  placeholder="Notes"
                  value={notes}
                  onChange={handleNotesChanged}
                  onSubmit={(e) => setNotesMutation({ variables: { userID: selectedUserID, notes: notes } })}></TextareaAutosize>
                <Button
                  variant="contained"
                  onClick={() => setNotesMutation({ variables: { userID: selectedUserID, notes: notes } })}
                  sx={{ mt: 8, alignSelf: "flex-end" }}
                >
                  Update Notes
                </Button>
              </>}
          </Stack>
        );}}
      />
    </PrettyModal>
  );
}
