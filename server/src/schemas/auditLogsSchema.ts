import { gql } from "graphql-tag";

export interface AuditLog {
  id: string;
  dateTime: string;
  message: string;
  category: string;
}

export const AuditLogsTypeDefs = gql`
  scalar DateTime

  type AuditLog {
    id: ID!
    dateTime: DateTime!
    message: String
    category: String
  }

  input Filters {
    errors: String!
    welcome: Boolean!
    auth: Boolean!
    status: Boolean!
    state: Boolean!
    help: Boolean!
    message: Boolean!
    server: Boolean!
    training: Boolean!
    admin: Boolean!
    uncategorized: Boolean!
  }

  extend type Query {
    auditLogs(
      startDate: DateTime
      stopDate: DateTime
      searchText: String
      filters: Filters
    ): [AuditLog]
  }
`;
