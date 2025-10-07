import { useMutation } from "@apollo/client";
import DeleteButton from "../../../common/DeleteButton";
import GET_TRAINING_MODULES, { DELETE_MODULE } from "../../../queries/trainingQueries";

interface DeleteTrainingModuleButtonProps {
  moduleID: number;
  appearance: "icon-only" | "small" | "medium" | "large";
  handleClick: () => Promise<void>;
}

export default function DeleteTrainingModuleButton(props: DeleteTrainingModuleButtonProps) {
  const [deleteTrainingModule, { loading }] = useMutation(DELETE_MODULE, {
    variables: { id: props.moduleID},
    refetchQueries: [
      { query: GET_TRAINING_MODULES },
    ]
  });

  const handleClick = async () => {
    window.confirm("Are you sure you want to delete this training module? This cannot be undone.")
    if (!confirm) return;

    await deleteTrainingModule();
  }

  return (
    <DeleteButton 
      appearance={props.appearance} 
      handleClick={props.handleClick || handleClick}
      loading={loading}
      tooltipText="Delete Module"
    />
  );
}