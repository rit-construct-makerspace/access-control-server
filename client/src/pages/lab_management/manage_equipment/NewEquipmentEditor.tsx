import { useMutation } from "@apollo/client";
import GET_EQUIPMENTS, { GET_ARCHIVED_EQUIPMENTS } from "../../../queries/equipmentQueries";
import { ObjectSummary } from "../../../types/Common";
import EquipmentEditor from "./EquipmentEditor";
import { Equipment, MutationCallback } from "./EditEquipmentPage";
import { CREATE_EQUIPMENT } from "../../../queries/equipmentQueries"


interface NewEquipmentProps {
  equipment: Equipment;
  setEquipment: (equipment: Equipment) => void;
  onSave: (mutation: MutationCallback, variables: object) => void;
}

export default function NewEquipmentEditor({
  equipment,
  setEquipment,
  onSave,
}: NewEquipmentProps) {
  const [createEquipment] = useMutation(CREATE_EQUIPMENT, {
    refetchQueries: [
      { query: GET_EQUIPMENTS },
      { query: GET_ARCHIVED_EQUIPMENTS }
    ],
  });

  return (
    <EquipmentEditor
      newEquipment={true}
      equipment={equipment}
      setEquipment={setEquipment}
      onSave={() =>
        onSave(createEquipment, {
          name: equipment.name,
          roomID: equipment.room?.id,
          moduleIDs: equipment.trainingModules.map((m: ObjectSummary) => m.id),
          imageUrl: equipment.imageUrl ?? "",
          sopUrl: equipment.sopUrl ?? "",
          notes: equipment.notes ?? "",
          byReservationOnly: equipment.byReservationOnly,
          needsWelcome: equipment.needsWelcome,
          requiresTrainerApproval: equipment.requiresTrainerApproval,
        })
      }
    />
  );
}
