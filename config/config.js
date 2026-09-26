const convict = require('convict');


let config = convict({
    version: {
      format: String,
      default: '2.0.0'
    },
    specification:{
      format: String,
      default: 'zedrem-Spacebook-1.0.0-resolved.json'
    },
    authToken: {
        format: String,
        default: 'X-Authorization'
    }
});


module.exports = config;
