import test from 'ava';
import rp from 'request-promise-native';
import startServer from './helpers/testServer';
import { tests, allResult, defaultBMD } from './helpers/testedValues';
import { loadBehavior } from './helpers/utils';

/**
 * @type {fastify.FastifyInstance}
 */
let server;

test.before(async t => {
  server = await startServer();
});

test.after.always(t => {
  t.timeout(60 * 1000);
  return server.close();
});

for (const aTest of tests) {
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

  test(`Retrieving the behavior info-list for "${
    aTest.name
  }" by URL should work`, async t => {
    const response = await rp({
      method: 'GET',
      uri: aTest.infoListURL,
      json: true,
    });
    const expectedInfo = aTest.metadata;
    if (response.behaviors.length === 1) {
      t.deepEqual(response.behaviors, [expectedInfo]);
    } else {
      t.deepEqual(response.behaviors, [expectedInfo, defaultBMD]);
    }
  });

  test(`Retrieving the behavior info-list for "${
    aTest.name
  }" by name should work`, async t => {
    const response = await rp({
      method: 'GET',
      uri: aTest.infoListByNameURL,
      json: true,
    });
    const expectedInfo = aTest.metadata;
    if (response.behaviors.length === 1) {
      t.deepEqual(response.behaviors, [expectedInfo]);
    } else {
      t.deepEqual(response.behaviors, [expectedInfo, defaultBMD]);
    }
  });
}

test('Retrieving all behavior info should work', async t => {
  const {
    url,
    value: { defaultBehavior, behaviors },
    count,
  } = allResult;
  const response = await rp({
    method: 'GET',
    uri: url,
    json: true,
  });
  t.deepEqual(response.defaultBehavior, defaultBehavior);
  t.is(response.behaviors.length, count);
  for (const b of response.behaviors) {
    t.deepEqual(b, behaviors[b.name]);
  }
});
