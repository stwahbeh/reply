var reply = require('./../');

reply.confirm('Deleting these files will erase them permanently. Would you like to continue?', function(err, yes){

  if (!err && yes)
    console.log("Files have been deleted");
  else
    console.log("Deltion aborted");

});
