import React from "react";
import Page from "../../Page";
import { useQuery } from "@apollo/client";
import { useParams } from "react-router-dom";
import { GET_MODULE } from "../../../queries/trainingQueries";
import RequestWrapper2 from "../../../common/RequestWrapper2";
import { Module, QuizItem } from "../../../types/Quiz";
import QuizTaker from "./QuizTaker";

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
        <Page title={module.name} maxWidth="1600px">
          <QuizTaker module={module} />
        </Page>
      )}
    />
  );
}
