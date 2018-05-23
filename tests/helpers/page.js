const puppeteer = require('puppeteer');

const sessionFactory = require('../factories/session-factory');
const userFactory = require('../factories/user-factory');

class CustomPage {
  static async build() {
    // generates a new custom page and combines the two together
    const browser = await puppeteer.launch({
      headless: false
    });

    const page = await browser.newPage();
    const customPage = new CustomPage(page);

    // create the proxy
    return new Proxy(customPage, {
      get: function(target, property) {
        // include browser as well to use its close() method
        return customPage[property] || browser[property] || page[property];
      }
    });
  }

  constructor(page) {
    this.page = page;
  }

  // reusable and will be reused
  async login() {
    const user = await userFactory();
    const { session, sig } = sessionFactory(user);

    // set up a cookie in the Chromium instance
    await this.page.setCookie({ name: 'session', value: session });
    await this.page.setCookie({ name: 'session.sig', value: sig });
    // refresh the page, simulate logging in
    await this.page.goto('localhost:3000');
    // otherwise the test will fail becaause it goes very quickly
    await this.page.waitFor('a[href="/auth/logout"]');
  }

  // make $eval more clear
  async getContentsOf(selector) {
    return this.page.$eval(selector, el => el.innerHTML);
  }
}

module.exports = CustomPage;
