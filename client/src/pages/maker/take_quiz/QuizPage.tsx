import { useQuery } from "@apollo/client";
import { useParams } from "react-router-dom";
import { GET_MODULE } from "../../../queries/trainingQueries";
import RequestWrapper2 from "../../../common/RequestWrapper2";
import { Module } from "../../../types/Quiz";
import QuizTaker from "./QuizTaker";
import { Stack } from "@mui/system";
import { Typography } from "@mui/material";
import { useIsMobile } from "../../../common/IsMobileProvider";


// we're going to bring this back soon probably 
// eslint-disable-next-line 
function shuffle(array: any[] | undefined) {
  if (array === undefined) return undefined;
  let currentIndex = array.length;

  // While there remain elements to shuffle...
  while (currentIndex !== 0) {

    // Pick a remaining element...
    let randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;

    // And swap it with the current element.
    [array[currentIndex], array[randomIndex]] = [
      array[randomIndex], array[currentIndex]];
  }

  return array;
}


export default function QuizPage() {
  const { id } = useParams<{ id: string }>();
  const result = useQuery(GET_MODULE, { variables: { id } });
  const isMobile = useIsMobile();

  return (
    <RequestWrapper2
      result={result}
      render={({ module }: { module: Module }) => (
        <Stack spacing={2} margin={"15px 30px"}>
          <Typography variant={isMobile ? "h5" : "h3"}>{module.name}</Typography>
          <QuizTaker module={module} />
        </Stack>
      )}
    />
  );
}
