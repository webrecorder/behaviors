import test from 'ava';
import rp from 'request-promise-native';
import startServer from './helpers/testServer';
import TestedValues from './helpers/testedValues';
import { loadBehavior } from './helpers/utils';

/**
 * @type {fastify.FastifyInstance}
 */
let server;

test.before(async t => {
  server = await startServer();
});

test.after.always(t => {
  t.timeout(60*1000);
  return server.close();
});

for (let i = 0; i < TestedValues.length; i++) {
  const aTest = TestedValues[i];
  test(`Retrieving the behavior js for "${
    aTest.name
  }" by URL should work`, async t => {
    const response = await rp(aTest.behaviorURL);
    const expectedBehavior = await loadBehavior(aTest.metadata.fileName);
    t.is(response, expectedBehavior);
  });

  test(`Retrieving the behavior info for "${
    aTest.name
  }" by URL should work`, async t => {
    const response = await rp({
      method: 'GET',
      uri: aTest.infoURL,
      json: true,
    });
    const expectedInfo = aTest.metadata;
    t.deepEqual(response, expectedInfo);
  });

  test(`Retrieving the behavior js for "${
    aTest.name
  }" by NAME should work`, async t => {
    const response = await rp(aTest.behaviorByNameURL);
    const expectedBehavior = await loadBehavior(aTest.metadata.fileName);
    t.is(response, expectedBehavior);
  });

  test(`Retrieving the behavior info for "${
    aTest.name
  }" by NAME should work`, async t => {
    const response = await rp({
      method: 'GET',
      uri: aTest.infoByNameURL,
      json: true,
    });
    const expectedInfo = aTest.metadata;
    t.deepEqual(response, expectedInfo);
  });
}
