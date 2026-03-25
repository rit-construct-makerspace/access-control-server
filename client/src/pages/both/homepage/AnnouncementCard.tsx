import { Button, Card, CardActions, CardContent, Typography, useTheme } from "@mui/material";
import { Announcement } from "../../../queries/announcementsQueries";
import ThemedMarkdown from "../../../common/ThemedMarkdown";
import { useIsMobile } from "../../../common/IsMobileProvider";

interface AnnouncementCardProps {
  announcement: Announcement;
}

export default function AnnouncementCard(props: AnnouncementCardProps) {
  const theme = useTheme();
  const isMobile = useIsMobile();
  return (
    <Card sx={{ height: "100%", display: "flex", flexDirection: "column", width: isMobile ? "350px" : "400px" }}>
      <CardContent sx={{ flexGrow: 1 }}>
        <Typography color={theme.palette.primary.main} variant="h5">
          {props.announcement.title}
        </Typography>
        <Typography variant="body1">
          <ThemedMarkdown>{props.announcement.description}</ThemedMarkdown>
        </Typography>
      </CardContent>
      {props.announcement.linkUrl ? (
        <CardActions sx={{ justifyContent: 'flex-end' }}>
          <Button
            variant="contained"
            color="info"
            size="small"
            href={props.announcement.linkUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            {props.announcement.linkText}
          </Button>
        </CardActions>
      ) : null}
    </Card>
  );
}
