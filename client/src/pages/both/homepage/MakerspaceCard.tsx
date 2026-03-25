import { Button, Card, CardActionArea, CardContent, CardMedia, Stack, Typography } from "@mui/material";
import { useNavigate } from "react-router-dom";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import MakerspaceHours from "../../../types/MakerspaceHours";
import CurrentHours from "../../../common/CurrentHours";
import { makeCDNLink } from "../../../common/ImageFinder.js";

interface MakerspaceCardProps {
  id: number;
  name: string;
  subtitle: string | null;
  location: string | null;
  hours: MakerspaceHours[];
  imageUrl: string;
  isMobile: boolean;
  clickable?: boolean;
}


export default function MakerspaceCard(props: MakerspaceCardProps) {
  const navigate = useNavigate();

  return (
    <Card
      sx={{ width: props.isMobile ? "350px" : "500px" }}
    >
      <CardActionArea
        onClick={
          props.clickable === true || props.clickable === undefined
            ? () => {
              navigate(`/makerspace/${props.id}`);
            }
            : () => {
              /* Do nothing */
            }
        }
      >
        {
          props.isMobile
            ? null
            : <CardMedia
              component="img"
              height={props.isMobile ? "197px" : "281px"}
              image={makeCDNLink(props.imageUrl, "user-uploads/")}
            />
        }
        <CardContent sx={{ justifyContent: "center", display: "flex", flexDirection: "column" }}>
          <Stack direction={"row"} justifyContent={"space-between"} alignItems={"center"}>
            <Typography variant={props.isMobile ? "h5" : "h4"}>{props.name}</Typography>
            {!props.isMobile && (
              <Typography variant="h6" color="textSecondary">
                {props.location}
              </Typography>
            )}
          </Stack>

          <Typography variant={props.isMobile ? "subtitle1" : "h5"} color="textSecondary">
            {props.subtitle}
          </Typography>

          <Stack direction={"row"} justifyContent={"space-between"}>
            <CurrentHours times={props.hours} fillLine={props.isMobile} showDay={true} />
            {!props.isMobile && (
              <Button
                variant="contained"
                endIcon={<ChevronRightIcon />}
                sx={{ display: "flex", alignItems: "center", lineHeight: 0 }}
              >
                Explore
              </Button>
            )}
          </Stack>
          {props.isMobile && (
            <Stack direction="row" justifyContent={"space-between"}>
              <Typography variant="h6" color="textSecondary" alignSelf={"center"}>
                {props.location}
              </Typography>
              <Button
                variant="contained"
                endIcon={<ChevronRightIcon />}
                sx={{ display: "flex", alignItems: "center", lineHeight: 0 }}
              >
                Explore
              </Button>
            </Stack>
          )}
        </CardContent>
      </CardActionArea>
    </Card>
  );
}
