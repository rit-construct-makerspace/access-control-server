import { Card, CardContent, Typography, useTheme } from "@mui/material";
import { Announcement } from "../../../queries/announcementsQueries";
import ThemedMarkdown from "../../../common/RITMarkdown";

interface AnnouncementCardProps {
    announcement: Announcement;
}

export default function AnnouncementCard(props: AnnouncementCardProps) {
    const theme = useTheme();
    return (
        <Card sx={{ height: "100%" }}>
            <CardContent>
                <Typography color={theme.palette.primary.main} variant="h5">{props.announcement.title}</Typography>
                <Typography variant="body1"><ThemedMarkdown>{props.announcement.description}</ThemedMarkdown></Typography>
            </CardContent>
        </Card>
    );
}