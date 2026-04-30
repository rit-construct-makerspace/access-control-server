import { useMutation, useQuery } from "@apollo/client/react";
import { useNavigate, useParams } from "react-router-dom";
import RequestWrapper2 from "../../../common/RequestWrapper2";
import { Module } from "../../../types/Quiz";
import { GET_TRAINING_MODULES, UPDATE_MODULE, DELETE_MODULE, GET_MODULE_WITH_ANSWERS } from "../../../queries/trainingQueries";
import 'react-toastify/dist/ReactToastify.css';
import EditModulePage from "./EditModulePage";

export default function EditActiveModulePage() {
  const { id, makerspaceID } = useParams<{ id: string, makerspaceID: string }>();
  const navigate = useNavigate();

  const queryResult = useQuery(GET_MODULE_WITH_ANSWERS, {
    variables: { id }
  });

  const [updateModule, updateResult] = useMutation(UPDATE_MODULE);

  const [deleteModule] = useMutation(DELETE_MODULE, {
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
        makerspaceID: updatedModule.makerspaceID,
      },
      refetchQueries: [
        { query: GET_MODULE_WITH_ANSWERS, variables: { id } },
        { query: GET_TRAINING_MODULES },
      ],
    });
  }

  const executeDelete = async () => {
    await deleteModule();
  }

  return (
    <RequestWrapper2
      result={queryResult}
      render={() => (
        <EditModulePage
          moduleInitialValue={queryResult.data.moduleWithAnswers}
          deleteModule={executeDelete}
          updateModule={executeUpdate}
          updateLoading={updateResult.loading}
        />
      )}
    />
  );
}
