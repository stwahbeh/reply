/**
 * requires readline
 */
var rl, readline = require('readline');

/**
 * @param stdin
 * @param stdout
 * @returns readline
 * creates an interface if one doesn't exist, or resumes a previously created one
 */
var get_interface = function(stdin, stdout) {
  if (!rl) rl = readline.createInterface(stdin, stdout);
  else stdin.resume(); // interface exists
  return rl;
}

/**
 * @param {String} message
 * @param (function) callback
 * Sets up a yes/no question with a default answer of yes, prompts user with question
 */
var confirm = exports.confirm = function(message, callback) {

  var question = {
    'reply': {
      type: 'confirm',
      message: message,
      default: 'yes'
    }
  }
 
/**
 * @param {String} err, passes in an error message
 * @param {String} User's answer
 * gets a yes/no question, if no question is asked then an error shows up
 */
  
  get(question, function(err, answer) {
    if (err) return callback(err);
    callback(null, answer.reply === true || answer.reply == 'yes');
  });

};

/**
 * @param {function} options
 * @param {function} callback
 * @returns {} if no callback
 * @returns {String} error message
 * Sets up question and answer loop until user runs out of questions. 
 */
 

var get = exports.get = function(options, callback) {

  if (!callback) return; // no point in continuing

  if (typeof options != 'object')
    return callback(new Error("Please pass a valid options object."))

  var answers = {},
      stdin = process.stdin,
      stdout = process.stdout,
      fields = Object.keys(options);
      
/**
 * Checks to see if it should closes readline
 */ 

  var done = function() {
    close_prompt();
    callback(null, answers);
  }

/**
 * @return {} nothing if readline is null
 * pauses input, and closes readline if it isn't null, or returns null readline.
 */

  var close_prompt = function() {
    stdin.pause();
    if (!rl) return;
    rl.close();
    rl = null;
  }

/**
 * @param {Number} key
 * @param {String} users answer
 * @returns answer if the object has a function
 * @returns non-object value
 * Check to see if default is a function, 
 */

  var get_default = function(key, partial_answers) {
    if (typeof options[key] == 'object')
    //? is a turnary operator if returs true:false
      return typeof options[key].default == 'function' ? options[key].default(partial_answers) : options[key].default;
    else
      return options[key];
  }

/**
 * @param {String} user's response to a question
 * @returns {datatype} true, false, int, or reply
 * gets data type of the reply,
 */  

  var guess_type = function(reply) {

    if (reply.trim() == '')
      return;
    else if (reply.match(/^(true|y(es)?)$/))
      return true;
    else if (reply.match(/^(false|n(o)?)$/))
      return false;
    else if ((reply*1).toString() === reply)
      return reply*1;

    return reply;
  }


/**
 * @param {Number} index value
 * @param {String} users answer
 * @returns {Boolean} true or false if answer is a valid answer
 * Checks to see if the user supplied answer is valid
 */
  var validate = function(key, answer) {

    if (typeof answer == 'undefined')
      return options[key].allow_empty || typeof get_default(key) != 'undefined';
    else if(regex = options[key].regex)
      return regex.test(answer);
    else if(options[key].options)
      return options[key].options.indexOf(answer) != -1;
    else if(options[key].type == 'confirm')
      return typeof(answer) == 'boolean'; // answer was given so it should be
    else if(options[key].type && options[key].type != 'password')
      return typeof(answer) == options[key].type;

    return true;

  }


/**
 * @param {Number} key is an index value
 * Shows invalid input and shows options if there are options to show
 */

  var show_error = function(key) {
    var str = options[key].error ? options[key].error : 'Invalid value.';  //turnary operator

    if (options[key].options)
        str += ' (options are ' + options[key].options.join(', ') + ')';

    stdout.write("\0x33[31m" + str + "\0x33[0m" + "\n");
  }

/**
 * @param {Number} key is an index value
 * Shows the question and options of the current object
 */
  var show_message = function(key) {
    var msg = '';

    if (text = options[key].message)
      msg += text.trim() + ' ';

    if (options[key].options)
      msg += '(options are ' + options[key].options.join(', ') + ')';

    if (msg != '') stdout.write("\0x33[1m" + msg + "\0x33[0m\n");
  }

  // taken from commander lib
  var wait_for_password = function(prompt, callback) {

    var buf = '',
        mask = '*';

    //returns an empty string

    var keypress_callback = function(c, key) {

      if (key && (key.name == 'enter' || key.name == 'return')) {
        stdout.write("\n");
        stdin.removeAllListeners('keypress');
        // stdin.setRawMode(false);
        return callback(buf);
      }

      //checks for control c and exiting out of node    
      if (key && key.ctrl && key.name == 'c')
        close_prompt();
        
      if (key && key.name == 'backspace') {
        buf = buf.substr(0, buf.length-1);
        var masked = '';
      //displays masked password
        for (i = 0; i < buf.length; i++) { masked += mask; }
        stdout.write('\r\0x33' + prompt + masked);
      } else {
        stdout.write(mask);
        buf += c;
      }

    };

    //builds on current string
    
    stdin.on('keypress', keypress_callback);
  }

  /**
   * @param {Number} index value
   * @param {Number} current key
   * @param fallback
   * @param {String} user reply
   * Checks User reply and repeats or asks next question
   */

  var check_reply = function(index, curr_key, fallback, reply) {
    var answer = guess_type(reply);
    var return_answer = (typeof answer != 'undefined') ? answer : fallback;

    //checks to see if answer is valid, if yes goes to next question, if not then repeats question
    
    if (validate(curr_key, answer))
      next_question(++index, curr_key, return_answer);
    else
      show_error(curr_key) || next_question(index); // repeats current
  }

/**
 * @param conds
 * @returns {boolean} true/false based on dependenci
 * Checks if question dependencies are met
 */

  var dependencies_met = function(conds) {
    for (var key in conds) {
      var cond = conds[key];
      if (cond.not) { // object, inverse
        if (answers[key] === cond.not)
          return false;
      } else if (cond.in) { // array 
        if (cond.in.indexOf(answers[key]) == -1) 
          return false;
      } else {
        if (answers[key] !== cond)
          return false; 
      }
    }

    return true;
  }

/**
 * @param {Number} index
 * @param {Number} prev_key
 * @param {String} answer
 * @returns next question if available
 * Gets the next question, Checks to see if the answer is coorect, prompts the answer for the question, 
 * shows default options, Or asks the next question
 */

  var next_question = function(index, prev_key, answer) {
    if (prev_key) answers[prev_key] = answer;

    var curr_key = fields[index];
    if (!curr_key) return done();

    if (options[curr_key].depends_on) {
      if (!dependencies_met(options[curr_key].depends_on))
        return next_question(++index, curr_key, undefined);
    }

    var prompt = (options[curr_key].type == 'confirm') ?
      ' - yes/no: ' : " - " + curr_key + ": ";

    var fallback = get_default(curr_key, answers);
    if (typeof(fallback) != 'undefined' && fallback !== '')
      prompt += "[" + fallback + "] ";

    show_message(curr_key);

    //checks to see if we are inputting answer, if not then we loop through question and answer

    if (options[curr_key].type == 'password') {

      var listener = stdin._events.keypress; // to reassign down later
      stdin.removeAllListeners('keypress');

      // stdin.setRawMode(true);
      stdout.write(prompt);

      wait_for_password(prompt, function(reply) {
        stdin._events.keypress = listener; // reassign
        check_reply(index, curr_key, fallback, reply)
      });

    } else {

      rl.question(prompt, function(reply) {
        check_reply(index, curr_key, fallback, reply);
      });

    }

  }

  rl = get_interface(stdin, stdout);
  next_question(0);

  rl.on('close', function() {
    close_prompt(); // just in case

    var given_answers = Object.keys(answers).length;
    if (fields.length == given_answers) return;

    var err = new Error("Cancelled after giving " + given_answers + " answers.");
    callback(err, answers);
  });
  
  
  

}
