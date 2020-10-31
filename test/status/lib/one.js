import { serial as test } from 'ava';
import rp from 'request-promise-native';
import crypto from 'crypto'
import { loadBehavior } from '../../helpers/utils';
import { tests } from '../../helpers/testedValues';
import startServer from '../../helpers/testServer';
import withPage from './_withPage';

const WR_SELECTOR = 'WEBRECORDER_SELECTOR_TEST_' + crypto.randomBytes(4).toString('hex')
let server;

test.before(async t => {
  server = await startServer();
});

test.after.always(t => {
  t.timeout(60 * 1000);
  return server.close();
});

for (const aTest of tests) {
  test(aTest.metadata.name,
    withPage, async (t, page) => {
      const response = await rp(aTest.behaviorURL);
      var scriptToInject = await loadBehavior(aTest.metadata.fileName);
      scriptToInject += createSelectorScript()
      await page.goto(aTest.url);
      await page.evaluate(scriptToInject)
      // TODO: remove the waitFor(10000) once the WR_SELECTOR
      // is created after the END of the behavior
      await page.waitFor(10000);
      await page.waitForSelector('#' + WR_SELECTOR);
      t.pass()
    });
}


// This helps us know that the script was run on the page,
// TODO: it could be improved by making sure it's only
// run AFTER the behavior has completed. Is there a way to hook into
// that inside of the behaviors?
function createSelectorScript () {
  return `var el = document.createElement("div");
el.setAttribute('id', "${WR_SELECTOR}");
el.innerHTML = "${WR_SELECTOR}";
document.body.parentElement.appendChild(el);
`
}
