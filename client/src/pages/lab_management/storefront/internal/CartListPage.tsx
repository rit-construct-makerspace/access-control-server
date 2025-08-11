import { Box } from "@mui/material";
import PageSectionHeader from "../../../../common/PageSectionHeader";
import AdminPage from "../../../AdminPage";
import { Stack } from "@mui/system";
import { DataGrid, GridColDef } from "@mui/x-data-grid";
import AuditLogEntity from "../../audit_logs/AuditLogEntity";

export function CartListPage() {
  

  const columns: GridColDef<(typeof rows)[number]>[] = [

  ];

  return (
    <AdminPage>
      <PageSectionHeader>Active Carts</PageSectionHeader>

      <Box>
        <DataGrid
          rows={[]}
          columns={columns}
        />
      </Box>
    </AdminPage>
  )
}