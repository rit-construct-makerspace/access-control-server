import { Alert, Divider, Grid, Stack, Typography } from "@mui/material";
import Room from "../../types/Room";
import Equipment from "../../types/Equipment";
import EquipmentCard from "../../common/EquipmentCard";
import { useCurrentUser } from "../../common/CurrentUserProvider";
import { ModuleStatus, moduleStatusMapper } from "../../common/TrainingModuleUtils";
import { useIsMobile } from "../../common/IsMobileProvider";
import ModuleStatusRow from "../../common/ModuleStatusRow";

interface RoomSectionProps {
    room: Room;
    equipmentSearch: string;
    isMobile: boolean;
    staffMode: boolean;
    showHidden: boolean;
}

export default function RoomSection(props: RoomSectionProps) {
    const currentUser = useCurrentUser();
    const isMobile = useIsMobile();
    const roomEquipment = props.room.equipment;

    const filteredEquipment = roomEquipment.filter((equipment: Equipment) => equipment.name.toLowerCase().includes(props.equipmentSearch.toLowerCase()))
    const sortedEquipment = filteredEquipment.sort((a, b) => (a.name.toLowerCase().localeCompare(b.name.toLowerCase())));
    const archivedEquipment = sortedEquipment.filter((equipment: Equipment) => equipment.archived);
    const liveEquipment = sortedEquipment.filter((equipment: Equipment) => !equipment.archived);

    const roomTrainings = props.room.trainingModules.map(moduleStatusMapper(currentUser.passedModules, currentUser.trainingHolds));

    if (liveEquipment.length < 1) {
        return null;
    }

    return (
        <Stack padding={"10px 0"} spacing={1}>
            <Typography variant="h4" pl={"10px"}>{props.room.name}</Typography>
            {
                roomTrainings.length > 0 &&
                <Stack direction={"column"} alignItems={isMobile ? "center" : "flex-start"} pl={"10px"} spacing={1}>
                    <Stack direction={isMobile ? "column" : "row"} spacing={2} alignItems={"center"}>
                        <Typography variant="h6">Area Trainings</Typography>
                        {
                            roomTrainings.some((ms) => (ms.status !== "Passed" && ms.status !== "Expiring Soon"))
                                ? <Alert severity="error">You must pass the area trainings before you can use equipment in the area!</Alert>
                                : null
                        }
                    </Stack>
                    <Stack direction={isMobile ? "column" : "row"} spacing={1} alignItems={"center"}>
                        {
                            roomTrainings.length > 0 && roomTrainings.map((ms: ModuleStatus) => (
                                <ModuleStatusRow ms={ms} />
                            ))
                        }
                    </Stack>
                    <Divider orientation="horizontal" variant="fullWidth" flexItem />
                </Stack>
            }
            <Grid container spacing={isMobile ? 2 : 3} justifyContent="center">
                {
                    liveEquipment.map((equipment: Equipment) => (
                        <Grid key={equipment.id}>
                            <EquipmentCard equipment={equipment} isMobile={props.isMobile} staffMode={props.staffMode} />
                        </Grid>
                    ))
                }
                {
                    (props.staffMode && props.showHidden)
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