
const MongoClient = require('mongodb').MongoClient;
const colors = require('colors');

/// Setup
const url = 'mongodb://localhost:27017';
const dataBaseName = 'entrez';    /// Database
const collectionName = 'pubmed';  /// Collection name

var con;
var db;     /// Database
var dbcl;   /// Collection
var ok = false;
var pubmed = new Object();



pubmed.create = function(request, result, next){
  MongoClient.connect(url,  {
    useNewUrlParser: true,
    useUnifiedTopology: true
  })
  .then((con) => {
    if(!con.serverConfig.isConnected()){
      console.log('[pubmed.collection] Server is not connected!'.brightRed);
    }
    return db.collection(collectionName).insertOne(request.body);
  })
  .then((res) => {
    console.log('[pubmed.collection] Inserted %i records. ID = %s', res.insertedCount, res.insertedId);
    result.json(res.insertedId);
  })
  .catch(reason => {
    console.log('[pubmed.collection] Mongodb Rejected:\n %s\nDatabase server inactive?'.brightRed, reason); 
  })
  // finally close ??
  // .catch(next) ??
}



module.exports = pubmed;
