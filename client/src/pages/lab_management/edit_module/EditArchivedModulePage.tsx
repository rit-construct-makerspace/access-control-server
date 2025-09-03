import { useMutation, useQuery } from "@apollo/client";
import { useNavigate, useParams } from "react-router-dom";
import RequestWrapper2 from "../../../common/RequestWrapper2";
import { Module } from "../../../types/Quiz";
import { GET_TRAINING_MODULES, UPDATE_MODULE, PUBLISH_MODULE, GET_ARCHIVED_MODULE, GET_ARCHIVED_TRAINING_MODULES } from "../../../queries/trainingQueries";
import 'react-toastify/dist/ReactToastify.css';
import EditModulePage from "./EditModulePage";

export default function EditArchivedModulePage() {
  const { makerspaceID, id } = useParams<{ makerspaceID: string, id: string }>();
  const navigate = useNavigate();

  const queryResult = useQuery(GET_ARCHIVED_MODULE, {
    variables: { id },
  });

  const [updateModule, updateResult] = useMutation(UPDATE_MODULE);

  const [publishModule] = useMutation(PUBLISH_MODULE, {
    variables: { id },
    refetchQueries: [{ query: GET_TRAINING_MODULES }],
    onCompleted: () => navigate(`/makerspace/${makerspaceID}/trainings`),
  });

  const executeUpdate = async (updatedModule: Module) => {
    await updateModule({
      variables: {
        id: updatedModule.id,
        name: updatedModule.name,
        quiz: updatedModule.quiz,
      },
      refetchQueries: [
        { query: GET_ARCHIVED_MODULE, variables: { id } },
        { query: GET_ARCHIVED_TRAINING_MODULES },
      ],
    });
  }

  const executeDelete = async () => {
    await publishModule();
  }

  return (
    <RequestWrapper2
      result={queryResult}
      render={() => (
        <EditModulePage
            moduleInitialValue={queryResult.data.archivedModule}
            deleteModule={executeDelete}
            updateModule={executeUpdate}
            updateLoading={updateResult.loading}
        />
      )}
    />
  );
}
