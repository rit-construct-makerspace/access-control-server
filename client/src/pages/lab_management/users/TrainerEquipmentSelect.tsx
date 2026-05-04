import { useQuery } from "@apollo/client/react";
import { useCurrentUser } from "../../../common/CurrentUserProvider"
import { GET_EQUIPMENTS } from "../../../queries/equipmentQueries";
import { FormControl, InputLabel, MenuItem, Select } from "@mui/material";
import RequestWrapper2 from "../../../common/RequestWrapper2";
import { isManagerFor } from "../../../common/PrivilegeUtils";

interface TrainerEquipmentSelectProps {
    user: any;
    setAddTrainerPerms: (id: number) => void;
}

export default function TrainerEquipmentSelect(props: TrainerEquipmentSelectProps) {
    const currentUser = useCurrentUser();

    const getEquipmentResult = useQuery(GET_EQUIPMENTS);

    return (
        <RequestWrapper2 result={getEquipmentResult} render={(data) => {

            const equipments: any[] = data.equipments;

            const possibleEquipments = equipments.filter((equipment) => isManagerFor(currentUser, Number(equipment.room.makerspace.id)) && !props.user.trainer.includes(Number(equipment.id)));
            const sortedEquipment = possibleEquipments.sort((a, b) => (a.name.toLowerCase().localeCompare(b.name.toLowerCase())));

            return (
                <FormControl fullWidth>
                    <InputLabel id="add-trainer-permissions">Equipment</InputLabel>
                    <Select id="add-trainer-permissions" label="Equipment" fullWidth onChange={(e) => props.setAddTrainerPerms(Number(e.target.value))}>
                        {
                            sortedEquipment.map((equipment) => {
                                return <MenuItem value={equipment.id}>{equipment.name} ID: {equipment.id}</MenuItem>
                            })
                        }
                    </Select>
                </FormControl>
            );
        }} />
    );
}