import { ReactElement } from "react";
import type { useQuery } from "@apollo/client/react";
import { Alert, CircularProgress, Stack } from "@mui/material";

/**
 * This is superior to the original RequestWrapper because
 * is uses a render function instead of children. This means
 * that, when writing the contents to go within the wrapper,
 * you are guaranteed that the data exists and don't have to
 * check it everywhere you use it.
 */

interface RequestWrapper2Props {
  result: useQuery.Result;
  render: (data: any) => ReactElement;
  minHeight?: number;
}

export default function RequestWrapper2({
  result: { loading, error, data },
  minHeight = 400,
  render,
}: RequestWrapper2Props) {
  if (!loading && !error && data) return render(data);

  return (
    <Stack
      alignItems="center"
      justifyContent="center"
      width="100%"
      height="100%"
      minHeight={minHeight}
      p={2}
    >
      {loading && <CircularProgress disableShrink />}
      {error && (
        <Alert severity="error" title={error?.name}>
          {error?.message}
        </Alert>
      )}
    </Stack>
  );
}
