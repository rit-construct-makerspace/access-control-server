import { Stack, Typography } from "@mui/material";

interface InfoBlobProps {
  label: string;
  value: string;
}

export default function InfoBlob({ label, value }: InfoBlobProps) {
  return (
    <Stack>
      <Typography fontWeight={500}>{label}</Typography>
      <Typography>{value}</Typography>
    </Stack>
  );
}
