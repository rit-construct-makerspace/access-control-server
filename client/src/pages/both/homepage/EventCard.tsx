import {
  Button,
  Card, CardActionArea, CardActions, CardContent, CardHeader, CardMedia,
  Typography
} from "@mui/material";
import { format } from "date-fns";
import { Link } from "react-router-dom";

interface EventCardProps {
  name: string | null;
  description: string | null;
  summary: string | null;
  url: string | null;
  start: string | null;
  end: string | null;
  logoUrl: string | null;
}

export default function EventCard(props: EventCardProps) {
  if (!props.start || !props.end || !props.url) return (<b>Failed to load event. Missing args.</b>)

  const startDate = new Date(props.start ?? new Date());
  const endDate = new Date(props.end ?? new Date());

  return (
    <Card sx={{maxWidth: "400px"}}>
      <CardActionArea onClick={() => {window.location.href = props.url ?? "";}}>
        <CardHeader title={props.name} subheader={`${format(startDate, "MMM do, h:mm bb")} - ${format(endDate, "MMM do, h:mm bb")}`} sx={{"h5": {fontSize: '2em'}}}></CardHeader>
        <CardMedia
          component="img"
          height="194"
          image={props.logoUrl ? props.logoUrl : process.env.PUBLIC_URL + "/shed_acronym_vert.jpg"}
          alt={props.name + " Event Logo"}
        />
        <CardContent>
          <Typography variant="body1">
            {props.summary}...
          </Typography>
        </CardContent>
      </CardActionArea>
    </Card>
  );
}