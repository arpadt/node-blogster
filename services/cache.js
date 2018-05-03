const mongoose = require('mongoose');
const redis = require('redis');
const util = require('util');

const redisUrl = 'redis://127.0.0.1:6379';
const client = redis.createClient(redisUrl);
client.hget = util.promisify(client.hget);

// get a reference to the exec() function of mongoose
const exec = mongoose.Query.prototype.exec;

mongoose.Query.prototype.cache = function(options = {}) {
  this.useCache = true;

  // specify top level hash key --> some level of reusabiliy
  this.hashKey = JSON.stringify(options.key || '');

  return this; // make it chainable function call along with other methods: sort, limit etc
}

// overwrite it
mongoose.Query.prototype.exec = async function() {
  // this code will run before any query
  // console.log('I am about to run a query');

  if (!this.useCache) return exec.apply(this, arguments);

  // console.log(this.getQuery());
  // console.log(this.mongooseCollection.name);
  const key = JSON.stringify(Object.assign({}, this.getQuery(), {
    collection: this.mongooseCollection.name
  }));

  // console.log(key);

  // see if we have a value for key in redis
  const cacheValue = await client.hget(this.hashKey, key);

  // if we do, return that
  if (cacheValue) {
    // exec() expects mongoose document to return
    // need to turn the json into a document
    // const doc = new this.model(JSON.parse(cacheValue));
    const doc = JSON.parse(cacheValue);
    // returned value can be array or object (representing one individual record)
    return Array.isArray(doc)
      ? doc.map(d => new this.model(d))
      : new this.model(doc);
  }

  // else issue the query and store the result in query
  const result = await exec.apply(this, arguments);

  client.hset(this.hashKey, key, JSON.stringify(result));
  client.expire(this.hashKey, 10);

  return result;
};

module.exports = {
  clearHash(hashKey) {
    client.del(JSON.stringify(hashKey));
  }
}
