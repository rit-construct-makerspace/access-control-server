import { useQuery } from "@apollo/client/react";
import { useParams } from "react-router-dom";
import { GET_MODULE_ANSWER_COUNT } from "../../../queries/trainingQueries";
import RequestWrapper2 from "../../../common/RequestWrapper2";
import QuizTaker from "./QuizTaker";
import { Stack } from "@mui/system";
import { Typography } from "@mui/material";
import { useIsMobile } from "../../../common/IsMobileProvider";

function _shuffle(array: any[] | undefined) {
  if (array === undefined) return undefined;
  let currentIndex = array.length;

  // While there remain elements to shuffle...
  while (currentIndex !== 0) {

    // Pick a remaining element...
    const randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;

    // And swap it with the current element.
    [array[currentIndex], array[randomIndex]] = [
      array[randomIndex], array[currentIndex]];
  }

  return array;
}


export default function QuizPage() {
  const { id } = useParams<{ id: string }>();
  const result = useQuery(GET_MODULE_ANSWER_COUNT, { variables: { id } });
  const isMobile = useIsMobile();

  return (
    <RequestWrapper2
      result={result}
      render={(data) => (
        <Stack spacing={2} margin={"15px 30px"} alignItems={"center"}>
          <Typography variant={isMobile ? "h5" : "h3"}>{data.moduleWithAnswerCount?.name}</Typography>
          <QuizTaker module={data?.moduleWithAnswerCount} />
        </Stack>
      )}
    />
  );
}
