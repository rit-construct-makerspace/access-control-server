/**
 * trainingSubmissionSchema.ts
 * GraphQL declarations for Submissions
 */

import { gql } from "graphql-tag";

export interface Submission {
    id: number;
    moduleID: number;
    makerID: number;
    submissionDate: string;
    passed: boolean;
    expirationDate: string;
    summary: JSON;
}

export const TrainingSubmissionTypeDefs = gql`
  type Submission {
    id: ID!
    moduleID: ID
    makerID: ID
    submissionDate: String
    passed: Boolean
    expirationDate: String!
    summary: JSON
  }

  type remainingSubmissions{
    failedSubmissions : Int
    submissionLimit : Int
  }

  extend type Query {
    submission(submissionID: ID): [Submission]
    submissions(moduleID: ID): [Submission]
    latestSubmission(moduleID: ID): Submission
    remainingSubmissions(moduleID: ID): remainingSubmissions
  }
`;
