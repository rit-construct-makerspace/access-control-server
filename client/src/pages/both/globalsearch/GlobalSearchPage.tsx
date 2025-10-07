import { Typography } from "@mui/material";
import { useParams } from "react-router-dom";

export default function GlobalSearchPage (){
  const {query} = useParams();  

  return(
    <Typography>{query}</Typography>
  );
}