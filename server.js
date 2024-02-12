const express = require('express');
const app = express();
const path = require('path');

app.use(express.json());
app.set('port', 3000);
app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader("Access-Control-Allow-Credentials", "true");
    res.setHeader("Access-Control-Allow-Methods", "GET,HEAD,OPTIONS,POST,PUT");
    res.setHeader("Access-Control-Allow-Headers", "Access-Control-Allow-Headers, Origin,Accept, X-Requested-With, Content-Type, Access-Control-Request-Method, Access-Control-Request-Headers");
    next();
});

// Logger middleware
app.use((req, res, next) => {
    console.log(`[${new Date().toLocaleString()}] ${req.method} ${req.url}`);
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
        if (e) return next(e);
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
    req.collection.findOne({ _id: new ObjectID(req.params.id) },
        (e, result) => {
            if (e) next(e)
            res.send(result)
        })
});

app.put('/collection/:collectionName/updateInventory/:id', (req, res, next) => {
    req.collection.update(
        { _id: new ObjectID(req.params.id) },
        { $set: req.body },
        { safe: true, multi: false },
        (e, result) => {
            if (e) return next(e)
            res.send((result.result.n === 1) ? { msg: 'success' } : { msg: 'error' })
        })
})
app.delete('/collection/:collectionName/:id', (req, res, next) => {
    req.collection.deleteOne(
        { _id: new ObjectID(req.params.id) }, (e, result) => {
            if (e) return next(e)
            res.send((result.result.n === 1) ? { msg: "success" } : { msg: "error" });
        }
    );
});

app.post('/collection/:collectionName', (req, res, next) => {
    // Assuming you have access to the order data in the request body
    const orderData = req.body;

    // Save the order data to your database
    db.collection('orders').insertOne(orderData, (err, result) => {
        if (err) {
            console.error('Error saving order:', err);
            return res.status(500).json({ error: 'Failed to save order' });
        }

        console.log('Order saved successfully:', result.ops);
        res.status(201).json(result.ops); // Respond with the saved order data
    });
});

app.get('/collection/:collectionName/search/:searchQ', (req, res, next) => {
    const query = req.params.searchQ; // Retrieve the search query parameter

    let filter = {}; // Define an empty filter object

    if (query) {
        // If a search query is provided, construct a filter to search by title or description
        filter = {
            $or: [
                { title: { $regex: query, $options: 'i' } }, // Case-insensitive search by title // Case-insensitive search by description
            ]
        };
    }

    // Use the filter to find matching classes
    db.collection('products').find(filter).toArray((err, results) => {
        if (err) {
            console.error('Error performing search:', err);
            return res.status(500).json({ error: 'Failed to perform search' });
        }
        res.send(results); // Send the search results back to the client
    });
});

// Define the directory where your static images are located
const STATIC_IMAGE_DIR = path.join(__dirname,'static','images');

// Set up middleware to serve static files (images in this case)
app.use('/images', express.static(STATIC_IMAGE_DIR));

// Define a route to handle image requests
app.get('/images/:imageFilename', (req, res) => {
    const imageFilename = req.params.imageFilename;
    res.sendFile(path.join(STATIC_IMAGE_DIR, imageFilename));
});

// Error handler middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something went wrong!');
});

const port = process.env.PORT || 3000
app.listen(port)