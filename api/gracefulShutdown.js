'use strict';
const fp = require('fastify-plugin');
const parallel = require('fastparallel')();

/**
 * @param {Object} opts
 * @return {Array<string>}
 */
function signalsListeningFor(opts) {
  const defaultSignals = ['SIGINT', 'SIGTERM'];
  if (Array.isArray(opts.signals)) {
    for (let i = 0; i < opts.signals.length; i++) {
      if (!defaultSignals.includes(opts.signals[i])) {
        defaultSignals.push(opts.signals[i])
      }
    }
  } else if (typeof opts.signals === 'string') {
    if (!defaultSignals.includes(opts.signals)) {
      defaultSignals.push(opts.signals)
    }
  }
  return defaultSignals;
}

/**
 * Exists until plugins are updated for v2.0
 * @param {fastify.FastifyInstance} server
 * @param {Object} opts
 * @param next
 */
module.exports = fp(function gracefulShutdown(server, opts, next) {
  const logger = server.log.child({ plugin: 'gracefulShutdown' });
  const handlers = [];
  const timeout = opts.timeout || 10000;
  const signals = signalsListeningFor(opts);

  const completed = (err, signal) => {
    if (err) {
      logger.error({ err: err, signal: signal }, 'process terminated');
      process.exit(1);
    } else {
      logger.info({ signal: signal }, 'process terminated');
      process.exit(0);
    }
  };

  const terminateAfterTimeout = (signal, timeout) => {
    setTimeout(() => {
      logger.error(
        { signal: signal, timeout: timeout },
        'terminate process after timeout'
      );
      process.exit(1);
    }, timeout).unref();
  };

  const shutdown = signal => {
    parallel(null, handlers, signal, err => completed(err, signal));
  };

  const addHandler = handler => {
    if (typeof handler !== 'function') {
      throw new Error(`Expected a function but got a ${typeof handler}`);
    }
    handlers.push(handler);
  };

  server.decorate('gracefulShutdown', addHandler);

  // shutdown fastify
  addHandler((signal, cb) => {
    logger.info({ signal: signal }, 'triggering close hook');
    server.close(cb);
  });

  // register handlers
  signals.forEach(signal => {
    process.once(signal, () => {
      terminateAfterTimeout(signal, timeout);
      logger.info({ signal: signal }, 'received signal');
      shutdown(signal);
    });
  });

  next();
});
