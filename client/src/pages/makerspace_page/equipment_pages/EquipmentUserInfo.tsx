import PersonIcon from '@mui/icons-material/Person';
import { useParams } from "react-router-dom";
import { GET_EQUIPMENT_BY_ID } from "../../../queries/equipmentQueries";
import { Alert, Button, CardActionArea, LinearProgress, Typography } from "@mui/material";
import { useQuery } from "@apollo/client/react";
import { Equipment } from "./ManageEquipmentPage";
import { Stack } from "@mui/system";
import { useCurrentUser } from "../../../common/CurrentUserProvider";
import { ModuleStatus, moduleStatusMapper, TrainingModule } from "../../../common/TrainingModuleUtils";
import { FullMakerspace, GET_MAKERSPACE_BY_ID } from "../../../queries/makerspaceQueries";
import { GET_ROOM } from "../../../queries/roomQueries";
import RequestWrapper from "../../../common/RequestWrapper";
import Room from "../../../types/Room";
import { ReactNode } from "react";
import { IS_USER_WELCOMED } from "../../../queries/userQueries";
import ModuleStatusRow from "../../../common/ModuleStatusRow";
import RadioButtonUncheckedIcon from "@mui/icons-material/RadioButtonUnchecked";
import CloseIcon from "@mui/icons-material/Close";
import CheckIcon from '@mui/icons-material/Check';
import { Link } from "react-router-dom";

export default function EquipmentUserInfo() {
    const user = useCurrentUser();
    const isVisitor = user.visitor;


    const { makerspaceID, equipmentID } = useParams<{ makerspaceID: string, equipmentID: string }>();
    const getEquipmentByIDResult = useQuery(GET_EQUIPMENT_BY_ID, {
        variables: {
            id: equipmentID,
        },
    });
    const getMakerspaceResult = useQuery(GET_MAKERSPACE_BY_ID, {
        variables: {
            id: makerspaceID,
        },
    });

    const getRoomResult = useQuery(GET_ROOM, {
        variables: {
            id: getEquipmentByIDResult.data?.equipment?.room?.id ?? -1,
        }
    });
    const isWelcomedResult = useQuery(IS_USER_WELCOMED, {
        variables: {
            userID: user.id,
            roomID: getEquipmentByIDResult?.data?.equipment?.room?.id ?? -1,
        }
    });

    function unfinishedTrainingWarning(): ReactNode {
        return <Alert severity="warning" title="Unfinished Training">
            <Stack>
                <Typography variant="body1">
                    It looks like you haven't finished your trainings yet.
                    Scroll down to see what's left.
                </Typography>
            </Stack>
        </Alert>
    }
    function noInPersonAccessCheck(): ReactNode {
        return <Alert severity="warning" title="No access check">
            <Stack>
                <Typography variant="body1">
                    Almost there! Before you unlock the machine, you must take an in person access check. Talk to a staff member to start this process.
                </Typography>
            </Stack>
        </Alert>
    }
    function unwelcomedWarning(): ReactNode {
        return <Alert severity="warning" title="Not yet signed">
            It looks like you haven't signed in today. Tap your card at the front desk to sign in to the space.
        </Alert>
    }
    function allGood(): ReactNode {
        return <Alert severity="success">
            Qualifications complete! Talk to staff if you're still having issues.
        </Alert>
    }



    function renderPage(isWelcomed: boolean | undefined, equipment: Equipment | undefined, room: Room | undefined, makerspace: FullMakerspace | undefined) {

        if (!equipment || !room || !makerspace) {
            return <Alert severity="error">Failed to load equipment requirements</Alert>
        }

        const hasApprovedAccessCheck: boolean = user.accessChecks.some((ac) => Number(ac.equipmentID) === Number(equipment.id) && ac.approved)

        const makerspaceStatuses: ModuleStatus[] = makerspace.trainingModules.map(moduleStatusMapper(user.passedModules, user.trainingHolds));
        const roomStatuses: ModuleStatus[] = room.trainingModules.map(moduleStatusMapper(user.passedModules, user.trainingHolds));
        const equipmentStatuses: ModuleStatus[] = equipment.trainingModules.map((obj) => moduleStatusMapper(user.passedModules, user.trainingHolds)(obj as TrainingModule));

        const numMakerspaceTrainingsComplete: number = makerspaceStatuses.filter((module) => module.status === "Passed" || module.status === "Expiring Soon").length;
        const numRoomTrainingsComplete: number = roomStatuses.filter((module) => module.status === "Passed" || module.status === "Expiring Soon").length;
        const numEquipmentTrainingsComplete: number = equipmentStatuses.filter((module) => module.status === "Passed" || module.status === "Expiring Soon").length

        const byExpiry = [...makerspaceStatuses, ...roomStatuses, ...equipmentStatuses]
            .filter((module) => module.status === "Expiring Soon" || module.status === "Passed")
            .sort((a, b) => new Date(a.expirationDate).getTime() - new Date(b.expirationDate).getTime());

        const totalRequirements = makerspaceStatuses.length + roomStatuses.length + equipmentStatuses.length + (equipment.requiresInPerson ? 1 : 0);
        const totalReqsComplete = numMakerspaceTrainingsComplete + numRoomTrainingsComplete + numEquipmentTrainingsComplete + ((hasApprovedAccessCheck && equipment.requiresInPerson) ? 1 : 0);

        const percentComplete: number = Math.round(totalReqsComplete / totalRequirements * 100);


        let warningMessage: () => ReactNode = unfinishedTrainingWarning;
        const hasAllTrainings = (numMakerspaceTrainingsComplete + numRoomTrainingsComplete + numEquipmentTrainingsComplete) >= makerspaceStatuses.length + roomStatuses.length + equipmentStatuses.length;
        if (!hasAllTrainings) {
            warningMessage = unfinishedTrainingWarning;
        } else if (!hasApprovedAccessCheck && equipment.requiresInPerson) {
            warningMessage = noInPersonAccessCheck;
        } else if (!isWelcomed && equipment.needsWelcome) {
            warningMessage = unwelcomedWarning;
        } else {
            warningMessage = allGood;
        }


        return <Stack padding={"20px 20px 15px"} spacing="10px" justifyContent={"center"} alignItems={"center"} display={"flex"}>
            {warningMessage()}
            <Typography variant="h1" fontSize="1.5em" fontWeight={"400"} >{equipment.name}</Typography>
            <LinearProgress
                variant="determinate"
                value={percentComplete}
                color={
                    totalReqsComplete !== totalRequirements
                        ? "primary"
                        : byExpiry.length > 0 && byExpiry[0].status === "Expiring Soon"
                            ? "warning"
                            : "success"
                }
                sx={{
                    width: "95%",
                    height: "16px"
                }}
            />
            <Typography variant="subtitle1" fontWeight={"bold"} display={"item"}>
                {
                    totalReqsComplete !== totalRequirements
                        ? `Training ${percentComplete}% Complete`
                        : byExpiry.length > 0 && byExpiry[0].status === "Expiring Soon"
                            ? "Expiring Soon!"
                            : "Trainings Complete!"
                }
            </Typography>

            <Stack spacing={2}>
                {
                    makerspace.trainingModules.length > 0
                        ? <Stack>
                            <Typography variant="h6">Makerspace Requirements</Typography>
                            {
                                makerspaceStatuses.map((moduleStatus) => <ModuleStatusRow ms={moduleStatus} />)
                            }
                        </Stack>
                        : null
                }
                {
                    room.trainingModules.length > 0
                        ? <Stack>
                            <Typography variant="h6">Area Requirements</Typography>
                            {
                                roomStatuses.map((moduleStatus) => <ModuleStatusRow ms={moduleStatus} />)
                            }
                        </Stack>
                        : null
                }
                {
                    (equipment.trainingModules.length > 0 || equipment.requiresInPerson)
                        ? <Stack>
                            <Typography variant="h6">Equipment Requirements</Typography>
                            {
                                equipmentStatuses.map((moduleStatus) => <ModuleStatusRow ms={moduleStatus} />)
                            }
                            {
                                equipment.requiresInPerson
                                    ? <CardActionArea
                                        onClick={equipment.signOffUrl ? () => window.open(equipment.signOffUrl, "_blank noopener noreferrer") : undefined}
                                        disableRipple={equipment.signOffUrl === ""}
                                    >
                                        <Stack direction={"row"} spacing={1} alignItems="center" padding="7px">
                                            {user.visitor ? (
                                                <RadioButtonUncheckedIcon color="secondary" />
                                            ) : hasApprovedAccessCheck ? (
                                                <CheckIcon color="success" />
                                            ) : (
                                                <CloseIcon color="error" />
                                            )}
                                            <Stack direction={"column"} width={"100%"}>
                                                {
                                                    equipment.signOffUrl !== ""
                                                        ? <Link variant="body2">Staff Sign-Off</Link>
                                                        : <Typography variant="body2">Staff Sign-Off</Typography>
                                                }
                                                {
                                                    (equipment.requiresInPerson && !hasApprovedAccessCheck)
                                                        ? <Typography variant="body2">Complete all other requirments before attempting sign-off!</Typography>
                                                        : null
                                                }
                                            </Stack>
                                        </Stack>
                                    </CardActionArea>
                                    : null
                            }
                        </Stack>
                        : null
                }
            </Stack>
            <Button
                color="info"
                variant="contained"
                onClick={() => window.open(equipment.sopUrl, "_blank")}

            >Equipment Information</Button>
        </Stack>
    }

    function renderVisitor(equipment: Equipment | undefined) {
        if (!equipment) {
            return <Alert severity="error">Failed to load equipment information</Alert>
        }
        return <Stack padding="10px" spacing="10px">
            <Typography variant="h1" fontSize="1.5em" fontWeight={"400"} >{equipment.name}</Typography>
            To view equipment prerequisites, please log in.
            <Button
                variant="contained"
                color="secondary"
                endIcon={<PersonIcon />}
                onClick={() => window.location.replace(import.meta.env.VITE_LOGIN_URL + "?redir=" + import.meta.env.VITE_ORIGIN + window.location.pathname)}
            >
                LOGIN
            </Button>
        </Stack>

    }

    return <RequestWrapper loading={getEquipmentByIDResult.loading || getMakerspaceResult.loading || getRoomResult.loading} error={getEquipmentByIDResult.error || getMakerspaceResult.error || getRoomResult.error} minHeight={322}>
        <title>{(getEquipmentByIDResult?.data?.equipment as Equipment)?.name ?? "Equipment Checklist"}</title>
        {
            isVisitor
                ? renderVisitor(getEquipmentByIDResult?.data?.equipment as Equipment)
                : renderPage(isWelcomedResult?.data?.isUserWelcomed ? isWelcomedResult?.data?.isUserWelcomed : false, getEquipmentByIDResult?.data?.equipment as Equipment, getRoomResult.data?.room as Room, getMakerspaceResult.data?.makerspaceByID as FullMakerspace)
        }
    </RequestWrapper>
}