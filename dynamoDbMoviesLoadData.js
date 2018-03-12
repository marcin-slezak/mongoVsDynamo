var AWS = require('aws-sdk');
var fs = require("fs")
var parallelLimit = require("async/parallelLimit") 

AWS.config.update({
    region: "eu-central-1",
    endpoint: "http://localhost:8000" // use when local DynamoDB
  });

var docClient = new AWS.DynamoDB.DocumentClient();

console.log("Importing movies into DynamoDB. Please wait.");
  
var allMovies = JSON.parse(fs.readFileSync('./exampleData/moviedata.json', 'utf8'));

var addMoviesFuncs = allMovies.map(movie => (cb) =>{
    var params = {
        TableName: "Movies",
        Item: {
            "year":  movie.year,
            "title": movie.title,
            "info":  movie.info
        }
    };

    docClient.put(params, function(err, data) {
        if (err) {
            let msg = "Unable to add movie:" + movie.title + ". Error JSON:" + JSON.stringify(err, null, 2)
            console.log(msg)
            return cb(msg)
        } else {
            let msg = "PutItem succeeded:"+ movie.title
            console.log(msg)
            cb(null, msg)
        }
    });
})

// limit concurrent calls to avoid "throughput for the table was exceeded" - base on read/write capacity units
parallelLimit(addMoviesFuncs, 50, err => {
    if(err){
        return console.log(err)
    }
    console.log("done")
})
