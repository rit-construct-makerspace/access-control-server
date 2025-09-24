import { ReactNode } from "react";
import Typography from "@mui/material/Typography";
import { Stack } from "@mui/material";
import { useIsMobile } from "../common/IsMobileProvider";

interface PageProps {
  title: string;
  topRightAddons?: ReactNode;
  maxWidth?: string;
  children?: ReactNode;
  noPadding?: boolean;
}

export default function Page({
  title,
  topRightAddons,
  maxWidth = "100%",
  children,
  noPadding = false
}: PageProps) {
  const isMobile = useIsMobile();

  return (
    <Stack
      alignItems="center"
      sx={{ width: "100%", height: "100vh", overflowY: "auto", overflowX: "hidden" }}
    >
      <Stack
        sx={{
          px: noPadding ? 0 : 4,
          p: 4,
          width: "100%",
          maxWidth: `${noPadding ? 'max' : 'min'}(calc(100% - 64px), ${maxWidth})`,
        }}
      >
        <Stack direction="row" alignItems="center" mb={4} ml={isMobile ? 4 : ""}>
          {title !== "" &&
          <Typography variant={isMobile ? "h5" : "h3"} sx={{pl: isMobile ? 4 : ""}} flexGrow={1} color={'text.primary'}>
          {title}
          </Typography>}
          {topRightAddons}
        </Stack>

        {children}
      </Stack>
    </Stack>
  );
}
