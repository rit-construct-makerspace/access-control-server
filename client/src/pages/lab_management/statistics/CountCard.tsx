import { Card, CardContent, CardHeader, Typography } from "@mui/material";

interface CountCardProps {
  count: string | null;
  label: string | null;
  unit: string | null;
}

export default function CountCard({count = null, label, unit}: CountCardProps) {
  return (
    <Card sx={{maxWidth: "15em", m: ".5em"}}>
      {label &&
      <CardHeader title={label} sx={{minHeight: "5em", overflowY: "clip", textAlign: "center"}}></CardHeader>}
      <CardContent>
          <Typography variant="h2" align="center" fontWeight={"bold"}>{count}</Typography>
          {unit &&
          <Typography variant="body2" align="center">{unit}</Typography>}
      </CardContent>
    </Card>
  );
}
