import { Link, Typography } from "@mui/material";
import { Grid, Stack } from "@mui/system";
import RequestWrapper2 from "../../../common/RequestWrapper2";
import { GET_MAKERSPACES_WITH_HOURS, MakerspaceWithHours } from "../../../queries/makerspaceQueries";
import { useQuery } from "@apollo/client/react";
import MakerspaceCard from "../../both/homepage/MakerspaceCard";
import { useIsMobile } from "../../../common/IsMobileProvider";
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import { useMakeTheme } from "../../../common/MakeThemeProvider";

export default function HelpPage() {
    const isMobile = useIsMobile();
    const makeTheme = useMakeTheme();

    const getMakerspacesResult = useQuery(GET_MAKERSPACES_WITH_HOURS);

    return <Stack direction={"column"} alignItems={"center"} padding={"10px"} textAlign={"center"}>
        <title>{`Help | ${makeTheme.title}`}</title>
        <Typography variant="h3">Welcome to Make @ RIT!</Typography>
        <Typography variant="h5">Some info before you begin,</Typography>
        <br />

        <Typography fontSize={"1.5em"}>
            Before you can use the machines in each makerspace, you must complete trainings for <b>each makerspace</b> as well as <b>any machine you intend to use</b>
        </Typography>
        <br />
        <Typography fontSize={"1.5em"}>
            They can be found on each makerspace's page, listed on the <Link href="/">homepage</Link> or by clicking below
        </Typography>

        {/* Display makerspace cards */}
        <RequestWrapper2 result={getMakerspacesResult} render={(data) => {
            const spaces: MakerspaceWithHours[] = data.makerspaces;
            const filteredSpaces: MakerspaceWithHours[] = spaces.filter((_space: MakerspaceWithHours) => true); // TODO: grab the 'archieved' field from the db and check it (more logic than that required)
            const sortedSpaces = filteredSpaces.sort((a: MakerspaceWithHours, b: MakerspaceWithHours) => (a.name.toLowerCase().localeCompare(b.name.toLowerCase())));

            return (
                <Grid
                    container
                    marginTop="30px"
                    justifyContent={isMobile ? "center" : "space-evenly"}
                    alignItems="center" spacing={2}
                    width="auto"
                    marginLeft="0px"
                >
                    {sortedSpaces.map((space: MakerspaceWithHours) => (
                        <Grid gap={2}>
                            <MakerspaceCard
                                id={space.id}
                                name={space.name}
                                subtitle={space.subtitle}
                                location={space.location}
                                hours={space.hours}
                                imageUrl={space.imageUrl === undefined || space.imageUrl == null || space.imageUrl === "" ? import.meta.env.BASE_URL + "/shed_acronym_vert.jpg" : space.imageUrl}
                                isMobile={isMobile}
                            />
                        </Grid>
                    ))}
                </Grid>
            );
        }} />

        <br />
        <br />
        <Typography variant="body1" fontSize={"1.5em"}>
            More info can be found on the docs
            page <Link component={"a"} href={import.meta.env.VITE_HELP_PAGE_URL} >here</Link> or
            anytime by clicking the <HelpOutlineIcon /> icon in the footer.
        </Typography>

    </Stack>
}