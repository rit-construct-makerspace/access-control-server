import { useMutation } from "@apollo/client/react";
import { Button, Checkbox, Stack, TextField } from "@mui/material";
import { PAIR_READER } from "../../queries/readersQueries";
import { useState } from "react";

export default function NewReaderPage() {
    const [pairReader] = useMutation(PAIR_READER);

    // Server Config
    const [HumanName, setHumanName] = useState("Enter settings and hit Pair to receive a human readable name");
    const [Cert, setCert] = useState("Enter settings and hit Pair to see cert");
    const [ServerJSON, setServerJSON] = useState("Enter settings and hit Pair to see server JSON");
    const [NetworkJSON, setNetworkJSON] = useState("Enter settings and hit submit to see network JSON");

    // Network Config
    const [SSID, setSSID] = useState("");
    const [Password, setPassword] = useState("");
    const [UseWifi, setUseWifi] = useState(true);

    // Hardware/Last Config
    const [LastSSID, setLastSSID] = useState("LastSSID");
    const [HaveEthernet, setHaveEthernet] = useState(false);
    const [WasAllowedWifi, setWasAllowedHaveWifi] = useState(true);
    const [SerialNumber, setSerialNumber] = useState("ABCD");



    function applyHW(){
        setSSID(LastSSID);
    }

    function applyNetworkToJson(){
        const obj: any = {};
        if (UseWifi){
            obj["SSID"] = SSID;
            obj["Password"] = Password;
        }
        obj["AllowedWifi"] = UseWifi;
        return (JSON.stringify(obj));
    }

    function handlePair(resp: {data?: {pairReader: {readerKey: string, name: string, certs: string, siteName: string}}}){
        if (resp?.data?.pairReader == null){
            setServerJSON("Failed to pair (no json)");
            setCert("Failed to pair (no certs)");
            return;
        }
        const obj: any = {};
        obj["Server"] = resp.data.pairReader.siteName;
        obj["Key"] = resp.data.pairReader.readerKey;

        obj["SSID"] = SSID;
        obj["Password"] = Password;

        setServerJSON(JSON.stringify(obj));
        setCert(resp.data.pairReader.certs);
        setHumanName(resp.data.pairReader.name);

    }

    return <Stack direction={"column"}>
    <h1>This will be automatic soon</h1>

    <h2>0. Hardware Identification</h2>
        This will happen automatically on connect to shlug
        <Stack direction={"row"}>
            Serial Number
            <TextField onChange={(e)=>setSerialNumber(e.target.value)} value={SerialNumber}></TextField>
        </Stack>
        <Stack direction={"row"}>
            HaveEthernet
            <Checkbox onChange={(e)=>setHaveEthernet(e.target.checked)} checked={HaveEthernet}/>
        </Stack>
        <Stack direction={"row"}>
            AllowedWifi
            <Checkbox onChange={(e)=>setWasAllowedHaveWifi(e.target.checked)} checked={WasAllowedWifi}/>
        </Stack>
        <Stack direction={"row"}>
            Last SSID
            <TextField onChange={(e)=>setLastSSID(e.target.value)} value={LastSSID}></TextField>
        </Stack>
        <Button variant="contained" onClick={() => applyHW()}>Apply</Button>

        
    <h2>1.Network </h2>
    
        <Stack direction={"row"}>
            Use Wifi
            <Checkbox onChange={(e)=>setUseWifi(e.target.checked)} checked={UseWifi} />
        </Stack>

        { UseWifi ? 
        <Stack direction="column">
            <Stack direction={"row"}>
                WiFi SSID
                <TextField onChange={(e)=>setSSID(e.target.value)} value={SSID}></TextField>
            </Stack>
            <Stack direction={"row"}>
                WiFi Password
                <TextField onChange={(e)=>setPassword(e.target.value)} value={Password}></TextField>
            </Stack>
        </Stack>
        : null
        }

        <Button variant="contained" onClick={() => setNetworkJSON(applyNetworkToJson())}>Submit</Button>

        Network JSON <pre>{NetworkJSON}</pre>



    <h2>2. Server</h2>
        <Button variant="contained" onClick={() => pairReader({variables: {SN: SerialNumber}}).then(handlePair)}>Pair</Button>
        <h3>Name</h3>
        <pre>{HumanName}</pre>
        <h3>Server JSON</h3> 
        <pre>{ServerJSON}</pre>
        <h3>Cert</h3>
        <pre>{Cert}</pre>

    </Stack>
}
