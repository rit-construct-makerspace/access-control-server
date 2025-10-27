import express from "express";
import xmlparser from "express-xml-bodyparser";
import * as xml2js from "xml2js"
import { createLog } from "../../repositories/AuditLogs/AuditLogRepository.js";
import * as Currency from "../currency/currency.js"
import { NewTransaction, UpdateTransaction } from "../currency/transactions.js";
import { getAccountIDByUsername } from "../../repositories/Currency/CurrencyAccountsRepository.js";
import { CurrencySource, MakeMoneyError } from "../currency/types.js";
import { getTransactionByPrinterJobId } from "../../repositories/Currency/TransactionRepository.js";

const PAPERCUT_SECURITY_SECRET = process.env.PAPERCUT_SECURITY_SECRET;
const FREE_3D_PRINTS = process.env.FREE_3D_PRINTS === "true";


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
  const struct: { [key: string]: XMLRPCValue } = {};
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

  if (FREE_3D_PRINTS) {
    xmlrpcRespond(res, [9999.49]);
    return;
  }
  // 0$ if you don't exist
  if ((await getAccountIDByUsername(username)) === undefined){
    xmlrpcRespond(res, [0]);
    return;
  }
  
  try {
    const result = await Currency.getAccountBalance(username);
    if (typeof result === "number") { // number result
      const balanceDollars = result / 100.0;
      xmlrpcRespond(res, [balanceDollars]);
    } else { // string error
      xmlrpcRespondFault(res, 404, `could not query balance for user '${username}': ${result}`)
    }
  } catch (e) {
    xmlrpcRespondFault(res, 404, `could not query balance for user '${username}' exception: ${e}`)
  }
}


const print_comment_matcher: RegExp = /(?:3DPrinterOS:)? ?(.*?) ?\(jobID #(\d*)\)/;
enum PrinterTransactionType {
  New,
  Failed,
  Cancelled,
  ManualRefund,
  PriceUpdate,
  QuoteUpdated,
  Other,
}
function typeToString(t: PrinterTransactionType): string {
  switch (t) {
    case PrinterTransactionType.New:
      return "New Job"
    case PrinterTransactionType.Failed:
      return "Job Failed"
    case PrinterTransactionType.Cancelled:
      return "Job Cancelled";
    case PrinterTransactionType.ManualRefund:
      return "Manual Refund";
    case PrinterTransactionType.PriceUpdate:
      return "Price Updated";
    case PrinterTransactionType.QuoteUpdated:
      return "Quote Updated";
    case PrinterTransactionType.Other:
      return "Other";
    default:
      return "Unknown Type";
  }
}

type PrinterTransaction = {
  type: PrinterTransactionType
  jobID: number,
  customMessage?: string
};
/**
 * Parse the 3dprinteros provided comment string to figure out what the adjustment was for
 * @param comment the comment given to us by 3dprinter os
 * @returns a description or undefined if we don't know how to parse it (havent seen it before)
 */
function printCommentParser(comment: string): PrinterTransaction | undefined {
  const res = print_comment_matcher.exec(comment)
  if (res == null || res.length != 3) {
    // failed to match
    return undefined;
  }
  const jobID = Number(res[2])
  switch (res[1]) {
    case "New job":
      return { type: PrinterTransactionType.New, jobID };
    case "Job Failed (Refund)":
      return { type: PrinterTransactionType.Failed, jobID };
    case "Job Aborted (Refund)":
      return { type: PrinterTransactionType.Cancelled, jobID };
    case "Manual Refund":
      return { type: PrinterTransactionType.ManualRefund, jobID };
    case "Price updated":
      return { type: PrinterTransactionType.PriceUpdate, jobID };
    case "Quote Updated Price":
      return { type: PrinterTransactionType.QuoteUpdated, jobID };
    default:
      return { type: PrinterTransactionType.Other, jobID, customMessage: res[1] };
  }
}

async function process3dPrintTransaction(username: string, amount: number, transaction: PrinterTransaction): Promise<boolean | MakeMoneyError> {
  const account = await getAccountIDByUsername(username);
  if (account === undefined) {
    console.error("no account here");
    return MakeMoneyError.NoAccount;
  }
  const existing = await getTransactionByPrinterJobId(transaction.jobID);
  if (transaction.type === PrinterTransactionType.New) {
    if (existing != null) {
      return MakeMoneyError.DuplicateTransaction;
    }

    const res = await NewTransaction(
      account,
      amount,
      CurrencySource.Printers,
      { text: `New 3D Printer Job: ${transaction.jobID}`, data: {} },
      { printerJobId: transaction.jobID }
    )
    return res;
  }

  // Update
  if (existing === undefined) {
    console.error(`3DPrinterOS: Ignoring money charge for job id: ${transaction.jobID} from ${username} for amount ${amount}. Couldn't find transaction for it: ${typeToString(transaction.type)}:${transaction.customMessage}`);
    return false;
  }

  const res = await UpdateTransaction(existing.id, amount, `${typeToString(transaction.type) + (transaction?.customMessage ? (" - " + transaction?.customMessage) : "")}`)
  return res;
}

async function papercut_adjustUserAccountBalanceIfAvailable(res: any, params: XMLRPCValue[]) {
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
  let accountname = undefined;

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

  if (FREE_3D_PRINTS) {
    xmlrpcRespond(res, [true]);
    return;
  }
  // Blindly accecpt changes of $0 (won't even be recorded)
  if (adjustment == 0){
    xmlrpcRespond(res, [true]);
    return;
  }

  try {
    const transaction = printCommentParser(comment)
    if (transaction === undefined) {
      xmlrpcRespondFault(res, 404, `could not process print comment: ${comment}`);
      return;
    }
    const amountCents = Math.round(adjustment * 100);
    const result = await process3dPrintTransaction(username, amountCents, transaction);
    if (typeof result === "string") {
      xmlrpcRespondFault(res, 500, result);
      return;
    } else {
      xmlrpcRespond(res, [result]);
      return;
    }
  } catch (e) {
    console.error(e)
    xmlrpcRespondFault(res, 404, `could not adjust balance for user '${username}': ${e}`)
    return;
  }
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
  } else if (typeof val === 'object' && !Array.isArray(val) && "rpcStructKeys" in (val as object)) {
    // TODO as a struct
  }
  switch (typeof val) {
    case "string":
      return { 'string': val };
    case "number":
      return { 'double': val.toFixed(2) };
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
  if (PAPERCUT_SECURITY_SECRET === undefined) {
    console.error("PAPERCUT: COULD NOT FIND SECRET, PAPERCUT 3DPRINTER OS WONT WORK");
    createLog("COULD NOT FIND SECRET, PAPERCUT 3DPRINTER OS WONT WORK", "server");
    return;
  }
  if (FREE_3D_PRINTS) {
    console.error("PAPERCUT: Free 3D Printing is turned on");
    createLog("Free 3D Printing is enabled", "server");
  }
  const handlers: Map<string, Function> = new Map();
  handlers.set("api.getUserAccountBalance", papercut_getUserAccountBalance);
  handlers.set("api.adjustUserAccountBalanceIfAvailable", papercut_adjustUserAccountBalanceIfAvailable);

  app.post("/papercut/api/xmlrpc", xmlparser(), (req, res) => {
    try {
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
        if (typeof securityCode !== "string" || securityCode !== PAPERCUT_SECURITY_SECRET) {
          return res.status(401).send();
        }
      }

      const handler = handlers.get(method);
      if (handler) {
        handler(res, params.slice(1, params.length));
      } else {
        xmlrpcRespondFault(res, 1, `method "${method}" is not supported`);
      }
    } catch (e) {
      console.error("PAPERCUT: Failed to handle Papercut XMLRPC request", e, "\n", (new xml2js.Builder().buildObject(req.body)));
      res.status(500).send();
    }
  });
}