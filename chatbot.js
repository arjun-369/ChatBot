const express=require("express");
const app=express();
const {WebhookClient}= require("dialogflow-fulfillment");
const {Payload}=require("dialogflow-fulfillment");

const MongoClient= require('mongodb').MongoClient;
var url="mongodb://localhost:27017/";
var randomstring =require("randomstring");
var user_name="";
var ph_num="";

app.post("/start_convo",express.json(),(req,res)=>{
    const agent=new WebhookClient({
        request:req, response:res
    });
    
    
    async function indentify_user(agent)
    {
        ph_num= agent.parameters['phone-number'];
        const client=new MongoClient(url);
        await client.connect();
        const snap=await client.db('BotServices').collection('users').findOne({phone: ph_num});  //check the db for name of 'phone' col

        if(snap==null){
            await agent.add("Re-Enter your mobile number");
        }
        else{
            user_name=snap.username; //check the db for name of the 'name' col 
            await agent.add("Welcome "+user_name+"!! \n How can i help you? ");
        }
    }

    function order(agent)
    {
        var menu={1:"Classic Pizza",2:"Classic Burger",3:"Classic Mexican Combo",4:"Classic American Combo"};

        const intent_val=agent.parameters.order_number;

        var val=menu[intent_val];

        var order_code=randomstring.generate(5);
        MongoClient.connect(url, function(err,db){
            if(err) throw err;
            var dbo=db.db("BotServices");

            var username=user_name;
                var order_val=val;
                var status="Preparing";

            let ts=Date.now();
                let date_ob=new Date(ts);
                let date=date_ob.getDate();
                let month=date_ob.getMonth()+1;
                let year=date_ob.getFullYear();

                var time_date=year+"-"+month+"-"+date;
            var myobj={username: username,phone:ph_num , order:val, status:status, time:time_date, order_code:order_code};
            
                dbo.collection("orders_placed").insertOne(myobj, function(err,res){
                    if(err) throw err;
                    db.close();
                });
        });

        agent.add("The order placed is: "+ val +"\nThe order code is:"+order_code);
    }

    function custom_payload(agent)
    {
        var payLoadData=
        {
            "richContent":[
                [
                    {
                        "type":"list",
                        "title": "Classic Pizza",
                        "subtitle": "Press '1' for Classic Pizza",
                        "event":{
                            "name":"",
                            "languageCode":"",
                            "parameters":{}
                        }
                    },
                    {
                        "type": "divider"
                    },
                    {
                        "type":"list",
                        "title": "Classic Burger",
                        "subtitle": "Press '2' for Classic Burger",
                        "event":{
                            "name":"",
                            "languageCode":"",
                            "parameters":{}
                        }
                    },
                    {
                        "type": "divider"
                    },
                    {
                        "type":"list",
                        "title": "Classic Mexican Combo",
                        "subtitle": "Press '3' for Classic Mexican Combo",
                        "event":{
                            "name":"",
                            "languageCode":"",
                            "parameters":{}
                        }
                    },
                    {
                        "type": "divider"
                    },
                    {
                        "type":"list",
                        "title": "Classic American Combo",
                        "subtitle": "Press '4' for Classic American Combo",
                        "event":{
                            "name":"",
                            "languageCode":"",
                            "parameters":{}
                        }
                    }
                ]
            ]
        }
        agent.add(new Payload(agent.UNSPECIFIED,payLoadData,{sendAsMessage:true, rawPayload:true }));
    }
    /*async function check_status(agent){
        const client= new MongoClient(url);
        await client.connect();
        const order =await client.db("BotServices").collection("orders_placed").findOne({phone: ph_num});

        if(order==null){
            await agent.add("You do not have any orders. Please place an order");
        }
        else{
            var order_name=order.order;
            var order_status=order.status;
            await agent.add("Your order is "+order_name+"\nStatus:"+order_status);
        }

    }*/
    

    var intentMap =new Map();
    intentMap.set("Service",indentify_user);
    intentMap.set("ServicePlace",order);
    intentMap.set("ServiceOrder",custom_payload);
    //intentMap.set("ServiceOrderCheck",check_status);

    agent.handleRequest(intentMap);


});

app.listen(3000);