import React, { useEffect, useState } from "react";
import { Module, QuizItem, QuizItemType } from "../../../types/Quiz";
import { useImmer } from "use-immer";
import { Button, Stack, Typography } from "@mui/material";
import Question from "./Question";
import styled, { css } from "styled-components";
import { gql, useMutation } from "@apollo/client";
import { LoadingButton } from "@mui/lab";
import { GET_CURRENT_USER } from "../../../common/CurrentUserProvider";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import Markdown from 'react-markdown'
import { makeStyles } from '@material-ui/core/styles';


const StyledDiv = styled.div`
  border-radius: 4px;
  border: none;
  height: 1000px;
`;

const useStyles = makeStyles({
  strongerBolds: {
    '& p': {
      fontWeight: 400
    },
    '& strong': {
      fontWeight: 900
    }
  }
});

const elevationTwoShadow = css`
  box-shadow: 0 3px 1px -2px rgba(0, 0, 0, 0.2),
    0px 2px 2px 0px rgba(0, 0, 0, 0.14), 0px 1px 5px 0px rgba(0, 0, 0, 0.12);
`;

const StyledImageEmbed = styled.img`
  border-radius: 4px;
  align-self: center;
  max-width: 800px;
  max-height: 800px;
  ${elevationTwoShadow}
`;

const StyledIFrame = styled.iframe`
  border-radius: 4px;
  align-self: stretch;
  border: none;
  height: 450px;
  ${elevationTwoShadow}
`;

export type AnswerSheet = { itemID: string; optionIDs: string[] }[];

const SUBMIT_MODULE = gql`
  mutation SubmitModule($moduleID: ID!, $answerSheet: [AnswerInput]) {
    submitModule(moduleID: $moduleID, answerSheet: $answerSheet)
  }
`;

interface QuizTakerProps {
  module: Module;
}

export default function QuizTaker({ module }: QuizTakerProps) {

  const [quizProgressed, setQuizProgressed] = useState<boolean>(false);

  const [width, setWidth] = useState<number>(window.innerWidth);
  function handleWindowSizeChange() {
    setWidth(window.innerWidth);
  }
  useEffect(() => {
    window.addEventListener('resize', handleWindowSizeChange);
    return () => {
      window.removeEventListener('resize', handleWindowSizeChange);
    }
  }, []);
  const isMobile = width <= 950;


  const initialAnswerSheet = module.quiz
    .filter(
      (item) =>
        item.type === QuizItemType.MultipleChoice ||
        item.type === QuizItemType.Checkboxes
    )
    .map((item) => ({ itemID: item.id, optionIDs: [] }));

  const [answerSheet, setAnswerSheet] =
    useImmer<AnswerSheet>(initialAnswerSheet);

  const [submitModule, result] = useMutation(SUBMIT_MODULE, {
    variables: { moduleID: module.id, answerSheet },
    refetchQueries: [
      { query: GET_CURRENT_USER }
    ]
  });

  const selectMultipleChoiceOption = (itemID: string, optionID: string) => {
    setAnswerSheet((draft) => {
      const index = draft.findIndex((i) => i.itemID === itemID);
      draft[index].optionIDs = [optionID];
    });
    setQuizProgressed(true);
  };

  const toggleCheckboxOption = (itemID: string, optionID: string) => {
    setAnswerSheet((draft) => {
      const itemIndex = draft.findIndex((i) => i.itemID === itemID);

      const optionIndex = draft[itemIndex].optionIDs.findIndex(
        (o) => o === optionID
      );

      optionIndex === -1
        ? draft[itemIndex].optionIDs.push(optionID)
        : draft[itemIndex].optionIDs.splice(optionIndex, 1);
    })
    setQuizProgressed(true);
  };

  const trainingSubmissionAnimation = () => {
    toast.success('Training Module Submitted', {
      position: "bottom-left",
      autoClose: 3000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      progress: undefined,
      theme: "colored",
    });
  }

  const trainingCancelAnimation = () => {
    toast.error('Training Not Saved', {
      position: "bottom-left",
      autoClose: 3000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      progress: undefined,
      theme: "light",
    });
  }

  const navigate = useNavigate();

  const submitAndViewResults = async () => {
    await submitModule();
    navigate(`results`);
    trainingSubmissionAnimation();
  };

  const cancelQuiz = async () => {
    if (!window.confirm("Are you sure you want to cancel this quiz? Progress will be lost.")) {
      return;
    }
    navigate('../maker/training')
    trainingCancelAnimation();
  };

  const classes = useStyles();

  window.addEventListener('beforeunload', function (e) {
    if (quizProgressed) {
      e.preventDefault();
      return ''
    }
  });

  return (
    <Stack spacing={4} className={classes.strongerBolds}>
      {module.quiz.map((quizItem) => {
        const selectedOptionIDs =
          answerSheet.find((qi) => qi.itemID === quizItem.id)?.optionIDs ?? [];

        switch (quizItem.type) {
          case QuizItemType.Text:
            return <Typography key={quizItem.id}><Markdown className={classes.strongerBolds}>{quizItem.text}</Markdown></Typography>;
          case QuizItemType.MultipleChoice:
            return (
              <Question
                selectedOptionIDs={selectedOptionIDs}
                key={quizItem.id}
                quizItem={quizItem}
                onClick={(optionID) =>
                  selectMultipleChoiceOption(quizItem.id, optionID)
                }
              />
            );
          case QuizItemType.Checkboxes:
            return (
              <Question
                selectedOptionIDs={selectedOptionIDs}
                key={quizItem.id}
                quizItem={quizItem}
                onClick={(optionID) =>
                  toggleCheckboxOption(quizItem.id, optionID)
                }
              />
            );
          case QuizItemType.ImageEmbed:
            return (
              <StyledImageEmbed key={quizItem.id} alt="" src={quizItem.text} style={isMobile ? { width: "80vw" } : {}} />
            );
          case QuizItemType.YoutubeEmbed:
            return (
              <StyledIFrame
                key={quizItem.id}
                src={`https://www.youtube.com/embed/${quizItem.text}`}
              />
            );
          case QuizItemType.PdfEmbed:
            return (
              <StyledDiv>
                <object data={quizItem.text} type="application/pdf" width="100%" height="100%">
                  <p><a href={quizItem.text}>Embeded PDF</a></p>
                </object>
              </StyledDiv>
            );
        }
      })}

      <Stack direction={"row-reverse"} spacing={2}>
        <LoadingButton
          loading={result.loading}
          variant="contained"
          sx={{ alignSelf: "flex-end" }}
          onClick={() => submitAndViewResults()}
        >
          Submit
        </LoadingButton>
        <Button
          variant="outlined"
          sx={{ alignSelf: "flex-end" }}
          onClick={() => cancelQuiz()}
        >
          Cancel
        </Button>
      </Stack>

    </Stack>
  );
}
