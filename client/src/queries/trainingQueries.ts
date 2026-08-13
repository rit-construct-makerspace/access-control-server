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
      expires
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
      expires
    }
  }
`;

export const GET_MODULE_ANSWER_COUNT = gql`
  query GetModuleAnswerCount($id: ID!) {
    moduleWithAnswerCount(id: $id){
      id
      name
      quiz
      reservationPrompt
      archived
      isLocked
      expires
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
      expires
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
      expires
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
      expires
    }
  }
`;

export const CREATE_TRAINING_MODULE = gql`
  mutation CreateTrainingModule($name: String!, $quiz: JSON!, $makerspaceID: ID, $expires: Boolean) {
    createModule(name: $name, quiz: $quiz, makerspaceID: $makerspaceID, expires: $expires) {
      id
    }
  }
`;

export const UPDATE_MODULE = gql`
  mutation UpdateModule($id: ID!, $name: String!, $quiz: JSON!, $reservationPrompt: JSON, $makerspaceID: ID, $expires: Boolean) {
    updateModule(id: $id, name: $name, quiz: $quiz, reservationPrompt: $reservationPrompt, makerspaceID: $makerspaceID, expires: $expires) {
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

export const DELETE_MODULE = gql`
  mutation DeleteModule($id: ID!) {
    deleteModule(id: $id) {
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

export const GET_ALL_TRAINING_MODULES = gql`
	query GetAllTrainingModules {
		modules {
			id
			name
			archived
		}
	}
`;

export default GET_TRAINING_MODULES;