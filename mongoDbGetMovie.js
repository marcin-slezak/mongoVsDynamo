const MongoClient = require('mongodb').MongoClient;
var url = 'mongodb://localhost:27017/mongovsdynamo';
var fs = require('fs')

var allMovies = JSON.parse(fs.readFileSync('./exampleData/moviedata.json', 'utf8'));
  
MongoClient.connect(url, function(err, db) {
    if(err){
        return console.log(err)
    }
    console.log("Connected successfully to server");
    var collection = db.collection('documents');
    collection.find({year: 2013, title : "Prisoners"}).toArray(function(err, docs){
      if(err){
        return console.log(err)
      }
      console.log(docs)
      db.close();
    })

    
  });