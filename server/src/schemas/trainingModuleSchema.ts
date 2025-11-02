/**
 * trainingModuleSchema.ts
 * GraphQL declarations for TrainingModules and AccessProgresses
 */

import { gql } from "graphql-tag";
import { EquipmentRow, TrainingModuleRow } from "../db/tables.js";

export interface TrainingModule { //dead
  id: number;
  name: string;
  quiz: object;
}

export interface AccessProgress {
  equipment: EquipmentRow;
  passedModules: TrainingModuleRow[];
  availableModules: TrainingModuleRow[];
  accessCheckDone: boolean;
}

export interface AnswerInput {
  itemID: string;
  optionIDs: string[];
}

export const TrainingModuleTypeDefs = gql`
  scalar JSON

  type TrainingModule {
    id: ID!
    name: String!
    archived: Boolean!
    quiz: JSON
    reservationPrompt: JSON
    equipment: [Equipment]
    isLocked: Boolean
    makerspaceID: ID
  }

  type AccessProgress {
    equipment: Equipment!
    passedModules: [TrainingModule]
    availableModules: [TrainingModule]
    accessCheckDone: Boolean!
  }

  input AnswerInput {
    itemID: ID!
    optionIDs: [ID]!
  }

  extend type Query {
    modules: [TrainingModule]
    modulesWithAnswers: [TrainingModule]
    module(id: ID!): TrainingModule
    moduleWithAnswers(id: ID!): TrainingModule
    archivedModules: [TrainingModule]
    archivedModule(id: ID!): TrainingModule
    relatedAccessProgress(sourceTrainingModuleID: ID!): [AccessProgress]
  }

  extend type Mutation {
    createModule(name: String!, quiz: JSON!, makerspaceID: ID): TrainingModule
    updateModule(id: ID!, name: String!, quiz: JSON!, reservationPrompt: JSON, makerspaceID: ID): TrainingModule
    archiveModule(id: ID!): TrainingModule
    publishModule(id: ID!): TrainingModule
    deleteModule(id: ID!): TrainingModule

    """
    Submit a trainingModule for assessment, the attempt will be stored
    for the user and the grade will be returned as a Float out of 100
    """
    submitModule(moduleID: ID!, answerSheet: [AnswerInput]): ID


    deletePassedModule(userID: ID!, moduleID: ID!): ID
  }
`;
