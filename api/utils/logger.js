const logger = {
    error: (message) => {
      if (process.env.NODE_ENV !== 'TEST') {
        console.error(message);
      }
    },
  };
  
  module.exports = logger;
  