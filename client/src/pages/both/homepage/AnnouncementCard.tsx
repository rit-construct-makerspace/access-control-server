import { Card, CardContent, Typography } from "@mui/material";
import { Announcement } from "../../../queries/announcementsQueries";
import Markdown from "react-markdown";

interface AnnouncementCardProps {
    announcement: Announcement;
}

export default function AnnouncementCard(props: AnnouncementCardProps) {
    return (
        <Card sx={{height: "100%"}}>
            <CardContent>
                <Typography color="darkorange" variant="h5">{props.announcement.title}</Typography>
                <Typography variant="body1"><Markdown>{props.announcement.description}</Markdown></Typography>
            </CardContent>
        </Card>
    );
}