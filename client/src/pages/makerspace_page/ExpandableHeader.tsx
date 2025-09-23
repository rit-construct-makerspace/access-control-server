import { Accordion, AccordionDetails, AccordionSummary, Alert, Button, Card, CardContent, IconButton, Link, Typography } from "@mui/material";
import { ModuleStatus } from "../../common/TrainingModuleUtils";
import { Box, Stack } from "@mui/system";
import ModuleStatusRow from "../../common/ModuleStatusRow";
import { isManagerFor } from "../../common/PrivilegeUtils";
import EditIcon from '@mui/icons-material/Edit';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown'
import { FullMakerspace } from "../../queries/makerspaceQueries";
import { useNavigate } from "react-router-dom";
import { useCurrentUser } from "../../common/CurrentUserProvider";
import MakerspaceHours from "../../types/MakerspaceHours";
import MakerspaceHoursSection from "./MakerspaceHours";
import ThemedMarkdown from "../../common/ThemedMarkdown";
import CurrentHours from "../../common/CurrentHours";


function HoursCard(hours: MakerspaceHours[]) {
    return <Card sx={{ width: "100%", height: "auto" }}>
        <CardContent>
            <Typography variant="h6">Hours</Typography>
            <MakerspaceHoursSection hours={hours} />
        </CardContent>
    </Card>
}

function AboutCard({ location, description, docsLink }: FullMakerspace) {
    return <Card sx={{ width: "100%", height: "auto" }}>
        <CardContent>
            <Typography variant="h6">About</Typography>
            <ThemedMarkdown>{description}</ThemedMarkdown>

            <Typography variant="body1" color="textSecondary">Visit Us: {location}</Typography>
            See the <Link href={docsLink}>Docs Page</Link> for more information

        </CardContent>
    </Card>
}

function MakerspaceTrainingCard(makerspaceTrainings: ModuleStatus[]) {
    return <Card sx={{ width: "100%", height: "auto" }}>
        <CardContent>
            <Typography variant="h6">Makerspace Trainings</Typography>
            {/* <Typography variant="body1" color="textSecondary">You must complete these trainings before using any equipment in the makerspace</Typography> */}

            <Stack direction={"column"} spacing={2} alignItems={"center"}>
                {
                    makerspaceTrainings.some((ms) => (ms.status !== "Passed" && ms.status !== "Expiring Soon"))
                        ? <Alert severity="error">You must pass the makerspace trainings before you can use equipment in the makerspace!</Alert>
                        : null
                }
            </Stack>
            <Stack direction={"column"} spacing={1} alignItems={"center"}>
                {
                    makerspaceTrainings.map((ms: ModuleStatus) => (
                        <ModuleStatusRow ms={ms} />
                    ))
                }
            </Stack>
        </CardContent>
    </Card>

}

export interface ExpandableHeaderProps {
    makerspace: FullMakerspace,
    makerspaceTrainings: ModuleStatus[]
}

export default function ExpandableHeader({ makerspace, makerspaceTrainings }: ExpandableHeaderProps) {
    const user = useCurrentUser();
    const navigate = useNavigate();

    const hasIncompleteSpaceTrainings = makerspaceTrainings.some(ms => ms.status !== "Passed");
    const hasExpiringSoonSpaceTrainings = makerspaceTrainings.some(ms => ms.expirationDate)
    const alert = hasIncompleteSpaceTrainings
        ? <Alert color="error">
            You have incomplete makerspace trainings.
        </Alert>
        : hasExpiringSoonSpaceTrainings
            ? <Alert color="warning">
                You have makerspace trainings that expire soon.
            </Alert>
            : undefined;

    return <Accordion defaultExpanded={hasIncompleteSpaceTrainings} sx={{ border: "none" }} elevation={0}>
        <AccordionSummary>
            <Stack direction={"row"} alignItems={"center"} justifyContent={"space-between"} spacing={"10px"} width={"100%"}>
                <Typography variant="h3">{makerspace.name}</Typography>
                {
                    isManagerFor(user, Number(makerspace.id))
                        ? <IconButton
                            onClick={() => { navigate(`/makerspace/${makerspace.id}/edit`) }}
                            sx={{ color: "gray" }}
                        ><EditIcon /></IconButton>
                        : null
                }
                {alert}
                <Box flexGrow={1}></Box>
                <CurrentHours times={makerspace.hours} fillLine={false} showDay={false}/>
                <Button  color="primary" variant="contained" endIcon={<KeyboardArrowDownIcon />} sx={{fontSize: "1.25em", fontWeight: "bold"}}>More Info</Button>
            </Stack>
        </AccordionSummary>

        <AccordionDetails>
            {
                makerspaceTrainings.length > 0 &&
                <Stack direction={"row"} spacing={3} justifyContent="space-around" flexGrow={0}>
                    {AboutCard(makerspace)}
                    {HoursCard(makerspace.hours)}
                    {MakerspaceTrainingCard(makerspaceTrainings)}
                </Stack>
            }
        </AccordionDetails>
    </Accordion>

}
