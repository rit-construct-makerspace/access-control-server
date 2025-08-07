import {
  Card, CardActionArea, CardContent, CardHeader, 
  Stack,
  Typography
} from "@mui/material";
import { format } from "date-fns";
import ChevronRightIcon from '@mui/icons-material/ChevronRight';

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
    <Card sx={{ maxWidth: "400px" }}>
      <CardActionArea onClick={() => { window.location.href = props.url ?? ""; }}>
        <CardHeader title={props.name} subheader={`${format(startDate, "MMM do, h:mm bb")} - ${format(endDate, "MMM do, h:mm bb")}`} sx={{ "h5": { fontSize: '2em' } }}></CardHeader>
        <CardContent sx={{ pt: "0" }}>
          <Typography variant="body1">
            {props.description}
          </Typography>
          <Stack spacing={0.5} direction="row" alignItems="center" justifyContent={"flex-end"}>
            <Typography variant="subtitle1">Register Here</Typography>
            <ChevronRightIcon color="primary" fontSize="large" />
          </Stack>
        </CardContent>
      </CardActionArea>
    </Card>
  );
}