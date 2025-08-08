import { useState } from "react";
import { Box, Button, Grid, Stack, Typography } from "@mui/material";
import SearchBar from "../../../common/SearchBar";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@apollo/client";
import { GET_EQUIPMENTS, GET_ARCHIVED_EQUIPMENTS } from "../../../queries/equipmentQueries";
import RequestWrapper from "../../../common/RequestWrapper";
import EditableEquipmentCard from "./EditableEquipmentCard";
import Equipment from "../../../types/Equipment";

export default function ManageEquipmentPage({ showLogs }: { showLogs?: boolean }) {
  const navigate = useNavigate();

  const getEquipmentsResult = useQuery(GET_EQUIPMENTS);
  const getArchivedEquipmentsResult = useQuery(GET_ARCHIVED_EQUIPMENTS);

  const [searchText, setSearchText] = useState("");

  const url = "/admin/equipment/";

  return (
    <Box padding="25px">
      <title>Manage Equipment | Make @ RIT</title>
      <Stack
        spacing={2}
      >
        <Stack direction="row" spacing={2}>
          <SearchBar placeholder={"Search " + getEquipmentsResult.data?.equipments.length + " equipment"}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
          />
          <Button
            variant="contained"
            onClick={() => navigate("/admin/equipment/new")}
          >
            + Add Equipment
          </Button>
        </Stack>

        <Typography variant="h5">
          Active Equipment
        </Typography>

        <RequestWrapper
          loading={getEquipmentsResult.loading && getArchivedEquipmentsResult.loading}
          error={getEquipmentsResult.error}
        >
          <Grid container spacing={3} mt={2}>
            {getEquipmentsResult.data?.equipments
              .filter((m: Equipment) =>
                m.name
                  .toLocaleLowerCase()
                  .includes(searchText.toLocaleLowerCase())
              )
              .map((e: Equipment) => (
                <Grid key={e.id}>
                  <EditableEquipmentCard id={e.id} name={e.name} to={url + e.id} archived={false} sopUrl={e.sopUrl} imageUrl={((e.imageUrl === undefined || e.imageUrl == null || e.imageUrl === "") ? import.meta.env.PUBLIC_URL + "/shed_acronym_vert.jpg" : "" + import.meta.env.VITE_CDN_URL + import.meta.env.VITE_CDN_EQUIPMENT_DIR + "/" + e.imageUrl)} />
                </Grid>
              ))}
          </Grid>
        </RequestWrapper>

        <Typography variant="h5">
          Hidden Equipment
        </Typography>

        <RequestWrapper
          loading={getEquipmentsResult.loading && getArchivedEquipmentsResult.loading}
          error={getArchivedEquipmentsResult.error}
        >
          <Grid container spacing={3} mt={2}>
            {getArchivedEquipmentsResult.data?.archivedEquipments
              .filter((m: Equipment) =>
                m.name
                  .toLocaleLowerCase()
                  .includes(searchText.toLocaleLowerCase())
              )
              .map((e: Equipment) => (
                <Grid key={e.id}>
                  <EditableEquipmentCard id={e.id} name={e.name} to={url + "/archived/" + e.id} archived={true} sopUrl={e.sopUrl} imageUrl={((e.imageUrl === undefined || e.imageUrl == null || e.imageUrl === "") ? import.meta.env.PUBLIC_URL + "/shed_acronym_vert.jpg" : "" + import.meta.env.VITE_CDN_URL + import.meta.env.VITE_CDN_EQUIPMENT_DIR + "/" + e.imageUrl)} />
                </Grid>
              ))}
          </Grid>
        </RequestWrapper>
      </Stack>
    </Box>
  );
}