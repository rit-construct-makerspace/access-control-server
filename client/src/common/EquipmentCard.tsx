import { Box, Button, Card, CardActionArea, CardContent, CardHeader, CardMedia, IconButton, Stack, Typography, useTheme } from "@mui/material";
import Equipment from "../types/Equipment";
import { useCurrentUser } from "./CurrentUserProvider";
import EditIcon from '@mui/icons-material/Edit';
import { ModuleStatus, moduleStatusMapper } from "./TrainingModuleUtils";
import TrainingModuleRow from "./TrainingModuleRow";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CloseIcon from "@mui/icons-material/Close";
import { Link, useNavigate } from "react-router-dom";
import WarningIcon from "@mui/icons-material/Warning";
import HourglassBottomIcon from '@mui/icons-material/HourglassBottom';
import LockClockIcon from '@mui/icons-material/LockClock';
import ConstructionIcon from '@mui/icons-material/Construction';
import ReactMarkdown from "react-markdown";

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
    const hasApprovedAccessCheck: boolean = !!user.accessChecks.find((ac) => Number(ac.equipmentID) == props.equipment.id && ac.approved)

    const moduleStatuses = props.equipment.trainingModules.map(
        moduleStatusMapper(user.passedModules, user.trainingHolds)
    );

    return (
        <Card sx={{width: props.isMobile ? "350px" : "600px", minHeight: "350px", backgroundColor: props.equipment.archived ? theme.palette.error.light : undefined}}>
            <Stack>
                <Stack direction="row" height="200px">
                    {props.isMobile ? null :
                        <Stack alignItems="center">
                            <Box width="150px" height="175px">
                                <CardMedia
                                    component="img"
                                    image={(props.equipment.imageUrl == undefined || props.equipment.imageUrl == null || props.equipment.imageUrl == "") ? process.env.PUBLIC_URL + "/shed_acronym_vert.jpg" : "" + process.env.REACT_APP_CDN_URL + process.env.REACT_APP_CDN_EQUIPMENT_DIR + "/" + props.equipment.imageUrl}
                                    alt={`Picture of ${props.equipment.name}`}
                                    sx={{width: "150px", height: "175px", backgroundColor: "lightgray"}}
                                />
                            </Box>
                            {isPriviledged ? <Typography variant="body2">ID {props.equipment.id}</Typography> : null}
                        </Stack>
                    }
                    <CardContent sx={{width: "100%", height: "100%"}}>
                        <Stack height="100%">
                            {/* Title & Edit button */}
                            <Stack direction="row" justifyContent="space-between">
                                <Typography variant="h6">{props.equipment.archived ? `${props.equipment.name} (Hidden)` : props.equipment.name}</Typography>
                                {
                                    isPriviledged
                                    ? <Button
                                        onClick={() => {navigate(`/admin/equipment/${props.equipment.archived ? "archived/" : ""}${props.equipment.id}`)}}
                                        aria-label="edit button"
                                        sx={{width: "40px", height: "40px"}}
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
                                        <CardActionArea onClick={() => navigate(`/maker/training/${ms.moduleID}`)}>
                                            <Stack direction="row" spacing={1} alignItems="center" padding="10px" width="100%">
                                                {
                                                    ms.status === "Passed"
                                                    ? <CheckCircleIcon color="success" />
                                                    : ms.status === "Not taken"
                                                    ? <CloseIcon color="error" />
                                                    : ms.status === "Expired"
                                                    ? <WarningIcon color="warning" />
                                                    : ms.status === "Expiring Soon"
                                                    ? <HourglassBottomIcon color="warning" />
                                                    : ms.status === "Locked"
                                                    ? <LockClockIcon color="error" />
                                                    : null
                                                }
                                                <Typography variant="body2">{ms.moduleName}</Typography>
                                            </Stack>
                                        </CardActionArea>
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
                                <Box width="120px" height="100%">
                                    {props.equipment.byReservationOnly
                                        ? <Typography variant="subtitle1" ml={1}>
                                            Reservation only. Email <Link to={"mailto:make@rit.edu"} target={"_blank"}>make@rit.edu</Link> to schedule.
                                        </Typography>
                                        : <Stack height="100%" justifyContent="center" alignItems="center">
                                            <Typography variant="subtitle1" align="center" fontWeight="bold">
                                                Machines Available
                                            </Typography>
                                            <Typography variant="subtitle1" align="center">
                                                {`${props.equipment.numAvailable} / ${props.equipment.numAvailable + props.equipment.numInUse}`}
                                            </Typography>
                                        </Stack>
                                    }
                                </Box>
                            </Stack>
                            
                        </Stack>
                    </CardContent>
                </Stack>
                <CardContent>
                    {/* Desc && learn more */}
                    <Typography>
                        <ReactMarkdown>{props.equipment.notes}</ReactMarkdown>
                        <Link to={props.equipment.sopUrl} target="_blank" rel="noopener noreferrer">Learn More</Link>
                    </Typography>
                </CardContent>
            </Stack>
        </Card>
    );
}