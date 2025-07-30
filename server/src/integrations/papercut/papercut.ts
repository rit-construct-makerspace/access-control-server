import express from "express";
import xmlparser from "express-xml-bodyparser";
import * as xml2js from "xml2js"


class XMLRPCInteger {
    underlying: number;
    constructor(value: number) {
        this.underlying = value;
    }
}

type XMLRPCValue = string | XMLRPCInteger | number | boolean | XMLRPCStruct | XMLRPCValue[] | undefined;
interface XMLRPCStruct {
    [key: string]: XMLRPCValue
}

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
function arrayToTS(obj: unknown): XMLRPCValue[] | undefined {
    if (!("data" in obj)) {
        return undefined;
    }
    const elements: object[] = (obj as any)["data"][0]["value"];
    console.log("array", elements)
    return elements.map(valueToTS);
}

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
    console.error("Couldnt parse xmlrpc value: ", obj);
    return undefined
}

const papercut_security_secret = 'freeprints';


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

    console.log("getUserAccountBalance", params);
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
    console.log(params)

    if (typeof username !== "string" || typeof adjustment !== "number" || typeof comment !== "string") {
        console.log("asdf");
        xmlrpcRespondFault(res, 2, `incorrect types for adjustUserAccountBalanceIfAvailable takes (string, double, string, string)`);
        return;
    }

    if (params.length === 4) {
        accountname = params[3];
        if (typeof accountname !== "string") {
            console.log("gdfcs")
            xmlrpcRespondFault(res, 2, `incorrect types for adjustUserAccountBalanceIfAvailable takes (string, double, string, string)`);
            return;
        }
    }


    xmlrpcRespond(res, [false]);
    return;
}


function XMLRPCValueToXMLObject(val: XMLRPCValue): object {
    if (val instanceof XMLRPCInteger) {
        return { 'int': val.underlying };
    }
    switch (typeof val) {
        case "string":
            return { 'string': val };
        case "number":
            return { 'double': val };
        case "boolean":
            return { 'boolean': val ? 1 : 0 };

        default:
            console.error("dunno what to do with ", typeof val);
            return {};

    }
}

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
    console.log(s)
    response.status(200).send(s);
}

export function registerEndpoints(app: express.Application) {
    var handlers: Map<string, Function> = new Map();
    handlers.set("getUserAccountBalance", papercut_getUserAccountBalance);
    handlers.set("adjustUserAccountBalanceIfAvailable", papercut_adjustUserAccountBalanceIfAvailable);

    app.post("/papercut/api/xmlrpc", xmlparser(), (req, res) => {
        console.log("XML RPC request from", req.ip);
        console.log(new xml2js.Builder().buildObject(req.body));
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
        if (handler){
            handler(res, params.slice(1, params.length));
        } else {
            xmlrpcRespondFault(res, 1, `method "${method}" is not supported`);
        }
    });
}