var http = require('http');
var url = require('url');
var strdec = require('string_decoder').StringDecoder;
var mongo = require('mongodb');
var mongoclient = mongo.MongoClient;
var ObjectId = require('mongodb').ObjectId;
var UserModel = require('./user.js');
let URI = "mongodb://ayush:ayush2301@localhost:27017/wmanage";

function normal_add(req, res) {
    let decoder = new strdec('utf-8');
    let buffer = "";
    req.on("data", function (chunk) {
        buffer += decoder.write(chunk);
    })
    req.on("end", function (chunk) {
        buffer += decoder.end()
        mongoclient.connect(URI, function (err, database) {
            if (err) throw err;
            let userobj = JSON.parse(buffer);
            let insertinstance = new UserModel ({name: userobj.name, email: userobj.email, isPaymentmade: false, totalEarnings: 0});
            let dbobj = database.db("task");
            dbobj.collection("Users").insertOne(insertinstance, function (err, resp) {
                if (err) throw err;
                console.log("Inserted User Successfully");
                res.writeHead(200, "OK", { "Access-Control-Allow-Origin": "*" });
                console.log("Inserted a normal user successfully");
                res.write(insertinstance._id.toString()); // returns the object Id of the normal user, to be used in the referral
                res.end();
            });
        })

    })
}

function referral_add(req, res) {
    let decoder = new strdec('utf-8');
    let buffer = "";
    req.on("data", function (chunk) {
        buffer += decoder.write(chunk);
    })
    req.on("end", function (chunk) {
        buffer += decoder.end()
        mongoclient.connect(URI, function (err, database) {
            if (err) throw err;
            let userobj = JSON.parse(buffer);
            let dbobj = database.db("task");
            let queryid = new ObjectId(userobj.refid);
            dbobj.collection("Users").findOne({_id:queryid},function (err,resp){
                let insertinstance = new UserModel({name: userobj.name, email: userobj.email, refferedUser: {_id: queryid, name: resp.name, email: resp.email}, isPaymentmade: false, totalEarnings: 0});
                // here I used the object Id of the user who reffered the new user as the refferedUser._id to establish a relation between the two documents.
                dbobj.collection("Users").insertOne(insertinstance, function (err,resp){
                    if (err) throw err;
                    console.log("Inserted User Successfully");
                    res.writeHead(200, "OK", { "Access-Control-Allow-Origin": "*" });
                    console.log("Inserted a referral user successfully");
                    res.write(insertinstance._id.toString()); // returns the object Id of the referral user, to be used in further referrals
                    res.end();
                })
            })
        })

    })
}

function payment_made(req,res){
    let decoder = new strdec('utf-8');
    let buffer = "";
    req.on("data",function(chunk){
        buffer += decoder.write(chunk);
    })
    req.on("end", function(){
        buffer += decoder.end();
        mongoclient.connect(URI, function(err,database){
            if(err) throw err;
            let dbobj = database.db("task");
            let queryid = new ObjectId(buffer);
            dbobj.collection("Users").findOne({_id: queryid}, function(err,resp){
                if(resp.isPaymentmade == true){ // Checks if the first payment already made
                    res.writeHead(200, "OK", { "Access-Control-Allow-Origin": "*" });
                    res.write("First Payment already made");
                    res.end();
                }
                else{
                    let p = new Promise(function(resolve){
                        if(resp.refferedUser.name != null){ // if referredUser exists
                            let refid = resp.refferedUser._id;
                            dbobj.collection("Users").updateOne({_id: refid}, {$inc: {totalEarnings: 10}}, function(err,resp){
                                if(err) throw err;
                                resolve();
                            })
                        }
                        else{
                            resolve();
                        }
                    })
                    p.then(function(value){
                        dbobj.collection("Users").updateOne({_id: queryid},{$set: {isPaymentmade: true}},function(err, resp){
                            res.writeHead(200, "OK", { "Access-Control-Allow-Origin": "*" });
                            res.write("First payment made");
                            res.end();
                        });
                    })
                    
                }
            })
        })
    })
}

http.createServer(function (req, res) {
    if (req.method == "OPTIONS") {
        res.writeHead(200, "OK", { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "*", "Access-Control-Allow-Methods": "*" });
        res.end();
    }
    else {
        pathobj = url.parse(req.url, true);
        switch (pathobj.pathname) {
            case "/add": // addition of normal users (without any referral)
                normal_add(req, res);
                break;
            case "/refadd": // addition of referral users (atleast one normal user required for this, as he/she will share the referral code)
                referral_add(req, res);
                break;
            case "/pay": // payment made by any user
                payment_made(req,res);
                break;
        }
    }
}).listen(8081,"localhost");

// test
// ayush 61fbbe9c02da45b3fe70a2d8
// rohil ref ayush 61fbbf112e3d091df98bb3e1
// aman ref ayush 61fbbf692e3d091df98bb3e4
// akku ref ayush 61fbbf892e3d091df98bb3e7
// amisha ref rohil 61fbbfbc2e3d091df98bb3ea