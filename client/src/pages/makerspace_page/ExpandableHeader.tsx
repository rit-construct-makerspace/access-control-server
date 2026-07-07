import { Accordion, AccordionDetails, AccordionSummary, Button, Card, CardContent, IconButton, Link, Typography } from "@mui/material";
import { ModuleStatus } from "../../common/TrainingModuleUtils";
import { Box, Stack } from "@mui/system";
import { isManagerFor } from "../../common/PrivilegeUtils";
import EditIcon from "@mui/icons-material/Edit";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
import { FullMakerspace } from "../../queries/makerspaceQueries";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useCurrentUser } from "../../common/CurrentUserProvider";
import MakerspaceHours from "../../types/MakerspaceHours";
import MakerspaceHoursSection from "./MakerspaceHours";
import ThemedMarkdown from "../../common/ThemedMarkdown";
import CurrentHours from "../../common/CurrentHours";
import { useState } from "react";
import { useIsMobile } from "../../common/IsMobileProvider";

function HoursCard(hours: MakerspaceHours[], isMobile: boolean) {
  return (
    <Card sx={{ width: isMobile ? "100%" : "30%", height: "auto" }}>
      <CardContent>
        <Typography variant="h6" textAlign={"center"}>
          Hours
        </Typography>
        <MakerspaceHoursSection hours={hours} />
      </CardContent>
    </Card>
  );
}

function AboutCard({ location, description, docsLink }: FullMakerspace, isMobile: boolean) {
  return (
    <Card sx={{ width: isMobile ? "100%" : "70%", height: "auto" }}>
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
) {
  const title = <Typography variant={isMobile ? "h4" : "h3"}>{name}</Typography>;

  const editButton = canEdit ? (
    isMobile
      ? <Button color="secondary" variant="outlined" onClick={() => navigate(`/makerspace/${id}/edit`)} fullWidth>
        Manage Makerspace
      </Button>
      : <IconButton
        onClick={
          () => {
            navigate(`/makerspace/${id}/edit`);
          }}
        sx={{ color: "gray" }}
      >
        <EditIcon />
      </IconButton >
  ) : null;

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
    <Stack direction={isMobile ? "column" : "row"} alignItems={"center"} spacing={1}>
      {title} {editButton}
    </Stack>
  );

  if (isMobile) {
    return (
      <Stack direction={"column"} width={"100%"} spacing={"5px"}>
        {titleAndEdit}
        {hoursElement}
        {expandButton}
      </Stack>
    );
  }

  return (
    <Stack direction={"row"} alignItems={"center"} justifyContent={"space-between"} spacing={"15px"} width={"100%"}>
      {titleAndEdit}
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

  const [searchParams, setSearchParams] = useSearchParams()
  const startOpen = searchParams.get("o") == "1"
  const [expanded, setExpanded] = useState<boolean>(user.visitor || startOpen);

  return (
    <Accordion expanded={expanded} sx={{ border: "none" }} elevation={0} onChange={() => {setExpanded(!expanded); setSearchParams({"o":(!expanded)  ? "1" : "0"})}}>
      <AccordionSummary>
        {TitleRow(
          navigate,
          isMobile,
          expanded,
          makerspace.name,
          makerspace.id,
          isManagerFor(user, Number(makerspace.id)),
          makerspace.hours,
        )}
      </AccordionSummary>

      <AccordionDetails>
        {makerspaceTrainings.length > 0 && (
          <Stack direction={isMobile ? "column" : "row"} spacing={isMobile ? 2 : 5} justifyContent="space-around" flexGrow={0}>
            {AboutCard(makerspace, isMobile)}
            {HoursCard(makerspace.hours, isMobile)}
          </Stack>
        )}
      </AccordionDetails>
    </Accordion>
  );
}
