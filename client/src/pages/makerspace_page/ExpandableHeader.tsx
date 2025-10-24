import { Accordion, AccordionDetails, AccordionSummary, Alert, Button, Card, CardContent, IconButton, Link, Typography } from "@mui/material";
import { ModuleStatus } from "../../common/TrainingModuleUtils";
import { Box, Stack } from "@mui/system";
import ModuleStatusRow from "../../common/ModuleStatusRow";
import { isManagerFor } from "../../common/PrivilegeUtils";
import EditIcon from "@mui/icons-material/Edit";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
import { FullMakerspace } from "../../queries/makerspaceQueries";
import { useNavigate } from "react-router-dom";
import { useCurrentUser } from "../../common/CurrentUserProvider";
import MakerspaceHours from "../../types/MakerspaceHours";
import MakerspaceHoursSection from "./MakerspaceHours";
import ThemedMarkdown from "../../common/ThemedMarkdown";
import CurrentHours from "../../common/CurrentHours";
import { useState } from "react";
import { useIsMobile } from "../../common/IsMobileProvider";

function HoursCard(hours: MakerspaceHours[]) {
  return (
    <Card sx={{ width: "100%", height: "auto" }}>
      <CardContent>
        <Typography variant="h6" textAlign={"center"}>
          Hours
        </Typography>
        <MakerspaceHoursSection hours={hours} />
      </CardContent>
    </Card>
  );
}

function AboutCard({ location, description, docsLink }: FullMakerspace) {
  return (
    <Card sx={{ width: "100%", height: "auto" }}>
      <CardContent>
        <Typography variant="h6" textAlign={"center"}>
          About
        </Typography>
        <ThemedMarkdown>{description}</ThemedMarkdown>
        <Typography variant="body1" color="textSecondary">
          Visit Us: {location}
        </Typography>
        See the <Link href={docsLink}>Docs Page</Link> for more information
      </CardContent>
    </Card>
  );
}

function MakerspaceTrainingCard(makerspaceTrainings: ModuleStatus[], user: any) {
  return (
    <Card sx={{ width: "100%", height: "auto" }}>
      <CardContent>
        <Typography variant="h6" textAlign={"center"}>
          Makerspace Trainings
        </Typography>

        <Stack direction={"column"} spacing={2} alignItems={"center"}>
          <Stack direction={"column"} spacing={2} alignItems={"center"}>
            {user.visitor ? (
              <Alert color="secondary">Log in to view training progress.</Alert>
            ) : makerspaceTrainings.some((ms) => ms.status !== "Passed" && ms.status !== "Expiring Soon") ? (
              <Alert severity="error">
                You must pass the makerspace trainings before you can use equipment in the makerspace!
              </Alert>
            ) : null}
          </Stack>
          <Stack direction={"column"} spacing={1}>
            {makerspaceTrainings.map((ms: ModuleStatus) => (
              <ModuleStatusRow ms={ms} />
            ))}
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  );
}

export interface ExpandableHeaderProps {
  makerspace: FullMakerspace;
  makerspaceTrainings: ModuleStatus[];
}

function TitleRow(
  navigate: any,
  isMobile: boolean,
  expanded: boolean,
  name: string,
  id: number,
  canEdit: boolean,
  hours: MakerspaceHours[],
  hasIncomplete: boolean,
  hasExpiring: boolean,
  user: any
) {
  const title = <Typography variant="h3">{name}</Typography>;

  const editIcon = canEdit ? (
    <IconButton
      onClick={() => {
        navigate(`/makerspace/${id}/edit`);
      }}
      sx={{ color: "gray" }}
    >
      <EditIcon />
    </IconButton>
  ) : null;

  const alert = user.visitor ? (
    // user is not logged in
    <Alert color="secondary">Log in to view training progress.</Alert>
  ) : hasIncomplete ? (
    // user is logged in with incomplete trainings
    <Alert color="error">You have incomplete makerspace trainings.</Alert>
  ) : hasExpiring ? (
    // user is logged in with expiring trainings
    <Alert color="warning">You have makerspace trainings that expire soon.</Alert>
  ) : undefined;

  const hoursElement = <CurrentHours times={hours} fillLine={isMobile} showDay={false} />;

  const expandButton = (
    <Button
      color="primary"
      variant="contained"
      endIcon={
        <KeyboardArrowUpIcon
          sx={{
            transition: "transform 250ms ease-in-out",
            transform: expanded ? "rotate(0deg)" : "rotate(180deg)",
          }}
        />
      }
      sx={{ fontSize: "1.25em", fontWeight: "bold", minWidth: "9em" }}
    >
      {expanded ? "Less Info" : "More Info"}
    </Button>
  );

  const titleAndEdit = (
    <Stack direction={"row"}>
      {title} {editIcon}
    </Stack>
  );

  if (isMobile) {
    return (
      <Stack direction={"column"} width={"100%"} spacing={"5px"}>
        {titleAndEdit}
        {hoursElement}
        {alert}
        {expandButton}
      </Stack>
    );
  }

  return (
    <Stack direction={"row"} alignItems={"center"} justifyContent={"space-between"} spacing={"15px"} width={"100%"}>
      {titleAndEdit}
      {alert}
      <Box flexGrow={1}></Box>
      {hoursElement}
      {expandButton}
    </Stack>
  );
}

export default function ExpandableHeader({ makerspace, makerspaceTrainings }: ExpandableHeaderProps) {
  const user = useCurrentUser();
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  const hasIncompleteSpaceTrainings = makerspaceTrainings.some(
    (ms) => ms.status !== "Passed" && ms.status !== "Expiring Soon"
  );
  const hasExpiringSoonSpaceTrainings = makerspaceTrainings.some((ms) => ms.status === "Expiring Soon");
  const [expanded, setExpanded] = useState<boolean>(hasIncompleteSpaceTrainings || hasExpiringSoonSpaceTrainings);

  return (
    <Accordion expanded={expanded} sx={{ border: "none" }} elevation={0} onChange={() => setExpanded(!expanded)}>
      <AccordionSummary>
        {TitleRow(
          navigate,
          isMobile,
          expanded,
          makerspace.name,
          makerspace.id,
          isManagerFor(user, Number(makerspace.id)),
          makerspace.hours,
          hasIncompleteSpaceTrainings,
          hasExpiringSoonSpaceTrainings,
          user
        )}
      </AccordionSummary>

      <AccordionDetails>
        {makerspaceTrainings.length > 0 && (
          <Stack direction={isMobile ? "column" : "row"} spacing={5} justifyContent="space-around" flexGrow={0}>
            {AboutCard(makerspace)}
            {HoursCard(makerspace.hours)}
            {MakerspaceTrainingCard(makerspaceTrainings, user)}
          </Stack>
        )}
      </AccordionDetails>
    </Accordion>
  );
}
