'use strict';

/**
 * The message types for behavior look  workers
 * @type {{lookupBehavior: string, info: string, behaviorLookupResults: string, reloadBehaviorsResults: string, reloadBehaviors: string, shutdown: string}}
 */
module.exports = {
  reloadBehaviors: 'reload-behaviors',
  reloadBehaviorsResults: 'reload-behaviors-results',
  lookupBehavior: 'lookup-behavior',
  lookupBehaviorInfo: 'lookup-behavior-info',
  lookupBehaviorInfoAll: 'lookup-behavior-info-all',
  behaviorLookupResults: 'behavior-lookup-results',
  behaviorList: 'list-all-behaviors',
  behaviorListResults: 'list-all-behaviors-results',
  shutdown: 'shutdown',
};
