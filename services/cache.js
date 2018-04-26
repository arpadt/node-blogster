const mongoose = require('mongoose');
// get a reference to the exec() function of mongoose
const exec = mongoose.Query.prototype.exec;

// overwrite it
mongoose.Query.prototype.exec = function() {
  // this code will run before any query
  console.log('I am about to run a query');

  console.log(this.getQuery());
  console.log(this.mongooseCollection.name);

  return exec.apply(this, arguments);
}
