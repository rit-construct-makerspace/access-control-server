import { CardActionArea, Divider, Grid, Link, Stack, Typography } from "@mui/material";
import { useNavigate, useParams } from "react-router-dom";
import Equipment from "../../../types/Equipment";
import { GET_EQUIPMENTS } from "../../../queries/equipmentQueries";
import { useQuery } from "@apollo/client";
import EquipmentCard from "../../../common/EquipmentCard";
import { useIsMobile } from "../../../common/IsMobileProvider";
import { useCurrentUser } from "../../../common/CurrentUserProvider";
import RequestWrapper from "../../../common/RequestWrapper";
import GET_TRAINING_MODULES from "../../../queries/trainingQueries";
import { ModuleStatus, moduleStatusMapper, TrainingModule } from "../../../common/TrainingModuleUtils";
import ModuleStatusRow from "../../../common/ModuleStatusRow";
import { GET_MAKERSPACES_WITH_HOURS, MakerspaceWithHours } from "../../../queries/makerspaceQueries";
import MakerspaceCard from "../homepage/MakerspaceCard";

export default function GlobalSearchPage (){
  const {query} = useParams();  
  const user = useCurrentUser();
  const isMobile = useIsMobile();
  const navigate = useNavigate();

  const getEquipment = useQuery(GET_EQUIPMENTS);
  const filteredEquipment = getEquipment.data?.equipments.filter((equipment: Equipment) => equipment.name.toLowerCase().includes(query!.toLowerCase()));
  const foundEquipments = filteredEquipment?.map((equipment: Equipment) => (
    <Grid key={equipment.id}>
      <EquipmentCard equipment={equipment} isMobile={isMobile} staffMode={false} />
    </Grid>
    ));


  // TODO: make a new query for published only and/or to allow visitors to query this
  const getTrainings = useQuery(GET_TRAINING_MODULES);
  const filteredTrainings = getTrainings.data?.modules.filter((training: TrainingModule) => training.name.toLowerCase().includes(query!.toLowerCase()));
  const moduleStatuses = filteredTrainings?.map(
    moduleStatusMapper(user.passedModules, user.trainingHolds)
  );
  const foundTrainingsVisitor = getTrainings?.data?.modules?.map((module: TrainingModule) => (
    <CardActionArea onClick={() => navigate(`/maker/training/${module.moduleID}`)} sx={{ width: "unset" }}>
      <Stack direction="row" spacing={1} alignItems="center" padding="10px" width="100%"></Stack>
      <Stack direction="column" width="100%">
        <Link variant="body2" color="primary" width={"stretch"}>{module.moduleName}</Link>
      </Stack>
    </CardActionArea>
  ));
  const foundTrainingsUser = moduleStatuses?.map((moduleStatus: ModuleStatus) => (
    <Grid key={moduleStatus.moduleID} size={isMobile ? 12 : 3}>
      <ModuleStatusRow ms={moduleStatus} />
    </Grid>
  ));
  const foundTrainings = user.visitor ? foundTrainingsVisitor : foundTrainingsUser

  const getMakerspaces = useQuery(GET_MAKERSPACES_WITH_HOURS)
  const filteredMakerspaces = getMakerspaces.data?.makerspaces.filter((makerspace: MakerspaceWithHours) => makerspace.name.toLowerCase().includes(query!.toLowerCase()))
  const foundMakerspaces = filteredMakerspaces?.map((makerspace: MakerspaceWithHours) =>
    <Grid gap={2}>
      <MakerspaceCard
        id={makerspace.id}
        name={makerspace.name}
        subtitle={makerspace.subtitle}
        location={makerspace.location}
        hours={makerspace.hours}
        imageUrl={
          makerspace.imageUrl === undefined || makerspace.imageUrl == null || makerspace.imageUrl === ""
            ? import.meta.env.BASE_URL + "/shed_acronym_vert.jpg"
            : makerspace.imageUrl
        }
        isMobile={isMobile}
      />
    </Grid>
  )

  return(
    <RequestWrapper loading={getEquipment.loading} error={getEquipment.error} >
      <Stack spacing={"2"} padding={"0 20px 20px"} divider={<Divider orientation="horizontal" flexItem />}>
        <title>{`${query} - Search Results`}</title>
        <Stack padding={"10px 0"} spacing={1}><Typography variant="h4" pl={"10px"}>Equipment</Typography>
          {foundEquipments?.length > 0 ?
            <Grid container spacing={3} justifyContent="center">
              {foundEquipments}
            </Grid>
            : <Typography alignSelf="center" variant="h6" pl={"10px"}>No Equipment Found</Typography>
          }
        </Stack>
        <Stack padding={"10px 0"} spacing={1}><Typography variant="h4" pl={"10px"}>Trainings</Typography>
          {foundTrainings?.length > 0 ?
            <Grid container spacing={3} justifyContent="left">
              {foundTrainings}
            </Grid>
            : <Typography alignSelf="center" variant="h6" pl={"10px"}>No Trainings Found</Typography>
          }
        </Stack>
                <Stack padding={"10px 0"} spacing={1}><Typography variant="h4" pl={"10px"}>Makerspaces</Typography>
          {foundMakerspaces?.length > 0 ?
            <Grid container spacing={3} justifyContent="center">
              {foundMakerspaces}
            </Grid>
            : <Typography alignSelf="center" variant="h6" pl={"10px"}>No Makerspaces Found</Typography>
          }
        </Stack>
      </Stack>
    </RequestWrapper>
  );
}