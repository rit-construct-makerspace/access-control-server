import { CardActionArea, IconButton, Stack, Typography } from "@mui/material";
import { useNavigate } from "react-router-dom";
import CreateIcon from "@mui/icons-material/Create";


interface AnnouncementModuleProps {
  id: number;
  title: string;
}

export default function AnnouncementModule({ id, title }: AnnouncementModuleProps) {
  const navigate = useNavigate();

  return (
    <CardActionArea
      sx={{ p: 1, pl: 2 }}
      onClick={() => navigate("/admin/announcements/" + id)}
    >

      <Stack direction="row" alignItems="center" spacing={2}>

        <IconButton>
          <CreateIcon />
        </IconButton>

        <Typography
          variant="body1"
          fontWeight={500}
          component="div"
          flexGrow={1}
        >
          {title}
        </Typography>
      </Stack>
    </CardActionArea>
  );
}
