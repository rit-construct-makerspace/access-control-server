import { Box, CircularProgress, CircularProgressProps } from "@mui/material";
import { ReactElement } from "react";

interface CircularProgressWithContentProps extends CircularProgressProps {
  icon: ReactElement;
}

export default function CircularProgressWithContent(props: CircularProgressWithContentProps) {
  return (
    <Box position="relative" display="inline-flex">
      <CircularProgress
        {...props}
      />
      <Box
        top={0}
        left={0}
        bottom={0}
        right={0}
        position="absolute"
        display="flex"
        alignItems="center"
        justifyContent="center"
      >
        {props.icon}
      </Box>
    </Box>
  );
}