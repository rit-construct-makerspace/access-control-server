import { useState } from "react";
import SearchBar from "../../../common/SearchBar";
import { Button, Divider, Stack, Typography } from "@mui/material";
import CreateIcon from "@mui/icons-material/Create";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@apollo/client/react";
import RequestWrapper from "../../../common/RequestWrapper";
import { GET_ANNOUNCEMENTS } from "../../../queries/announcementsQueries";
import AnnouncementModule from "./AnnouncementModule";
import { useIsMobile } from "../../../common/IsMobileProvider";
import { useMakeTheme } from "../../../common/MakeThemeProvider";


export default function AnnouncementsPage() {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const makeTheme = useMakeTheme();

  const getAnnouncementsResults = useQuery(GET_ANNOUNCEMENTS);

  const [searchText, setSearchText] = useState("");

  const handleNewAnnouncementClicked = async () => {
    navigate(`/admin/announcements/new`);
  };

  return (
    <RequestWrapper
      loading={getAnnouncementsResults.loading}
      error={getAnnouncementsResults.error}
    >
      <Stack padding="25px" spacing={2}>
        <title>{`Manage Announcements | ${makeTheme.title}`}</title>
        <Typography variant="h4">Edit Announcements</Typography>
        <Stack direction={isMobile ? "column" : "row"} alignItems="center" spacing={1}>
          <SearchBar
            placeholder="Search announcements"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
          />
          <Button
            loading={false}
            variant="outlined"
            startIcon={<CreateIcon />}
            onClick={handleNewAnnouncementClicked}
            sx={{ height: 40 }}
          >
            New announcement
          </Button>
        </Stack>

        <Stack
          alignItems="stretch"
          sx={{ width: "100%" }}
          divider={<Divider flexItem />}
        >
          {getAnnouncementsResults.data?.getAllAnnouncements
            ?.filter((m: { id: number; title: string }) =>
              m.title
                .toLocaleLowerCase()
                .includes(searchText.toLocaleLowerCase())
            )
            .map((m: { id: number; title: string }) => (
              <AnnouncementModule key={m.id} id={m.id} title={m.title} />
            ))}
        </Stack>
      </Stack>
    </RequestWrapper>
  );
}
