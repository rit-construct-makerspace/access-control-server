import { ReactNode, useEffect, useState } from "react";
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
  title,
  topRightAddons,
  maxWidth = "100%",
  children,
  noPadding = false
}: PageProps) {

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
  const isMobile = width <= 1100;

  const isMentorOrHigherResult = useQuery(IS_MENTOR_OR_HIGHER);

  return (
    <RequestWrapper loading={isMentorOrHigherResult.loading} error={isMentorOrHigherResult.error}>
      <Stack width="auto">
        {children}
      </Stack>
    </RequestWrapper>
  );
}
