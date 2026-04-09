import { Card, CardActionArea, Stack, Typography } from "@mui/material";
import { AccessController } from "../../../queries/deviceQueries";
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';

interface AccessControllerRowProps {
  controller: AccessController;
}

export default function AccessControllerRow(props: AccessControllerRowProps) {

  return (
    <Card variant="outlined">
      <CardActionArea sx={{ padding: "15px 20px 15px 10px" }}>
        <Stack direction={"row"} justifyContent={"space-between"} alignItems={"center"}>
          <Stack height={"100%"}>
            <Typography variant="subtitle1">{`Channel: ${props.controller.channelID}`}</Typography>
          </Stack>
          <ArrowForwardIosIcon
            color="primary"
          />
        </Stack>
      </CardActionArea>
    </Card>
  );
}