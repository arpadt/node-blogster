const Buffer = require('safe-buffer').Buffer;
const Keygrip = require('keygrip');
const keys = require('../../config/keys');

// use keygrip to generate the sessionstring and signature
const keygrip = new Keygrip([keys.cookieKey]);

module.exports = (user) => {
  // generate fake session object
  const sessionObject = {
    passport: {
      user: user._id.toString() // user._id is an object from mongoose
    }
  };
  const session = Buffer.from(JSON.stringify(sessionObject)).toString('base64');
  const sig = keygrip.sign('session=' + session);

  return { session, sig };
}
