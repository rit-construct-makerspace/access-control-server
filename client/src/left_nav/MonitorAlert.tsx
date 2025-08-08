import { Alert, Button, Link, Stack, Typography } from "@mui/material";
import MonitorIcon from "@mui/icons-material/Monitor";

export default function MonitorAlert() {
  return (
    <Alert severity="info" icon={<MonitorIcon />} sx={{ borderRadius: 0 }}>
      <Stack>
        <Typography variant="body1" sx={{ lineHeight: 1.2, mt: "2px" }}>
          You are monitoring the{" "}
          <Link href="/admin/monitor/sample-room" sx={{ fontWeight: 500 }}>
            woodshop
          </Link>
        </Typography>

        <Stack direction="row" alignItems="center" sx={{ mt: 2 }}>
          <Typography variant="body1" sx={{ fontWeight: 500, flexGrow: 1 }}>
            23:45
          </Typography>

          <Button size="small" variant="outlined">
            Stop
          </Button>
        </Stack>
      </Stack>
    </Alert>
  );
}
