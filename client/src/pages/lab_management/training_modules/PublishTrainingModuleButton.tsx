import { useMutation } from "@apollo/client";
import PublishButton from "../../../common/PublishButton";
import GET_TRAINING_MODULES, { GET_ARCHIVED_TRAINING_MODULES, GET_MODULE, PUBLISH_MODULE } from "../../../queries/trainingQueries";

interface PublishTrainingModuleButtonProps {
  moduleID: number;
  appearance: "icon-only" | "small" | "medium" | "large";
}

export default function PublishTrainingModuleButton(props: PublishTrainingModuleButtonProps) {
  const [publishTrainingModule, { loading }] = useMutation(PUBLISH_MODULE, {
    variables: { id: props.moduleID },
    refetchQueries: [
      {query: GET_TRAINING_MODULES},
      {query: GET_ARCHIVED_TRAINING_MODULES},
      {query: GET_MODULE, variables: {id: props.moduleID}}
    ]
  });

  const handleClick = async () => {
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
