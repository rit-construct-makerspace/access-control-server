import { Box, Button } from "@mui/material";
import PageSectionHeader from "../../../../common/PageSectionHeader";
import AdminPage from "../../../AdminPage";
import { Stack } from "@mui/system";
import { DataGrid, GridColDef } from "@mui/x-data-grid";
import AuditLogEntity from "../../audit_logs/AuditLogEntity";
import { useQuery } from "@apollo/client";
import { GET_CARTS } from "../../../../queries/cartQueries";
import { InventoryCart } from "../../../../types/InventoryCart";
import { useState } from "react";
import { GET_MAKERSPACES } from "../../../../queries/makerspaceQueries";
import { Checkbox, FormControlLabel, FormGroup, TextField, CircularProgress } from "@mui/material";
import { useNavigate, useParams } from "react-router-dom";

export function CartListPage() {
  const navigate = useNavigate();
  const { makerspaceID } = useParams<{ makerspaceID: string }>();

  const getCartsResult = useQuery(GET_CARTS, { pollInterval: 10000 });
  const getMakerspacesResult = useQuery(GET_MAKERSPACES);

  const [filteredMakerspaces, setFilteredMakerspaces] = useState<number[]>(makerspaceID ? [parseInt(makerspaceID)] : []);
  const [userSearch, setUserSearch] = useState<string>("");

  const makerspaces = getMakerspacesResult.data?.makerspaces || [];
  const rows: InventoryCart[] = getCartsResult.data?.carts || [];

  // Filtering logic
  const filteredRows = rows.filter((cart) => {
    // Makerspace filter
    const makerspaceMatch = filteredMakerspaces.length === 0 || filteredMakerspaces.includes(Number(cart.makerspace.id));
    // User filter (search by first, last, or username)
    const userString = `${cart.user.firstName} ${cart.user.lastName} ${cart.user.ritUsername}`.toLowerCase();
    const userMatch = userString.includes(userSearch.toLowerCase());
    return makerspaceMatch && userMatch;
  });

  const columns: GridColDef<(typeof rows)[number]>[] = [
    {
      field: "id",
      headerName: "ID",
      width: 50,
    },
    {
      field: "user",
      headerName: "User",
      width: 300,
      renderCell: (params) => <AuditLogEntity entityCode={`user:${params.row.user.id}:${params.row.user.firstName} ${params.row.user.lastName} (${params.row.user.ritUsername})`} />,
    },
    {
      field: "makerspace",
      headerName: "Makerspace",
      width: 250,
      renderCell: (params) => <AuditLogEntity entityCode={`makerspace:${params.row.makerspace.id}:${params.row.makerspace.name}`} />,
    },
    {
      field: "actions",
      headerName: "Actions",
      width: 250,
      renderCell: (params) => (
        <Stack direction="row" spacing={1}>
          <Button variant="contained" color="primary" onClick={() => navigate(`/makerspace/${params.row.makerspace.id}/storefront/carts/${params.row.id}`)}>
            View Cart
          </Button>
        </Stack>
      ),
    },
    {
      field: "lastModified",
      headerName: "Last Updated",
      width: 220,
      valueGetter: (value) => new Date(value).toLocaleString(),
    },
  ];

  return (
    <AdminPage>
      <title>Carts | Make @ RIT</title>
      <Box m={"20px"}>
        <PageSectionHeader>Active Carts</PageSectionHeader>

        <Stack direction="row" spacing={4} mb={2} alignItems="center">
          {/* Makerspace Filter */}
          <FormGroup row>
            {getMakerspacesResult.loading ? <CircularProgress size={24} /> : makerspaces.map((zone: { id: number, name: string }) => (
              <FormControlLabel
                key={zone.id}
                control={
                  <Checkbox
                    checked={filteredMakerspaces.includes(Number(zone.id))}
                    onChange={(e) => {
                      setFilteredMakerspaces((prev) =>
                        e.target.checked
                          ? [...prev, Number(zone.id)]
                          : prev.filter((id) => id !== Number(zone.id))
                      );
                    }}
                  />
                }
                label={zone.name}
              />
            ))}
          </FormGroup>
          {/* User Search Filter */}
          <TextField
            label="Search User"
            value={userSearch}
            onChange={(e) => setUserSearch(e.target.value)}
            size="small"
          />
        </Stack>

        <Box>
          <DataGrid
            rows={filteredRows}
            columns={columns}
            autoHeight
          />
        </Box>
      </Box>
    </AdminPage>
  );
}