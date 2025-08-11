import { Box, Button, Card, CardContent, CardMedia, Stack, Typography, useTheme } from "@mui/material";
import Equipment from "../types/Equipment";
import { useCurrentUser } from "./CurrentUserProvider";
import { ModuleStatus, moduleStatusMapper } from "./TrainingModuleUtils";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CloseIcon from "@mui/icons-material/Close";
import { Link, useNavigate } from "react-router-dom";
import ConstructionIcon from '@mui/icons-material/Construction';
import ReactMarkdown from "react-markdown";
import ModuleStatusRow from "./ModuleStatusRow";

interface EquipmentCardProps {
    equipment: Equipment;
    isMobile: boolean;
    staffMode: boolean;
}

export default function EquipmentCard(props: EquipmentCardProps) {
    const user = useCurrentUser();
    const navigate = useNavigate();
    const theme = useTheme();
    const isPriviledged = props.staffMode;
    const hasApprovedAccessCheck: boolean = user.accessChecks.some((ac) => Number(ac.equipmentID) === Number(props.equipment.id) && ac.approved)

    const moduleStatuses = props.equipment.trainingModules.map(
        moduleStatusMapper(user.passedModules, user.trainingHolds)
    );

    return (
        <Card sx={{
            width: props.isMobile ? "350px" : "600px",
            backgroundColor: props.equipment.archived ? theme.palette.error.light : undefined,
            height: "100%"
        }}>
            <CardContent sx={{ width: "100%", height: "100%" }}>
                <Stack height={"100%"}>
                    <Stack direction="row" height="200px">
                        {props.isMobile ? null :
                            <Stack alignItems="center">
                                <Box width="150px" height="175px">
                                    <CardMedia
                                        component="img"
                                        image={(props.equipment.imageUrl === undefined || props.equipment.imageUrl == null || props.equipment.imageUrl === "") ? process.env.PUBLIC_URL + "/shed_acronym_vert.jpg" : "" + process.env.REACT_APP_CDN_URL + process.env.REACT_APP_CDN_EQUIPMENT_DIR + "/" + props.equipment.imageUrl}
                                        alt={`Picture of ${props.equipment.name}`}
                                        sx={{ width: "150px", height: "175px", backgroundColor: "lightgray" }}
                                    />
                                </Box>
                                {isPriviledged ? <Typography variant="body2">ID {props.equipment.id}</Typography> : null}
                            </Stack>
                        }

                        <Stack height="100%" width={"100%"}>
                            {/* Title & Edit button */}
                            <Stack direction="row" justifyContent="space-between" pl={"10px"}>
                                <Typography variant="h6">{props.equipment.archived ? `${props.equipment.name} (Hidden)` : props.equipment.name}</Typography>
                                {
                                    isPriviledged
                                        ? <Button
                                            onClick={() => { navigate(`/admin/equipment/${props.equipment.archived ? "archived/" : ""}${props.equipment.id}`) }}
                                            aria-label="edit button"
                                            sx={{ width: "40px", height: "40px" }}
                                            variant="contained"
                                            color="primary"
                                        >
                                            <ConstructionIcon />
                                        </Button>
                                        : null
                                }
                            </Stack>
                            <Stack direction="row" justifyContent="space-between" height="100%">
                                {/* Trainings & Access Check */}
                                <Stack width="100%">
                                    {moduleStatuses.map((ms: ModuleStatus) => (
                                        <ModuleStatusRow ms={ms} />
                                    ))}
                                    {
                                        !props.equipment.byReservationOnly
                                            ? <Stack direction={"row"} spacing={1} alignItems="center" padding="10px">
                                                {
                                                    hasApprovedAccessCheck
                                                        ? <CheckCircleIcon color="success" />
                                                        : <CloseIcon color="error" />
                                                }
                                                <Typography variant="body2">In-Person Competency Check</Typography>
                                            </Stack>
                                            : null
                                    }
                                </Stack>
                                {/* Num available || by reservation only */}
                                <Stack width="120px" height="100%" justifyContent={"center"} alignItems={"center"}>
                                    {props.equipment.byReservationOnly
                                        ? <Typography variant="subtitle1" ml={1}>
                                            Reservation only. Email <Link to={"mailto:make@rit.edu"} target={"_blank"}>make@rit.edu</Link> to schedule.
                                        </Typography>
                                        : props.equipment.numAvailable + props.equipment.numInUse > 0 ?
                                            <Stack height="100%" justifyContent="center" alignItems="center">
                                                <Typography variant="subtitle1" align="center" fontWeight="bold">
                                                    Machines Available
                                                </Typography>
                                                <Typography variant="subtitle1" align="center">
                                                    {`${props.equipment.numAvailable} / ${props.equipment.numAvailable + props.equipment.numInUse}`}
                                                </Typography>
                                            </Stack>
                                            :
                                            <></>
                                    }
                                </Stack>
                            </Stack>

                        </Stack>
                    </Stack>
                    {/* Desc && learn more */}
                    <Stack justifyContent={"space-between"} height={"inherit"}>
                        <Typography>
                            <ReactMarkdown>{props.equipment.notes}</ReactMarkdown>
                        </Typography>
                        <Button
                            size="small"
                            variant="contained"
                            color="info"
                            onClick={() => window.open(props.equipment.sopUrl, "_blank")}
                            sx={{ alignSelf: "flex-end" }}
                        >
                            Learn More
                        </Button>
                    </Stack>
                </Stack>
            </CardContent>
        </Card>
    );
}