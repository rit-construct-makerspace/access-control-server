import express from "express";
import xmlparser from "express-xml-bodyparser";
import * as xml2js from "xml2js"
import { createLog } from "../../repositories/AuditLogs/AuditLogRepository.js";

const papercut_security_secret = process.env.PRINTER_PAPERCUT_SECRET;


/// Type of xmlrpc values. see XMLRPCValueToXMLObject and valueToTS  for converting to and from these values
type XMLRPCValue = string | XMLRPCInteger | number | boolean | XMLRPCStruct | XMLRPCValue[] | undefined;

class XMLRPCInteger {
    underlying: number;
    constructor(value: number) {
        this.underlying = value;
    }
}

interface XMLRPCStruct {
    [rpcStructKeys: string]: XMLRPCValue
}

/**
 * Parse an xml2js parsed xmlrpc struct into a typescript object, removing superflous tags
 * @param obj a subobject of a parsed xmlrpc body
 * @returns an XMLRPCStruct or undefined if failed to parse 
 */
function structToTS(obj: object): XMLRPCStruct | undefined {

    if (!("member" in obj)) {
        // bad struct format
        return undefined;
    }
    const members: { name: string[], value: any[] }[] = obj.member as { name: string[], value: any[] }[];
    var struct: { [key: string]: XMLRPCValue } = {};
    members.forEach((o: { name: string[], value: any[] }) => {
        struct[o.name[0]] = valueToTS(o.value[0]);
    });
    return struct;
}
/**
 * Parse an xml2js parsed xmlrpc arary into a typescript array, removing superflous tags
 * @param obj a subobject of a parsed xmlrpc body
 * @returns a typescript array of values (or undefined if failure to parse)
 */
function arrayToTS(obj: unknown): XMLRPCValue[] | undefined {
    if (!("data" in (obj as any))) {
        return undefined;
    }
    const elements: object[] = (obj as any)["data"][0]["value"];
    return elements.map(valueToTS);
}

/**
 * Translate xml2js object into a simpler and easier to work with typescript value
 * @param obj the object returned by the xml body parser - an object corresponding to raw xml keys
 * @returns a simplified object that removes unnecessary tags and keeps track of types with the typescript type system
 */
function valueToTS(obj: object): XMLRPCValue {
    if ("string" in obj) {
        return (obj['string'] as string[])[0];
    } else if ("int" in obj) {
        return new XMLRPCInteger(Number(obj["int"] as string[][0]));
    } else if ("double" in obj) {
        return Number(obj["double"] as string[][0]);
    } else if ("boolean" in obj) {
        return (obj["boolean"] as string[])[0] === "1";
    } else if ("struct" in obj) {
        return structToTS((obj["struct"] as object[])[0]);
    } else if ("array" in obj) {
        return arrayToTS((obj["array"] as object[])[0]);
    }
    console.error("PAPERCUT: Couldnt parse xmlrpc value: ", obj);
    return undefined
}

async function papercut_getUserAccountBalance(res: any, params: XMLRPCValue[]) {
    // params
    //      Username: string
    //      Account Name: optional string
    // returns:
    //      double 

    if (!(params.length === 1 || params.length === 2)) {
        xmlrpcRespondFault(res, 2, `getUserAccountBalance takes 1 or 2 arguments (username, account (optional)) but ${params.length} were provided`)
        return;
    }
    const username: XMLRPCValue = params[0];

    if (typeof username !== 'string') {
        xmlrpcRespondFault(res, 1, "username argument for getUserAccountBalance expected type string");
        return;
    }

    const balance: number = 4;
    xmlrpcRespond(res, [new XMLRPCInteger(balance)]);
}

function papercut_adjustUserAccountBalanceIfAvailable(res: any, params: XMLRPCValue[]) {
    // params
    // Username:        string
    // Adjustment:      double
    // Comment:         string
    // Account name:    string
    // returns
    // 1 if success, 0 if not
    if (params.length != 3 && params.length != 4) {
        xmlrpcRespondFault(res, 2, `adjustUserAccountBalanceIfAvailable takes 3 or 4 arguments (username, adjustment, comment, account name (optional)) but ${params.length} were provided`)
        return;
    }
    const username = params[0];
    const adjustment = params[1];
    const comment = params[2];
    var accountname = undefined;

    if (typeof username !== "string" || typeof adjustment !== "number" || typeof comment !== "string") {
        xmlrpcRespondFault(res, 2, `incorrect types for adjustUserAccountBalanceIfAvailable takes (string, double, string, string)`);
        return;
    }

    if (params.length === 4) {
        accountname = params[3];
        if (typeof accountname !== "string") {
            xmlrpcRespondFault(res, 2, `incorrect types for adjustUserAccountBalanceIfAvailable takes (string, double, string, string)`);
            return;
        }
    }


    xmlrpcRespond(res, [false]);
    return;
}

/**
 * Translate a JS object into an appropriately formatted object to pass into an xml2js builder
 * NOTE: this does not return the XML but returns an object that will behave correctly when 
 * passed through the builder according to the xmlrpc spec
 * @param val the xmlrpc value to translate
 * @returns an appropriately formatted json object
 */
function XMLRPCValueToXMLObject(val: XMLRPCValue): object {
    if (val instanceof XMLRPCInteger) {
        return { 'int': val.underlying };
    } else if (Array.isArray(val)) {
        // TODO as an array
    } else if ("rpcStructKeys" in (val as object)){
        // TODO as a struct
    }
    switch (typeof val) {
        case "string":
            return { 'string': val };
        case "number":
            return { 'double': val };
        case "boolean":
            return { 'boolean': val ? 1 : 0 };
        default:
            console.error("PAPERCUT: Dont know how to convert xmlrpcvalue to xml ", typeof val);
            return {};

    }
}

/**
 * Format and send a response to an xmlrpc request
 * NOTE: This is not to be used for a faulting return. see {@link xmlrpcRespondFault} for error responses
 * @param response the response to write the data to
 * @param params a list of xmlrpc values to return
 */
function xmlrpcRespond(response: any, params: XMLRPCValue[]) {
    const b = new xml2js.Builder();
    const s = b.buildObject({
        "methodResponse": {
            "params": {
                "param": params.map(XMLRPCValueToXMLObject).map(o => { return { value: o } })
            }
        }
    })
    response.send(s);
}

/**
 * format and send a fault response for the xml rpc server
 * @param response the request-response part to reply to client
 * @param fault the fault code for xmlrpc request
 * @param faultString the human readable fault code for xmlrpc
 */
function xmlrpcRespondFault(response: any, fault: number, faultString: string) {
    const b = new xml2js.Builder();
    const s = b.buildObject({
        "methodResponse": {
            "fault": {
                "value": [{
                    "struct": [{
                        "member": [{
                            "name": "faultCode",
                            "value": [{ "int": fault }]
                        },
                        {
                            "name": "faultString",
                            "value": [{ "string": faultString }]
                        }]
                    }]
                }]
            }
        }
    });
    response.status(200).send(s);
}

/**
 * register handler for xmlrpc 3dPrinterOS papercut server
 * @param app the express application server to bind to
 */
export function registerEndpoints(app: express.Application) {
    if (papercut_security_secret == null) {
        console.error("PAPERCUT: COULD NOT FIND SECRET, PAPERCUT 3DPRINTER OS WONT WORK");
        createLog("COULD NOT FIND SECRET, PAPERCUT 3DPRINTER OS WONT WORK", "server");
        return;
    }
    var handlers: Map<string, Function> = new Map();
    handlers.set("getUserAccountBalance", papercut_getUserAccountBalance);
    handlers.set("adjustUserAccountBalanceIfAvailable", papercut_adjustUserAccountBalanceIfAvailable);

    app.post("/papercut/api/xmlrpc", xmlparser(), (req, res) => {
        console.log("XML RPC request from", req.ip);
        console.log(new xml2js.Builder().buildObject(req.body));
        try{
        const methodU: object | undefined = req.body?.methodcall?.methodname;
        const paramsU: object | undefined = req.body?.methodcall?.params[0].param;

        if (!methodU || !paramsU) {
            // bad call
            res.status(401).send()
            return;
        }
        if ((!Array.isArray(methodU)) || !Array.isArray(paramsU)) {
            // bad call
            res.status(401).send()
            return;
        }
        const method: string = methodU[0] as string;
        const params: XMLRPCValue[] = paramsU.map((o: any) => valueToTS(o.value[0]));

        if (params.length == 0) {
            return res.status(401).send();
        } else {
            const securityCode = params[0];
            if (typeof securityCode !== "string" || securityCode !== papercut_security_secret) {
                return res.status(401).send();
            }
        }

        const handler = handlers.get(method);
        if (handler) {
            handler(res, params.slice(1, params.length));
        } else {
            xmlrpcRespondFault(res, 1, `method "${method}" is not supported`);
        }
    } catch (e){
        console.error("PAPERCUT: Failed to handle Papercut XMLRPC request", e);
        res.status(500).send();
    }
    });
}