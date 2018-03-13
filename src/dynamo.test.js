var AWS = require('aws-sdk');
var parallelLimit = require("async/parallelLimit") 
var _ = require('lodash/array');
var fs = require("fs")


AWS.config.update({
    region: "eu-central-1",
    endpoint: "http://localhost:8000" // use when local DynamoDB
});

var dynamodb = new AWS.DynamoDB();
var docClient = new AWS.DynamoDB.DocumentClient();
var tableName = "Movies"

const getExampleMovieDataSync = () => {
    return JSON.parse(fs.readFileSync('./exampleData/moviedata.json', 'utf8'));
}

it('first we need to manage table! So.. create table if doesn\'t exist :/' , done => {
    
    dynamodb.describeTable({TableName: tableName }, function(err, data) {
        if(err && err.code !== 'ResourceNotFoundException'){
            expect(err).toBe(null)
            expect(data.TableName).toBe(tableName)
            done()
        }
        if(err && err.code === 'ResourceNotFoundException'){
            // have to create because table doesn't exist
            var params = {
                TableName : tableName,
                KeySchema: [       
                    { AttributeName: "year", KeyType: "HASH"},  //Partition key
                    { AttributeName: "title", KeyType: "RANGE" }  //Sort key
                ],
                AttributeDefinitions: [       
                    { AttributeName: "year", AttributeType: "N" },
                    { AttributeName: "title", AttributeType: "S" }
                ],
                ProvisionedThroughput: {       
                    ReadCapacityUnits: 10, 
                    WriteCapacityUnits: 10
                }
            };
            dynamodb.createTable(params, function(err, data) {
                expect(err).toBe(null)
                console.log(data);
                done()
            });  
        }else{
            // table exist, assume that our schema - just go ahead
            done()
        }
    });    
})

it('insertOne', done => {
    var params = {
        TableName: tableName,
        Item: {
            "year":  1086,
            "title": 'Live 1',
            "info":  {a:1, b:2, c: {d:4}}
        }
    };
    docClient.put(params, function(err, data) { // insert or update!
        expect(err).toBe(null)
        done()
    });
})

it('insertOne without keys will fail', done => {
    var params = {
        TableName: tableName,
        Item: {
            "year":  1986,
            "info":  {a:11, b:22}
        }
    };
    docClient.put(params, function(err, data) { // insert or update!
        expect(err.code).toBe('ValidationException')
        done()
    });
})
it('getOne', done => {
    var params = {
        TableName: tableName,
        Key: {
            "year":  1086,
            "title": 'Live 1',
        }
    };
    docClient.get(params, function(err, data) {
        expect(err).toBe(null)
        expect(data.Item.info.c.d).toBe(4)
        done()
    });
})

it('updateOne', done => {
    var params = {
        TableName: tableName,
        Item: {
            "year":  1086,
            "title": 'Live 1',
            "info":  {a:1, b:2, c: {d:7}}
        }
    };
    docClient.put(params, function(err, data) { // insert or update!
        expect(err).toBe(null)
        var params = {
            TableName: tableName,
            Key: {
                "year":  1086,
                "title": 'Live 1',
            }
        };
        docClient.get(params, function(err, data) {
            expect(err).toBe(null)
            expect(data.Item.info.c.d).toBe(7)
            done()
        });
        
    });
})


it('insertMany will fail if you will try to add more then 100 Items at once', done => {
    let movies = getExampleMovieDataSync()
    let params = { 
        RequestItems : {
            [tableName]: movies.map(movie => { 
                                        return {
                                            PutRequest : {Item: {
                                                "year":  movie.year,
                                                "title": movie.title,
                                                "info":  movie.info
                                            }}
                                    }
            })
        }
    }
    
    docClient.batchWrite(params, function(err, data) {
        expect(err.code).toBe('ValidationException')
        expect(err.message).toBe('Too many items requested for the BatchWriteItem call')
        done()
    });
})

it('insertMany limiting items', done => {
    
    jest.setTimeout(50000) //50sec - batch insert is really long

    let movies = getExampleMovieDataSync()
    moviesChunks = _.chunk(movies, 24)
    let addChunkFunctions = moviesChunks.map(chunk => (cb) => {
        let params = { 
            RequestItems : {
                [tableName]: chunk.map(movie => { 
                                            return {
                                                PutRequest : {Item: {
                                                    "year":  movie.year,
                                                    "title": movie.title,
                                                    "info":  movie.info
                                                }}
                                        }
                })
            }
        }
        docClient.batchWrite(params, function(err, data) {
            expect(err).toBe(null)
            if(err){
                cb(err)
            }
            cb(null, data)
        });

    })
    
    // limit concurrent calls to avoid "throughput for the table was exceeded" - base on read/write capacity units - it happen to me on AWS
    parallelLimit(addChunkFunctions, 10, err => {
        expect(err).toBe(null)
        done()
    })
})

it('getMany? (this method give you items base on full key)', done => {
    let params = { 
        RequestItems : {
            [tableName]: {
                Keys: [
                    {
                        "year":  1086,
                        "title": 'Live 1'
                    },
                    {
                        "year":  1086,
                        "title": 'Live 2'
                    }
                ]
            }
        }
    }
    docClient.batchGet(params, function(err, data) {
        expect(err).toBe(null)
        expect(data.Responses.Movies.length).toBe(2)
        done()
    });
})

it('getMany', done => {
    let params = {
        TableName: tableName,
        ScanFilter: {
            title: {
                ComparisonOperator: "BEGINS_WITH",
                AttributeValueList: ["Live"]
            }
        }
    }
    docClient.scan(params, function(err, data) {
        expect(err).toBe(null)
        expect(data.Items.length).toBe(4)
        done()
    });
})
