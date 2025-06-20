import { useQuery } from "@apollo/client";
import { Stack } from "@mui/material";
import { DataGrid, GridColDef, GridDataSource, GridGetRowsParams } from "@mui/x-data-grid";
import { useState } from "react";
import { useParams } from "react-router-dom";
import { GET_READER_LOGS } from "../../../queries/readersQueries";

// todo , add typedef and query and schema and resolver for getting reader logs

interface ReaderLog {
    id: number;
    readerID: number;
    log: any;
};


export default function ReaderLogsPage() {
    const { makerspaceID } = useParams<{ makerspaceID: string }>();
    const hideOtherMakerspaces = useState<boolean>(true)

    const [rows, setRows] = useState([]);
    const [paginationModel, setPaginationModel] = useState({
        page: 0,
        pageSize: 10,
    });
    const [filterModel, setFilterModel] = useState({ items: [] });
    const [sortModel, setSortModel] = useState([]);


    const { loading, error, data } = useQuery(GET_READER_LOGS, {
        onCompleted: (a) => {
            console.log(a)
            setRows(a.readerLogs);
        }
    });

    var columns: GridColDef<(typeof rows)[number]>[] = [
        { field: 'dateTime', headerName: "Time" },
        { field: 'reader', headerName: "Reader" },
        { field: 'machine', headerName: "Machine" },
        { field: 'instance', headerName: "Instance" },
        { field: 'log', headerName: "Log Message" }
    ];

    return <Stack direction={"column"}>
        {/* menu */}

        <DataGrid
            columns={columns}
            rows={rows}
            pagination
        // sortingMode="server"
        // filterMode="server"
        // paginationMode="server"
        // onPaginationModelChange={setPaginationModel}
        // onSortModelChange={setSortModel}
        // onFilterModelChange={setFilterModel}
        />;
    </Stack >
}