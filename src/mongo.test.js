const MongoClient = require('mongodb').MongoClient;
var fs = require('fs')

var mongoUrl = 'mongodb://localhost:27017/mongovsdynamo';
var mongoDb;
var mongoCollection;

const getExampleMovieDataSync = () => {
    return JSON.parse(fs.readFileSync('./exampleData/moviedata.json', 'utf8'));
}

beforeAll(() => {
    return new Promise((resolve, reject) => {
        MongoClient.connect(mongoUrl, function(err, db) {
            if(err){
                return reject(err)
            }
            resolve(db)          
          });
    }).then(db => {
        mongoDb = db
        mongoCollection = db.collection('documents')
        return mongoCollection
    })
});

afterAll(() => {
    mongoDb.close()
})

it('clear collection', done => {
    mongoCollection.removeMany({}, {}, () =>{
        done()
    })
})

it('add first document to mongo collection (insertOne)', done => {
    mongoCollection.insertOne({name: "Jan", surname: "Kowalski"}, (err, result) => {
        expect(err).toBe(null)
        expect(result.insertedCount).toBe(1)
        done()
    })
})

it('find example document in collection added by insertOne (findOne)', done => {
    mongoCollection.findOne({name: "Jan"}, {}, (err, user) => {
        expect(err).toBe(null)
        expect(user.name).toEqual("Jan")
        expect(user.surname).toEqual("Kowalski")
        done()
    })
})

it('edit one document (updateOne)', done => {
    mongoCollection.updateOne({name: "Jan"}, {name: "Jan", surname: "Kowalski", age: 44}, {}, (err, user) => {
        expect(err).toBe(null)
        done()
    } )
})

it('find edited document in collection (findOne) ', done => {
    mongoCollection.findOne({name: "Jan"}, {}, (err, user) => {
        expect(err).toBe(null)
        expect(user.name).toEqual("Jan")
        expect(user.surname).toEqual("Kowalski")
        expect(user.age).toEqual(44)
        done()
    })
})

it('documents bulk add to mongo collection (insertMany)', done => {
    let allMovies = getExampleMovieDataSync()
    mongoCollection.insertMany(allMovies, (err, result) => {
        expect(err).toBe(null)
        expect(result.result.n).toBe(4611)
        done()
    })
})

it('find example documents in collection added by insertMany (read)', done => {
    mongoCollection.find({year: 1086}).toArray(function(err, docs){
        expect(err).toBe(null)
        expect(docs.length).toEqual(2)
        expect(docs[0].title).toEqual("Live 1")
        done()
    })
})
 
