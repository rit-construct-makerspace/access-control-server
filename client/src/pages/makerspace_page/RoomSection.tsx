import { Alert, CardActionArea, Divider, Grid, Stack, Typography } from "@mui/material";
import Room, { FullRoom } from "../../types/Room";
import Equipment from "../../types/Equipment";
import EquipmentCard from "../../common/EquipmentCard";
import { useCurrentUser } from "../../common/CurrentUserProvider";
import { useState } from "react";
import { ModuleStatus, moduleStatusMapper } from "../../common/TrainingModuleUtils";
import { useIsMobile } from "../../common/IsMobileProvider";
import { useNavigate } from "react-router-dom";
import WarningIcon from "@mui/icons-material/Warning";
import HourglassBottomIcon from '@mui/icons-material/HourglassBottom';
import LockClockIcon from '@mui/icons-material/LockClock';
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CloseIcon from "@mui/icons-material/Close";

interface RoomSectionProps {
    room: Room;
    equipmentSearch: string;
    isMobile: boolean;
    staffMode: boolean;
}

export default function RoomSection(props: RoomSectionProps) {
    const currentUser = useCurrentUser();
    const isMobile = useIsMobile();
    const navigate = useNavigate();
    const roomEquipment = props.room.equipment;

    const filteredEquipment = roomEquipment.filter((equipment: Equipment) => equipment.name.toLowerCase().includes(props.equipmentSearch.toLowerCase()))
    const sortedEquipment = filteredEquipment.sort((a, b) => (a.name.toLowerCase().localeCompare(b.name.toLowerCase())));
    const archivedEquipment = sortedEquipment.filter((equipment: Equipment) => equipment.archived);
    const liveEquipment = sortedEquipment.filter((equipment: Equipment) => !equipment.archived);

    const [manageEquipment, setManageEquipment] = useState(false);
    const [curEquipID, setCurEquipID] = useState(0);

    function handleOpen(id: number) {
        setCurEquipID(id);
        setManageEquipment(true);
    }

    function handleClose() {
        setManageEquipment(false);
    }

    const roomTrainings = props.room.trainingModules.map(moduleStatusMapper(currentUser.passedModules, currentUser.trainingHolds));

    return (
        <Stack padding={"10px 0"} spacing={1}>
            <Typography variant="h4" pl={"10px"}>{props.room.name}</Typography>
            {
                roomTrainings.length > 0 &&
                <Stack direction={"column"} alignItems={isMobile ? "center" : "flex-start"} pl={"10px"} spacing={1}>
                    <Stack direction={isMobile ? "column" : "row"} spacing={2} alignItems={"center"}>
                        <Typography variant="h6">Area Trainings</Typography>
                        {
                            roomTrainings.some((ms) => (ms.status != "Passed" && ms.status != "Expiring Soon"))
                                ? <Alert severity="error">You must pass the area trainings before you can use equipment in the area!</Alert>
                                : null
                        }
                    </Stack>
                    <Stack direction={"row"} spacing={1} alignItems={"center"}>
                        {
                            roomTrainings.length > 0 && roomTrainings.map((ms: ModuleStatus) => (
                                <CardActionArea onClick={() => navigate(`/maker/training/${ms.moduleID}`)} sx={{ width: "max-content" }}>
                                    <Stack direction="row" spacing={1} alignItems="center" padding="10px">
                                        {
                                            ms.status === "Passed"
                                                ? <CheckCircleIcon color="success" />
                                                : ms.status === "Not taken"
                                                    ? <CloseIcon color="error" />
                                                    : ms.status === "Expired"
                                                        ? <WarningIcon color="warning" />
                                                        : ms.status === "Expiring Soon"
                                                            ? <HourglassBottomIcon color="warning" />
                                                            : ms.status === "Locked"
                                                                ? <LockClockIcon color="error" />
                                                                : null
                                        }
                                        <Typography variant="body1">{ms.moduleName}</Typography>
                                    </Stack>
                                </CardActionArea>
                            ))
                        }
                    </Stack>
                    <Divider orientation="horizontal" variant="fullWidth" flexItem />
                </Stack>
            }
            <Grid container spacing={3} justifyContent="center">
                {
                    liveEquipment.map((equipment: Equipment) => (
                        <Grid key={equipment.id}>
                            <EquipmentCard equipment={equipment} isMobile={props.isMobile} staffMode={props.staffMode} />
                        </Grid>
                    ))
                }
                {
                    props.staffMode
                        ? archivedEquipment.map((equipment: Equipment) => (
                            <Grid key={equipment.id}>
                                <EquipmentCard equipment={equipment} isMobile={props.isMobile} staffMode={props.staffMode} />
                            </Grid>
                        ))
                        : null
                }
            </Grid>
        </Stack>
    );
}