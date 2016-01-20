var reply = require('reply');
 
var opts = {
  username: {
    default : 'nobody', // if left empty, will fall back to this value 
    type    : 'string'    // ensure value is not a number 
  },
  password: {
    message : 'Password, please.',
    type    : 'password',
    regex   : /(\w{9})/,
    error   : 'Nine chars minimum. Try again.'
  }
}
 
//Gets username 
function get_country(answers) {
    return answers.username;
}

 reply.get(opts, function(err, answers) {
  console.log(answers); 
});
