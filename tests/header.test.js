const puppeteer = require('puppeteer');

const sessionFactory = require('./factories/session-factory');
const userFactory = require('./factories/user-factory');

let browser, page;

beforeEach(async () => {
  browser = await puppeteer.launch({
    headless: false // we want to see the graphical interface
  });
  page = await browser.newPage();
  await page.goto('localhost:3000');
});

afterEach(async () => {
  await browser.close();
});

test('the header has the correct test', async () => {
  const text = await page.$eval('a.brand-logo', el => el.innerHTML);

  expect(text).toEqual('Blogster');
});

test('clicking loging start oauth flow', async () => {
  await page.click('.right a');

  const url = await page.url();

  expect(url).toMatch(/accounts\.google\.com/);
});

test('When signed in, shows logout button', async () => {
  const user = await userFactory();
  const { session, sig } = sessionFactory(user);

  // set up a cookie in the Chromium instance
  await page.setCookie({ name: 'session', value: session });
  await page.setCookie({ name: 'session.sig', value: sig });
  // refresh the page, simulate logging in
  await page.goto('localhost:3000');
  // otherwise the test will fail becaause it goes very quickly
  await page.waitFor('a[href="/auth/logout"]');

  // get the Logout button
  const text = await page.$eval('a[href="/auth/logout"]', el => el.innerHTML);

  expect(text).toEqual('Logout');
});
