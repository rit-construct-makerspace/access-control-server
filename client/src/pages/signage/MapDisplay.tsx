import { useParams } from "react-router-dom";
import RequestWrapper2 from "../../common/RequestWrapper2";
import { GET_MAKERSPACE_INSTANCE_STATES, MakerspaceInstanceStates } from "../../queries/makerspaceQueries";
import { useQuery } from "@apollo/client/react";
import { Button } from "@mui/material";

function stateToColor(state: string){
    switch (state){
        case "IDLE":
            return "yellow";
        case "ALWAYS_ON":
            return "green";
        case "UNLOCKED":
            return "green"
        case "LOCKED_OUT":
            return "red";
        }
        return "gray";
}

export default function MapDisplay() {
    const { makerspaceID } = useParams<{ makerspaceID: string }>();

    const getMakerspaceResult = useQuery(GET_MAKERSPACE_INSTANCE_STATES, { variables: { id: makerspaceID }, pollInterval: 300000 })
    return (
        <RequestWrapper2 result={getMakerspaceResult} render={(data) => {
          const makerspace: MakerspaceInstanceStates = data.makerspaceByID;
          
            function setInstanceColors(){
                const mapElem = document.getElementById("makerspace-map") as HTMLObjectElement
                if (mapElem == undefined){
                    console.log("couldnt find map")
                    return
                }
                if (mapElem.contentDocument == undefined){
                    console.log("couldnt find content doc")
                    return
                }
                console.log(mapElem)
                for (const room of makerspace.rooms){
                    for (const equipment of room.equipment){
                        for (const inst of equipment.instances){
                            if (inst.accessController == undefined){
                                continue
                            }
                            const elem_id=`Eq:${equipment.name}:${inst.name}:${inst.accessController.channelID}`.replaceAll(" ", "_").replaceAll("(", "_").replaceAll(")", "_")
                            console.log("check elem", elem_id)
                            const node = mapElem.contentDocument.getElementById(elem_id)
                            const color = stateToColor(inst.accessController.state)
                            if (node!=undefined){
                                node.style.fill = color
                            } else {
                                console.log("couldnt find")
                            }
                        }
                    }
                }
            }
            return <div>
                <p>{JSON.stringify(makerspace)}</p>
                {makerspace.mapSvgUrl == undefined ? 
                "no map for this makerspace": 
                <object id="makerspace-map" type="image/svg+xml" data={makerspace.mapSvgUrl} onLoad={(e)=>setInstanceColors()} />
                }
                <button onClick={(e)=>setInstanceColors()}>Recolor</button>
                <script>
                    let parent = document.getElementById("makerspace-map");
                    console.log("parent is", parent)
                </script>
                </div>
        }} />
    )
}