var AWS = require('aws-sdk');
var fs = require("fs")

AWS.config.update({
    region: "eu-central-1",
    endpoint: "http://localhost:8000" // use when local DynamoDB
  });

var docClient = new AWS.DynamoDB.DocumentClient();

var table = "Movies";

var year = 2013;
var title = "Prisoners";

var params = {
    TableName: table,
    Key:{
        "year": year,
        "title": title
    }
};
docClient.get(params, function(err, data) {
    if (err) {
        console.error("Unable to read item. Error JSON:", JSON.stringify(err, null, 2));
    } else {
        console.log("GetItem succeeded:", JSON.stringify(data, null, 2));
    }
});