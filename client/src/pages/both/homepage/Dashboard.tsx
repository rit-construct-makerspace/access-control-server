import { ReactElement, useEffect, useState } from "react";
import { Alert, Box, Divider, Grid, IconButton, Stack } from "@mui/material";
import { useCurrentUser } from "../../../common/CurrentUserProvider";
import Typography from "@mui/material/Typography";
import { useNavigate } from "react-router-dom";
import { gql, useQuery } from "@apollo/client";
import RequestWrapper from "../../../common/RequestWrapper";
import { GET_ZONES_WITH_HOURS, ZoneWithHours } from "../../../queries/zoneQueries";
import ZoneCard from "./ZoneCard";
import { Announcement, GET_ANNOUNCEMENTS } from "../../../queries/announcementsQueries";
import AnnouncementCard from "./AnnouncementCard";
import RequestWrapper2 from "../../../common/RequestWrapper2";
import GET_EVENTS, { MakeEvent } from "../../../queries/eventQueries"
import EventCard from "./EventCard";
import EditIcon from '@mui/icons-material/Edit';
import { isAdmin } from "../../../common/PrivilegeUtils";
import { useIsMobile } from "../../../common/IsMobileProvider";

const INCREMENT_SITE_VISITS = gql`
    query IncrementSiteVisits {
        incrementSiteVisits
    }
`;

export function Dashboard() {
    const currentUser = useCurrentUser();
    const adminMode = isAdmin(currentUser);
    const navigate = useNavigate();
    const isMobile = useIsMobile();

    const incrementSiteVisits = useQuery(INCREMENT_SITE_VISITS);
    const getZonesResult = useQuery(GET_ZONES_WITH_HOURS);
    const getAnnouncementsResult = useQuery(GET_ANNOUNCEMENTS);
    const getEvents = useQuery(GET_EVENTS);

    return (
        <Box>
            <title>Make @ RIT</title>
            <RequestWrapper loading={incrementSiteVisits.loading} error={incrementSiteVisits.error}><></></RequestWrapper>
            {/* Zones */}
            <RequestWrapper2 result={getZonesResult} render={(data) => {
                const zones: ZoneWithHours[] = data.zones;
                const filteredZone: ZoneWithHours[] = zones.filter((zone: ZoneWithHours) => true); // TODO: grab the 'archieved' field from the db and check it (more logic than that required)
                const sortedZones = filteredZone.sort((a: ZoneWithHours, b: ZoneWithHours) => (a.name.toLowerCase().localeCompare(b.name.toLowerCase())));

                return (
                    <Grid
                        container
                        marginTop="30px"
                        justifyContent={isMobile ? "center" : "space-evenly"}
                        alignItems="center" spacing={2}
                        width="auto"
                        marginLeft="0px"
                    >
                        {sortedZones.map((zone: ZoneWithHours) => (
                            <Grid gap={2}>
                                <ZoneCard 
                                    id={zone.id}
                                    name={zone.name}
                                    hours={zone.hours}
                                    imageUrl={zone.imageUrl == undefined || zone.imageUrl == null || zone.imageUrl == "" ? process.env.PUBLIC_URL + "/shed_acronym_vert.jpg" : zone.imageUrl}
                                    isMobile={isMobile}
                                />
                            </Grid>
                        ))}
                    </Grid>
                );
            } }/>
                
            {/* Announcments */}
            <RequestWrapper loading={getAnnouncementsResult.loading} error={getAnnouncementsResult.error}>
                <>
                    <Stack direction="row" spacing={2} alignItems="center" margin="30px 30px 10px 30px">
                        <Typography variant={isMobile ? "h4" : "h3"}>Announcements</Typography>
                        {
                            adminMode
                            ? <IconButton onClick={() => navigate("/admin/announcements")} sx={{color: "gray"}}>
                                <EditIcon />
                            </IconButton>
                            : undefined
                        }
                    </Stack>
                    <Grid container margin="0px 20px" alignItems="stretch" width="auto">
                        {getAnnouncementsResult.data?.getAllAnnouncements?.map((thisAnnouncement: Announcement) => (
                            <Grid width="400px" margin="10px">
                                <AnnouncementCard announcement={thisAnnouncement}/>
                            </Grid>
                        ))}
                    </Grid>
                </>
            </RequestWrapper>
            {/* Upcoming Events */}
            <RequestWrapper2 result={getEvents} render={(data) => {

                return (
                    <Box>
                        <Stack  direction="row" margin="30px 30px 10px 30px" justifyContent="space-between" alignItems="center">
                            <Typography variant={isMobile ? "h4" : "h3"}>Upcoming Events</Typography>
                            <Typography variant="h6">
                                <a 
                                    href="https://www.eventbrite.com/o/rit-shed-makerspace-92409962123" 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                >
                                    All Events
                                </a>
                            </Typography>
                        </Stack>
                        <Stack direction={isMobile ? "column" : "row"} justifyContent="flex-start" alignItems="stretch" spacing={2}
                            divider={<Divider orientation={isMobile ? "horizontal" : "vertical"} flexItem/>}
                            margin="0px 20px 20px 20px"
                        >
                            {
                                data.events.length == 0
                                ? <Typography variant="body1">No Events!</Typography>
                                : data.events.map((event: MakeEvent) => (
                                <EventCard
                                    name={event.name.text}
                                    description={event.name.html}
                                    summary={event.summary}
                                    url={event.url}
                                    start={event.start.local}
                                    end={event.end.local}
                                    logoUrl={event.logo.url} />
                            ))}
                        </Stack>
                    </Box>
                );
            }} />
            
        </Box>
    );
};