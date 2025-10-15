import { Autocomplete, TextField } from "@mui/material";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { GET_ALL_EQUIPMENTS } from "../queries/equipmentQueries";
import { useQuery } from "@apollo/client";
import GET_TRAINING_MODULES from "../queries/trainingQueries";
import GET_ROOMS from "../queries/roomQueries";
import { FullMakerspace, GET_FULL_MAKERSPACES, GET_MAKERSPACES } from "../queries/makerspaceQueries";
import Equipment from "../types/Equipment";
import { TrainingModule } from "../common/TrainingModuleUtils";
import Room from "../types/Room";

export default function GlobalSearchBar() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState<string>("");

  const getEquipment = useQuery(GET_ALL_EQUIPMENTS)
  const getTrainings = useQuery(GET_TRAINING_MODULES)
  const getRooms = useQuery(GET_ROOMS)
  const getMakerspaces = useQuery(GET_FULL_MAKERSPACES)

  const options: any[] = [];
   getEquipment.data?.allEquipment.forEach((equipment:Equipment) => {
    options.push({label:equipment.name, category:"Equipments", item:equipment})
   });
  getTrainings.data?.modules.forEach((module:TrainingModule) => {
    options.push({label:module.name, category:"Trainings", item:module})
  });
  getRooms.data?.rooms.forEach((room:Room) => {
    options.push({label:room.name, category:"Rooms", item:room})
  });
  getMakerspaces.data?.makerspaces.forEach((makerspace:FullMakerspace) => {
    options.push({label:makerspace.name, category:"Makerspaces", item:makerspace})
  });

  const handleRedirect = (reason:string, value:any) => {
    switch(reason){
      case 'input':
        setSearchQuery(value)
        break
      case 'createOption':
        const encodedQuery = searchQuery.replace('/', '%2F')
        navigate(`/search/` + encodedQuery)
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
        blurOnSelect={true}
        onChange={(e, v, r) => {r === 'selectOption' || r === 'createOption' ? handleRedirect(r, v === null ? "" : v) : {}}}
        onInputChange={(e, v: string, r) => r === 'input' ? handleRedirect(r, v) : {}}
        renderInput={(params) => <TextField {...params} label="Search Item" onFocus={event => {event.target.select()}}/>}
      />
  );
}