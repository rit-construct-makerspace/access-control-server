import { useMutation } from "@apollo/client";
import PublishButton from "../../../common/PublishButton";
import GET_TRAINING_MODULES, { GET_ARCHIVED_TRAINING_MODULES, GET_MODULE, PUBLISH_MODULE, UPDATE_MODULE } from "../../../queries/trainingQueries";
import { toast } from "react-toastify";

interface PublishTrainingModuleButtonProps {
  moduleID: number;
  appearance: "icon-only" | "small" | "medium" | "large";
  onBeforePublish?: () => Promise<void>; 
}

export default function PublishTrainingModuleButton(props: PublishTrainingModuleButtonProps) {
  const [publishTrainingModule, { loading }] = useMutation(PUBLISH_MODULE, {
    variables: { id: props.moduleID },
    onCompleted: () => {
      toast.success("Training Module Published", {
        position: "bottom-left",
        autoClose: 3000,
      });
    },
    refetchQueries: [
      {query: GET_TRAINING_MODULES},
      {query: GET_ARCHIVED_TRAINING_MODULES},
      {query: GET_MODULE, variables: {id: props.moduleID}}
    ]
  });

  const handleClick = async () => {
    if (props.onBeforePublish) {
      try {
        await props.onBeforePublish();
      } catch (error) {
        console.error("Error before publishing module:", error);
        return; // Abort publishing if onBeforePublish fails
      }
    } 
    await publishTrainingModule();
  };

  return (
    <PublishButton
      appearance={props.appearance}
      handleClick={handleClick}
      loading={loading}
      tooltipText="Publish Module"
    />
  );
}
