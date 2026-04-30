import { Card, IconButton, Stack, Typography } from "@mui/material";
import { useIsMobile } from "../../../common/IsMobileProvider";
import { isManagerFor } from "../../../common/PrivilegeUtils";
import { useCurrentUser } from "../../../common/CurrentUserProvider";
import DeleteIcon from '@mui/icons-material/Delete';
import { useQuery } from "@apollo/client/react";
import { GET_EQUIPMENT_BY_ID } from "../../../queries/equipmentQueries";
import RequestWrapper2 from "../../../common/RequestWrapper2";
import { EquipmentWithRoom } from "../../../types/Equipment";

interface TrainerCardProps {
    equipmentID: number;
    removeTrainerPerms: (id: number)=>void;
}

export default function TrainerCard(props: TrainerCardProps) {
    const isMobile = useIsMobile();
    const currentUser = useCurrentUser();
    const getEquipmentResult = useQuery(GET_EQUIPMENT_BY_ID, {variables: {id: props.equipmentID}})

    return (
        <RequestWrapper2 result={getEquipmentResult} render={(data) => {
            
            const equipment: EquipmentWithRoom = data.equipment;

            return (
                <Card sx={{maxWidth: "200px", padding: "10px"}}>
                    <Stack direction={isMobile ? "column" : "row"} justifyContent="space-between">
                        <Typography variant="body2">{equipment.name} ID: {equipment.id}</Typography>
                        {
                            isManagerFor(currentUser, equipment.room.makerspace.id)
                            ? <IconButton color="error" onClick={() => {props.removeTrainerPerms(equipment.id)}}>
                                <DeleteIcon/>
                            </IconButton>
                            : null
                        }
                    </Stack>
                </Card>
            );
        }}/>
    );
}