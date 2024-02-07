const express = require('express');
const app = express();

app.use(express.json());
app.set('port', 3000);
app.use((req,res,next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader("Access-Control-Allow-Credentials", "true");
    res.setHeader("Access-Control-Allow-Methods", "GET,HEAD,OPTIONS,POST,PUT");
    res.setHeader("Access-Control-Allow-Headers", "Access-Control-Allow-Headers, Origin,Accept, X-Requested-With, Content-Type, Access-Control-Request-Method, Access-Control-Request-Headers");
    next();
});
const MongoClient = require("mongodb").MongoClient;

let db;


MongoClient.connect('mongodb+srv://sakina:Feb232004@cluster0.fvp5jbf.mongodb.net/', (err, client) => {
    db = client.db('MobileApp');
    });

app.get('/', (req, res, next) => {
    res.send('Select a collection /collection/messages');
});

app.param('collectionName', (req, res, next, collectionName) => {
    req.collection = db.collection(collectionName);

    return next();
});

app.get('/collection/:collectionName', (req, res, next) => {
    req.collection.find({}).toArray((e, results) => {
        if (e) return next (e);
        res.send(results);
    })
});

app.post('/:collectionName', (req, res, next) => {
    console.log(req.body);
    req.collection.insertOne(req.body, (e, results) => {
        if (e) return next(e)
        // this .ops is written so that when data is stored into mongoDB it will be given the unique ID for each product
        res.send(results.ops)
    });
});

const ObjectID = require("mongodb").ObjectID;

app.get('/collection/:collectionName/:id', (req, res, next) => {
    req.collection.findOne({_id: new ObjectID(req.params.id)},
    (e, result) => {
        if (e) next(e)
        res.send(result)
    })
});

app.put('/collection/:collectionName/:id', (req, res, next) => {
    req.collection.update(
        {_id: new ObjectID(req.params.id)},
        {$set: req.body},
        {safe: true, multi: false},
        (e, result) => {
            if (e) return next(e)
            res.send((result.result.n === 1) ? {msg : "success"} : {msg : "error"})
        }
    );
});

app.delete('/collection/:collectionName/:id', (req, res, next) => {
    req.collection.deleteOne(
        {_id: new ObjectID(req.params.id)}, (e, result) => {
            if (e) return next(e)
            res.send((result.result.n === 1) ? {msg : "success"} : {msg : "error"});
        }
    );
});

// http.createServer((req, res) => {
//     res.setHeader("Access-Control-Allow-Origin", "*");
//     res.writeHead(200, {"Content-Type" : "text/plain"});
//     res.end(JSON.stringify(products));
// });

const port = process.env.PORT || 3000
app.listen(port)