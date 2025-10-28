import { Button, Card, CardActions, CardContent, Typography, useTheme } from "@mui/material";
import { Announcement } from "../../../queries/announcementsQueries";
import ThemedMarkdown from "../../../common/ThemedMarkdown";

interface AnnouncementCardProps {
  announcement: Announcement;
}

export default function AnnouncementCard(props: AnnouncementCardProps) {
  const theme = useTheme();
  return (
    <Card sx={{ height: "100%" }}>
      <CardContent>
        <Typography color={theme.palette.primary.main} variant="h5">
          {props.announcement.title}
        </Typography>
        <Typography variant="body1">
          <ThemedMarkdown>{props.announcement.description}</ThemedMarkdown>
        </Typography>
      </CardContent>
      <CardActions sx={{ justifyContent: 'flex-end' }}>
        {props.announcement.linkUrl ? (
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
        ) : null}
      </CardActions>
    </Card>
  );
}
