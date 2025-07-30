import bodyParser from "body-parser";
import express from "express";
import xmlrpc from "xmlrpc";


export function registerEndpoints(app: express.Application){
    const server = xmlrpc.createServer({host: 'localhost', port: 9090});
    server.on("NotFound", (method, params)=>{
        console.error(`Attempt to call '${method}' which does not exist`);
    });

    server.on("getUserAccountBalance", (err, params, callback)=>{
        console.log(`PAPER: getUserAccountBalance called with params`, params);
        // params
        // Username: string
        // Account Name: optional string
        // returns:
        // double
        console.log('Method call params for \'getUserAccountBalance\': ' + params)
        callback(null, 0)
    })

    server.on("adjustUserAccountBalanceIfAvailable", (err, params, callback)=>{
        console.log(`PAPER: adjustUserAccountBalanceIfAvailable called with params`, params);
        // params
        // Username:        string
        // Adjustment:      double
        // Comment:         string
        // Account name:    string
        // returns
        // 1 if success, 0 if not
        callback(null, 0);
    })

    console.log('XML-RPC server listening on port 9091')

}