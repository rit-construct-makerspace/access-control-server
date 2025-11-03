import PrettyModal from "../../../common/PrettyModal";
import { Link, useNavigate } from "react-router-dom";
import { useQuery } from "@apollo/client";
import { GET_EQUIPMENT_BY_ID } from "../../../queries/equipmentQueries";
import RequestWrapper2 from "../../../common/RequestWrapper2";
import { Avatar, Box, Card, Divider, Stack, Typography } from "@mui/material";
import { useCurrentUser } from "../../../common/CurrentUserProvider";
import TrainingModuleRow from "../../../common/TrainingModuleRow";
import {
  ModuleStatus,
  moduleStatusMapper,
} from "../../../common/TrainingModuleUtils";
import CloseButton from "../../../common/CloseButton";
import ReservationAttachment from "../../lab_management/reservations/ReservationAttachment";
import Markdown from "react-markdown";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CloseIcon from "@mui/icons-material/Close";
import LockOpenIcon from '@mui/icons-material/LockOpen';
import LockIcon from '@mui/icons-material/Lock';
import LockClockIcon from '@mui/icons-material/LockClock';
import { useIsMobile } from "../../../common/IsMobileProvider";
import { makeCDNLink } from "../../../common/ImageFinder.js";

interface EquipmentModalProps {
  equipmentID: number | undefined;
  setEquipmentID: React.Dispatch<React.SetStateAction<number | undefined>>;
}

export default function UnpagedEquipmentModal({ equipmentID, setEquipmentID }: EquipmentModalProps) {
  const isMobile = useIsMobile();

  const navigate = useNavigate();
  const user = useCurrentUser();

  const result = useQuery(GET_EQUIPMENT_BY_ID, { variables: { id: equipmentID } });

  const hasApprovedAccessCheck: boolean = !!user.accessChecks.find((ac) => Number(ac.equipmentID) == equipmentID && ac.approved)

  return (
    <PrettyModal
      open={!!equipmentID}
      onClose={() => setEquipmentID(undefined)}
      width={isMobile ? 250 : 400}
    >
      <RequestWrapper2
        result={result}
        render={({ equipment }) => {
          const moduleStatuses = equipment.trainingModules.map(
            moduleStatusMapper(user.passedModules, user.trainingHolds)
          );

          return (
            <Stack>
              <CloseButton onClick={() => setEquipmentID(undefined)} />
              <Stack direction="row" alignItems="center" spacing={2}>
                <Avatar
                  sx={{ width: 80, height: 80 }}
                  src={makeCDNLink(equipment.imageUrl, import.meta.env.VITE_CDN_EQUIPMENT_DIR + "/")}
                />
                <Stack>
                  <Typography variant="h4">{equipment.name}</Typography>
                  <Typography>{equipment.room.name}</Typography>
                  {equipment.sopUrl
                    && <ReservationAttachment name={"Standard Operating Procedure"} url={equipment.sopUrl} />}
                </Stack>
              </Stack>

              <Typography variant="h6" sx={{ mt: 6 }} hidden={moduleStatuses.length == 0 ? true : undefined}>
                Required training
              </Typography>

              <Stack divider={<Divider flexItem />} mb={6} hidden={moduleStatuses.length == 0 ? true : undefined}>
                {moduleStatuses.map((ms: ModuleStatus) => (
                  <TrainingModuleRow key={ms.moduleID} moduleStatus={ms} />
                ))}
              </Stack>

              <Typography variant="h6" sx={{ mt: 6 }}>
                Required Mentor Training Approval
              </Typography>
              <Typography variant="body2">
                Speak to a Maker Mentor {moduleStatuses.length != 0 && "once all trainings are complete "}to have this done.
              </Typography>
              <Box>
                <Stack direction={"row"} spacing={1} width={"75%"} p={2}>
                  {hasApprovedAccessCheck
                    ? <CheckCircleIcon color="success" />
                    : <CloseIcon color="error" />}
                  <Typography variant="body2" fontWeight={"bold"} fontSize={"1.1em"}>{hasApprovedAccessCheck ? "Complete" : "Incomplete"}</Typography>
                </Stack>
              </Box>

              <Box sx={{ mt: 6 }}>
                {!equipment.byReservationOnly && ((equipment.numAvailable + equipment.numInUse) > 0 && <Stack direction={"row"} alignItems={"center"}>
                  {equipment.numAvailable > 0
                    ? <LockOpenIcon color="success" />
                    : <LockIcon color="error" />}

                  <Typography variant="h6" ml={1}>
                    <b>{equipment.numAvailable}/{equipment.numInUse + equipment.numAvailable}</b> Machines available for use now
                  </Typography>
                </Stack>)}
                {equipment.byReservationOnly && <Stack direction={"row"} alignItems={"center"}>
                  <LockClockIcon color="warning" />

                  <Typography variant="h6" ml={1}>
                    Available by reservation only. Email <Link to={"mailto:make@rit.edu"} target={"_blank"}>make@rit.edu</Link> to schedule.
                  </Typography>
                </Stack>}
              </Box>

              <Card sx={{ px: 2 }}>
                <Markdown>{equipment.notes}</Markdown>
              </Card>

            </Stack>
          );
        }}
      />
    </PrettyModal>
  );
}
