import { gql } from "@apollo/client";

export const GET_SUBMISSION = gql`
  query GetSubmission($submissionID: ID) {
    submission {
      id
      moduleID
      makerID
      submissionDate
      passed
      expirationDate
    }
  }
`;

export const GET_SUBMISSIONS = gql`
  query GetSubmissions($moduleID: ID) {
    submissions {
      id
      moduleID
      makerID
      submissionDate
      passed
      expirationDate
    }
  }
`;

export const GET_LATEST_SUBMISSION = gql`
  query GetSubmissions($moduleID: ID) {
    latestSubmission(moduleID: $moduleID) {
      id
      moduleID
      makerID
      submissionDate
      passed
      expirationDate
      summary
    }
  }
`;

export const GET_REMAINING_SUBMISSIONS = gql`
  query GetSubmissions($moduleID: ID) {
    remainingSubmissions(moduleID: $moduleID) {
      failedSubmissions
      submissionLimit
    }
  }
`;