import React from "react";
import Page from "../../Page";
import { useQuery } from "@apollo/client";
import { useParams } from "react-router-dom";
import { GET_MODULE } from "../../../queries/trainingQueries";
import RequestWrapper2 from "../../../common/RequestWrapper2";
import { Module, QuizItem } from "../../../types/Quiz";
import QuizTaker from "./QuizTaker";
import { Stack } from "@mui/system";
import { Typography } from "@mui/material";
import { useIsMobile } from "../../../common/IsMobileProvider";

function shuffle(array: any[] | undefined) {
  if (array == undefined) return undefined;
  let currentIndex = array.length;

  // While there remain elements to shuffle...
  while (currentIndex != 0) {

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
  // console.log(result)
  // if (!result.loading) {
  //   result.data.module.quiz.forEach(function(quizItem: QuizItem) {
  //     quizItem.options = shuffle(quizItem.options);
  //   })
  // }
  // console.log(result)
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
