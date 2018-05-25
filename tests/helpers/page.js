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
    // we land on the blog page after logging in
    await this.page.goto('localhost:3000/blogs');
    // otherwise the test will fail becaause it goes very quickly
    await this.page.waitFor('a[href="/auth/logout"]');
  }

  // make $eval more clear
  async getContentsOf(selector) {
    return this.page.$eval(selector, el => el.innerHTML);
  }

  // automate GET request
  get(path) {
    return this.page.evaluate((_path) => {
      // page.evaluate turns everything into a string, so 'path' won't be available
      // as a closure scope value, so we need to pass it as an argument to evaluate()
      // and the pageFunction (_path === path)
      return fetch(_path, {
        method: 'GET',
        credentials: 'same-origin',
        headers: {
          'Content-Type': 'application/json'
        }
      }).then(res => res.json());
    }, path);
  }

  // automate POST request
  post(path, data) {
    return this.page.evaluate((_path, _data) => {
      return fetch(_path, {
        method: 'POST',
        credentials: 'same-origin',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(_data)
      }).then(res => res.json());
    }, path, data);
  }

  // perfomr request
  execRequests(actions) {
    // array of promises, need to resolve them
    return Promise.all(actions.map(
      ({ method, path, data }) => {
      return this[method](path, data);
    }));
  }
}

module.exports = CustomPage;
