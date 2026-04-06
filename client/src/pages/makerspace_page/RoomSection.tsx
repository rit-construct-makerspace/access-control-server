import { Grid, Stack, Typography } from "@mui/material";
import Room from "../../types/Room";
import Equipment from "../../types/Equipment";
import EquipmentCard from "../../common/EquipmentCard";
import { TrainingModule } from "../../common/TrainingModuleUtils";
import { useIsMobile } from "../../common/IsMobileProvider";

interface RoomSectionProps {
  room: Room;
  equipmentSearch: string;
  isMobile: boolean;
  staffMode: boolean;
  showHidden: boolean;
  makerspaceTrainings: {
    id: number;
    name: string;
    trainingModules: TrainingModule[];
  }
}

export default function RoomSection(props: RoomSectionProps) {
  const isMobile = useIsMobile();
  const roomEquipment = props.room.equipment;

  const filteredEquipment = roomEquipment.filter((equipment: Equipment) => equipment.name.toLowerCase().includes(props.equipmentSearch.toLowerCase()) || equipment.subName.toLowerCase().includes(props.equipmentSearch.toLowerCase()))
  const sortedEquipment = filteredEquipment.sort((a, b) => (a.name.toLowerCase().localeCompare(b.name.toLowerCase())));
  const archivedEquipment = sortedEquipment.filter((equipment: Equipment) => equipment.archived);
  const liveEquipment = sortedEquipment.filter((equipment: Equipment) => !equipment.archived);

  if (liveEquipment.length < 1) {
    return null;
  }

  return (
    <Stack padding={"10px 0"} spacing={1}>
      <Typography variant="h4" pl={"10px"}>{props.room.name}</Typography>
      <Grid container spacing={isMobile ? 2 : 3} justifyContent="center">
        {
          liveEquipment.map((equipment: Equipment) => (
            <Grid key={equipment.id}>
              <EquipmentCard
                equipment={equipment}
                isMobile={props.isMobile}
                staffMode={props.staffMode}
                makerspaceTrainings={props.makerspaceTrainings}
                roomTrainings={{
                  id: props.room.id,
                  name: props.room.name,
                  trainingModules: props.room.trainingModules
                }}
              />
            </Grid>
          ))
        }
        {
          (props.staffMode && props.showHidden)
            ? archivedEquipment.map((equipment: Equipment) => (
              <Grid key={equipment.id}>
                <EquipmentCard
                  equipment={equipment}
                  isMobile={props.isMobile}
                  staffMode={props.staffMode}
                  makerspaceTrainings={props.makerspaceTrainings}
                  roomTrainings={{
                    id: props.room.id,
                    name: props.room.name,
                    trainingModules: props.room.trainingModules
                  }}
                />
              </Grid>
            ))
            : null
        }
      </Grid>
    </Stack>
  );
}