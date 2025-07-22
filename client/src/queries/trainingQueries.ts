import { gql } from "@apollo/client";

export const GET_MODULE = gql`
  query GetModule($id: ID!) {
    module(id: $id) {
      id
      name
      quiz
      reservationPrompt
      archived
      isLocked
    }
  }
`;

export const GET_MODULE_WITH_ANSWERS = gql`
  query GetModuleWithAnswers($id: ID!) {
    moduleWithAnswers(id: $id) {
      id
      name
      quiz
      reservationPrompt
      archived
      isLocked
      makerspaceID
    }
  }
`;

export const GET_ARCHIVED_MODULE = gql`
  query GetArchivedModule($id: ID!) {
    archivedModule(id: $id) {
      id
      name
      quiz
      reservationPrompt
      archived
    }
  }
`;

export const GET_TRAINING_MODULES = gql`
  query GetTrainingModules {
    modules {
      id
      name
      archived
      isLocked
      makerspaceID
    }
  }
`;

export const GET_ARCHIVED_TRAINING_MODULES = gql`
  query GetArchivedTrainingModules {
    archivedModules {
      id
      name
      archived
      makerspaceID
    }
  }
`;

export const CREATE_TRAINING_MODULE = gql`
  mutation CreateTrainingModule($name: String!, $quiz: JSON!) {
    createModule(name: $name, quiz: $quiz) {
      id
    }
  }
`;

export const UPDATE_MODULE = gql`
  mutation UpdateModule($id: ID!, $name: String!, $quiz: JSON!, $reservationPrompt: JSON, $makerspaceID: ID) {
    updateModule(id: $id, name: $name, quiz: $quiz, reservationPrompt: $reservationPrompt, makerspaceID: $makerspaceID) {
      id
    }
  }
`;

export const ARCHIVE_MODULE = gql`
  mutation ArchiveModule($id: ID!) {
    archiveModule(id: $id) {
      id
    }
  }
`;

export const PUBLISH_MODULE = gql`
  mutation PublishModule($id: ID!) {
    publishModule(id: $id) {
      id
    }
  }
`;

export const GET_ACCESS_PROGRESSES = gql`
  query RelatedAccessProgress($sourceTrainingModuleID: ID!) {
    relatedAccessProgress(sourceTrainingModuleID: $sourceTrainingModuleID) {
      equipment {
        id
        name
      }
      passedModules {
        id
        name
      }
      availableModules {
        id
        name
      }
      accessCheckDone
    }
  }
`;

export default GET_TRAINING_MODULES;