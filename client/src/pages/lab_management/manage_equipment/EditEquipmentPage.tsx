import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import NewEquipmentEditor from "./NewEquipmentEditor";
import ExistingEquipmentEditor from "./ExistingEquipmentEditor";
import ArchivedEquipmentEditor from "./ArchivedEquipmentEditor";
import { ObjectSummary } from "../../../types/Common";

export type MutationCallback = (options: object) => void;

export interface Equipment {
  imageUrl: string | null;
  sopUrl: string | null;
  id: number | null;
  name: string;
  room: ObjectSummary | null;
  trainingModules: ObjectSummary[];
  archived: boolean;
  notes: string;
  byReservationOnly: boolean;
  needsWelcome: boolean;
  requiresTrainerApproval: boolean;
}

interface EditEquipmentPageProps {
  archived: boolean;
}

export default function EditEquipmentPage(props: EditEquipmentPageProps) {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [equipment, setEquipment] = useState<Equipment>({
    id: null,
    name: "",
    room: null,
    trainingModules: [],
    archived: props.archived,
    imageUrl: null,
    sopUrl: "",
    notes: "",
    byReservationOnly: false,
    needsWelcome: true,
    requiresTrainerApproval: false,
  });

  const newEquipment = id === "new";

  const handleSave = async (mutation: MutationCallback, variables: object) => {
    if (!equipment.name) {
      window.alert("Please specify a name.");
      return;
    }

    if (!equipment.room) {
      window.alert("Please specify a room.");
    }

    await mutation({ variables });
    
    navigate("/");
  };

  return (
    <>
      <title>Edit Equipment | Make @ RIT</title>
      {newEquipment ? (
        <NewEquipmentEditor
          equipment={equipment}
          setEquipment={setEquipment}
          onSave={handleSave}
        />
      ) : props.archived ? (
        <ArchivedEquipmentEditor
          equipment={equipment}
          setEquipment={setEquipment}
          onSave={handleSave}
        />
      ) :
      (
        <ExistingEquipmentEditor
          equipment={equipment}
          setEquipment={setEquipment}
          onSave={handleSave}
        />
      )}
    </>
  );
}
