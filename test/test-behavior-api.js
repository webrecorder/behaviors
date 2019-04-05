import test from 'ava';
import rp from 'request-promise-native';
import startServer from './helpers/testServer';
import BehaviorToMetadata from './helpers/behaviorToMetadata';
import TestedValues from './helpers/testedValues';
import { loadBehavior } from './helpers/utils';

/**
 * @type {fastify.FastifyInstance}
 */
let server;

test.before(async t => {
  server = await startServer();
});

for (const aTest of TestedValues) {
  test(`Retrieving the behavior js for "${aTest.name}" should work`, async t => {
    const response = await rp(aTest.behaviorURL);
    const expectedBehavior = await loadBehavior(aTest.filename);
    t.is(response, expectedBehavior);
  });

  test(`Retrieving the behavior info for "${aTest.name}" should work`, async t => {
    const response = await rp({
      method: 'GET',
      uri: aTest.infoURL,
      json: true
    });
    const expectedInfo = BehaviorToMetadata[aTest.filename];
    t.deepEqual(response, expectedInfo);
  });
}
