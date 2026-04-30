import { Box, Divider, Grid, IconButton, Stack } from "@mui/material";
import { useCurrentUser } from "../../../common/CurrentUserProvider";
import Typography from "@mui/material/Typography";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@apollo/client/react";
import { GET_MAKERSPACES_WITH_HOURS, MakerspaceWithHours } from "../../../queries/makerspaceQueries";
import MakerspaceCard from "./MakerspaceCard";
import { Announcement, GET_ANNOUNCEMENTS } from "../../../queries/announcementsQueries";
import AnnouncementCard from "./AnnouncementCard";
import RequestWrapper2 from "../../../common/RequestWrapper2";
import GET_EVENTS, { MakeEvent } from "../../../queries/eventQueries";
import EventCard from "./EventCard";
import EditIcon from "@mui/icons-material/Edit";
import { isAdmin } from "../../../common/PrivilegeUtils";
import { useIsMobile } from "../../../common/IsMobileProvider";
import { useMakeTheme } from "../../../common/MakeThemeProvider";

export function Dashboard() {
  const currentUser = useCurrentUser();
  const adminMode = isAdmin(currentUser);
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const makeTheme = useMakeTheme();

  const getMakerspacesResult = useQuery(GET_MAKERSPACES_WITH_HOURS);
  const getAnnouncementsResult = useQuery(GET_ANNOUNCEMENTS);
  const getEvents = useQuery(GET_EVENTS);

  return (
    <Box>
      <title>{makeTheme.title}</title>
      {/* Makerspaces */}
      <RequestWrapper2
        result={getMakerspacesResult}
        render={(data) => {
          const makerspaces: MakerspaceWithHours[] = data.makerspaces;
          const filteredSpaces: MakerspaceWithHours[] = makerspaces.filter((_makerspace: MakerspaceWithHours) => true); // TODO: grab the 'archieved' field from the db and check it (more logic than that required)
          const sortedSpaces = filteredSpaces.sort((a: MakerspaceWithHours, b: MakerspaceWithHours) =>
            a.name.toLowerCase().localeCompare(b.name.toLowerCase())
          );

          return (
            <Grid
              container
              marginTop={isMobile ? "15px" : "30px"}
              justifyContent={isMobile ? "center" : "space-evenly"}
              alignItems="center"
              spacing={2}
              width="auto"
              marginLeft="0px"
            >
              {sortedSpaces.map((space: MakerspaceWithHours) => (
                <Grid>
                  <MakerspaceCard
                    id={space.id}
                    name={space.name}
                    subtitle={space.subtitle}
                    location={space.location}
                    hours={space.hours}
                    imageUrl={
                      space.imageUrl === undefined || space.imageUrl == null || space.imageUrl === ""
                        ? import.meta.env.BASE_URL + "/shed_acronym_vert.jpg"
                        : space.imageUrl
                    }
                    isMobile={isMobile}
                  />
                </Grid>
              ))}
            </Grid>
          );
        }}
      />

      {/* Announcments */}
      <RequestWrapper2
        result={getAnnouncementsResult}
        render={(data) => {
          const announcements: Announcement[] = data.getAllAnnouncements;

          return (
            <>
              <Stack direction="row" spacing={2} alignItems="center" margin="30px 30px 10px 30px">
                <Typography variant={isMobile ? "h4" : "h3"}>Announcements</Typography>
                {adminMode ? (
                  <IconButton onClick={() => navigate("/admin/announcements")} sx={{ color: "gray" }}>
                    <EditIcon />
                  </IconButton>
                ) : undefined}
              </Stack>
              <Grid
                container
                alignItems={isMobile ? "center" : "stretch"}
                justifyContent={isMobile ? "center" : "flex-start"}
                width="auto"
                marginLeft={isMobile ? "0px" : "20px"}
                spacing={2}
              >
                {announcements.length === 0 ? (
                  <Typography variant="body1" textAlign="center">
                    No announcements. Check back soon!
                  </Typography>
                ) : (
                  announcements.map((thisAnnouncement: Announcement) => (
                    <Grid>
                      <AnnouncementCard announcement={thisAnnouncement} />
                    </Grid>
                  ))
                )}
              </Grid>
            </>
          );
        }}
      />
      {/* Upcoming Events */}
      <RequestWrapper2
        result={getEvents}
        render={(data) => {
          const filteredEvents: MakeEvent[] = data.events.filter(
            (event: MakeEvent) => event.ticket_availability.has_available_tickets
          );

          return (
            <Box>
              <Stack direction="row" margin="30px 30px 10px 30px" justifyContent="space-between" alignItems="center">
                <Typography variant={isMobile ? "h4" : "h3"}>Upcoming Events</Typography>
              </Stack>
              <Stack
                direction={isMobile ? "column" : "row"}
                justifyContent="flex-start"
                alignItems="stretch"
                spacing={2}
                divider={<Divider orientation={isMobile ? "horizontal" : "vertical"} flexItem />}
                margin="0px 20px 20px 20px"
              >
                {filteredEvents.length === 0 ? (
                  <Typography variant="body1" textAlign={"center"}>
                    No available events. Check back soon!
                  </Typography>
                ) : (
                  filteredEvents.map((event: MakeEvent) => (
                    <EventCard
                      name={event.name.text}
                      description={event.description.text}
                      summary={event.summary}
                      url={event.url}
                      start={event.start.local}
                      end={event.end.local}
                      logoUrl={null}
                    />
                  ))
                )}
              </Stack>
            </Box>
          );
        }}
      />
    </Box>
  );
}
