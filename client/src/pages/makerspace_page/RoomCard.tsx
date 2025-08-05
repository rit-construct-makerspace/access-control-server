import { Card, CardActionArea, CardContent, Stack, Typography, } from "@mui/material";
import { useNavigate } from "react-router-dom";
import Room from "../../types/Room";

interface RoomCardProps {
  makerspaceID: number;
  room: Room;
}

export default function RoomCard(props: RoomCardProps) {
  const navigate = useNavigate();

  return (
    <Card sx={{ width: "100%"}}>
      <CardActionArea onClick={() => navigate(`/makerspace/${props.makerspaceID}/edit/room/${props.room.id}`)}>
        <CardContent>
          <Stack direction={"row"} spacing={2} sx={{display:"flex", justifyContent:"space-between", alignItems:"center"}}>
            <Typography variant="h6" component="div">
              {props.room.name}
            </Typography>
            <Typography variant="body2" component="div">
              {"ID " + props.room.id}
            </Typography>
          </Stack>
        </CardContent>
      </CardActionArea>
    </Card>
  );
}
