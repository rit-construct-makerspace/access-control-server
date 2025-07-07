import { useEffect } from "react";
import { useParams } from "react-router-dom";
import { Equipment, MutationCallback } from "./EditEquipmentPage";
import { useMutation, useQuery } from "@apollo/client";
import GET_EQUIPMENTS, { GET_ARCHIVED_EQUIPMENTS, GET_EQUIPMENT_BY_ID, UPDATE_EQUIPMENT } from "../../../queries/equipmentQueries";
import EquipmentEditor from "./EquipmentEditor";
import RequestWrapper from "../../../common/RequestWrapper";
import { ObjectSummary } from "../../../types/Common";

interface ExistingEquipmentProps {
  equipment: Equipment;
  setEquipment: (equipment: Equipment) => void;
  onSave: (mutation: MutationCallback, options: object) => void;
}

export default function ExistingEquipmentEditor({
  equipment,
  setEquipment,
  onSave,
}: ExistingEquipmentProps) {
  const { id } = useParams<{ id: string }>();

  const getEquipmentResult = useQuery(GET_EQUIPMENT_BY_ID, { variables: { id } });

  const [updateEquipment] = useMutation(UPDATE_EQUIPMENT, {
    refetchQueries: [
      { query: GET_EQUIPMENTS },
      { query: GET_ARCHIVED_EQUIPMENTS },
      { query: GET_EQUIPMENT_BY_ID, variables: { id } },
    ],
  });

  useEffect(() => {
    const queriedEquipment = getEquipmentResult.data?.equipment;

    if (!queriedEquipment) return;

    setEquipment(queriedEquipment);
  }, [getEquipmentResult.data, setEquipment]);

  return (
    <RequestWrapper
      loading={getEquipmentResult.loading}
      error={getEquipmentResult.error}
    >
      <EquipmentEditor
        newEquipment={false}
        equipment={equipment}
        setEquipment={setEquipment}
        onSave={() =>
          onSave(updateEquipment, {
            id,
            name: equipment.name,
            roomID: equipment.room?.id,
            moduleIDs: equipment.trainingModules.map((m: ObjectSummary) => m.id),
            imageUrl: equipment.imageUrl ?? "",
            sopUrl: equipment.sopUrl ?? "",
            notes: equipment.notes ?? "",
            byReservationOnly: equipment.byReservationOnly,
            needsWelcome: equipment.needsWelcome,
            requiresTrainerApproval: equipment.requiresTrainerApproval
          })
        }
      />
    </RequestWrapper>
  );
}
