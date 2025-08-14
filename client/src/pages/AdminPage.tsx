import { ReactNode } from "react";
import { Stack } from "@mui/material";
import { gql, useQuery } from "@apollo/client";
import RequestWrapper from "../common/RequestWrapper";

interface PageProps {
  title?: string;
  topRightAddons?: ReactNode;
  maxWidth?: string;
  children?: ReactNode;
  noPadding?: boolean;
}

const IS_MENTOR_OR_HIGHER = gql`
  query IsMentorOrHigher {
    isMentorOrHigher
  }
`;

export default function AdminPage({
  children,
}: PageProps) {
  const isMentorOrHigherResult = useQuery(IS_MENTOR_OR_HIGHER);

  return (
    <RequestWrapper loading={isMentorOrHigherResult.loading} error={isMentorOrHigherResult.error}>
      <Stack width="auto">
        {children}
      </Stack>
    </RequestWrapper>
  );
}
