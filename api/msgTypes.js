'use strict';

/**
 * The message types for behavior look  workers
 * @type {{lookupBehavior: string, lookupBehaviorInfo: string, behaviorLookupResults: string, reloadBehaviorsResults: string, reloadBehaviors: string, shutdown: string}}
 */
module.exports = {
  reloadBehaviors: 'reload-behaviors',
  reloadBehaviorsResults: 'reload-behaviors-results',
  lookupBehavior: 'lookup-behavior',
  lookupBehaviorInfo: 'lookup-behavior-info',
  behaviorLookupResults: 'behavior-lookup-results',
  shutdown: 'shutdown'
};
