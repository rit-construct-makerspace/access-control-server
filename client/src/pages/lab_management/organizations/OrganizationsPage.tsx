import { Button, Stack, Typography } from "@mui/material";
import { useIsMobile } from "../../../common/IsMobileProvider";
import SearchBar from "../../../common/SearchBar";


export default function OrganizationsPage() {
  const isMobile = useIsMobile();

  return (
    <Stack spacing={2} margin={"10px 20px"}>
      <title>Organizations | Make @ RIT</title>
      <Stack direction={isMobile ? "column" : "row"}>
        <Typography variant="h4">Organizations</Typography>
        <Stack direction={"row"}>
          <SearchBar />
          <Button>Search</Button>
        </Stack>
      </Stack>
    </Stack>
  );
}