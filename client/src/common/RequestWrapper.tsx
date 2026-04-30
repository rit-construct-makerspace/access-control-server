import { ReactElement } from "react";
import { ApolloError } from "@apollo/client/v4-migration";
import { Alert, CircularProgress, Stack } from "@mui/material";

interface RequestWrapperProps {
  loading: boolean;
  error: ApolloError | undefined;
  minHeight?: number;
  children: ReactElement;
}

export default function RequestWrapper({
  loading,
  error,
  minHeight = 400,
  children,
}: RequestWrapperProps) {
  if (!loading && !error) return children;

  return (
    <Stack
      alignItems="center"
      justifyContent="center"
      width="100%"
      height="100%"
      minHeight={minHeight}
      p={2}
    >
      {loading ? (
        <CircularProgress />
      ) : (
        <Alert severity="error" title={error?.name}>
          {error?.message}
        </Alert>
      )}
    </Stack>
  );
}
