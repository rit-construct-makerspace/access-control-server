import { Autocomplete, TextField } from "@mui/material";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { GET_ALL_EQUIPMENTS } from "../queries/equipmentQueries";
import { useQuery } from "@apollo/client";
import GET_TRAINING_MODULES from "../queries/trainingQueries";
import GET_ROOMS from "../queries/roomQueries";
import { GET_MAKERSPACES } from "../queries/makerspaceQueries";

export default function GlobalSearchBar() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState<string>("");

  const getEquipment = useQuery(GET_ALL_EQUIPMENTS)
  const getTrainings = useQuery(GET_TRAINING_MODULES)
  const getRooms = useQuery(GET_ROOMS)
  const getMakerspaces = useQuery(GET_MAKERSPACES)

  const options: any[] =  getEquipment.data?.allEquipment.map((equipment:{ id:number, name:string, archived:boolean}) => ({label:equipment.name, category:"Equipments", item:equipment}));
  getTrainings.data?.modules.forEach((module:{ id:number, name:string, archived:boolean}) => {
    options.push({label:module.name, category:"Trainings", item:module})
  });
  getRooms.data?.rooms.forEach((room:{id:number, name:string}) => {
    options.push({label:room.name, category:"Rooms", item:room})
  });
  getMakerspaces.data?.makerspaces.forEach((makerspace:{id:number, name:string}) => {
    options.push({label:makerspace.name, category:"Makerspaces", item:makerspace})
  })

  const handleRedirect = (reason:string, value:any, origin:string) => {
    switch(reason){
      case 'input':
        setSearchQuery(value)
        break
      case 'createOption':
        navigate(`/search/` + searchQuery)
        break
      case 'selectOption':
        {
          const encodedLabel = value.label.replace('/', '%2F')
          navigate(`/search/` + encodedLabel)
          break
        }
        
    }
  };

  return (
    <Autocomplete
      disablePortal
      options={options}
      groupBy={(option) => option.category}
      sx={{ width: 300 }}
      freeSolo={true}
      autoHighlight={false}
      onChange={(e, v, r) => r === 'selectOption' || r=== 'createOption' ? handleRedirect(r, v === null ? "": v, "change") : {}}
      onInputChange={(e, v:string, r) => r === 'input' ? handleRedirect(r, v, "input"): {}}
      renderInput={(params) => <TextField {...params} label="Search Item" />}
    />

  );
}