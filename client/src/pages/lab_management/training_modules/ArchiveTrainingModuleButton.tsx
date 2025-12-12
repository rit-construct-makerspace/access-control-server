import { useMutation } from "@apollo/client";
import ArchiveButton from "../../../common/ArchiveButton";
import { ARCHIVE_MODULE, GET_ARCHIVED_MODULE, GET_ARCHIVED_TRAINING_MODULES, GET_TRAINING_MODULES } from "../../../queries/trainingQueries";
import { toast } from "react-toastify";

interface ArchiveTrainingModuleButtonProps {
  moduleID: number;
  appearance: "icon-only" | "small" | "medium" | "large"
}

export default function ArchiveTrainingModuleButton(props: ArchiveTrainingModuleButtonProps) {
  const [archiveTrainingModule, { loading }] = useMutation(ARCHIVE_MODULE, {
    variables: { id: props.moduleID },
    onCompleted: () => {
      toast.success("Training Module Archived", {
        position: "bottom-left",
        autoClose: 3000,
      });
    },
    refetchQueries: [
      { query: GET_TRAINING_MODULES },
      { query: GET_ARCHIVED_TRAINING_MODULES },
      { query: GET_ARCHIVED_MODULE, variables: { id: props.moduleID } },
    ]
  });

  const handleClick = async () => {
    await archiveTrainingModule();
  };

  return (
    <ArchiveButton
      appearance={props.appearance}
      handleClick={handleClick}
      loading={loading}
      tooltipText="Archive Module"
    />
  );
}
