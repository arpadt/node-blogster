const Page = require('./helpers/page');

let page;

beforeEach(async () => {
  page = await Page.build();
  await page.goto('localhost:3000');
});

afterEach(async () => {
  await page.close();
});

describe('When logged in', async () => {
  beforeEach(async () => {
    await page.login();
    // click on the new blog buttton
    await page.click('a.btn-floating');
  });

  test('can see blog create form', async () => {
    // make sure that we are at the correct form
    const label = await page.getContentsOf('form label');

    expect(label).toEqual('Blog Title');
  });

  describe('and using invalid inputs', async () => {
    beforeEach(async () => {
      // submit the form, simulate a click on the Next button
      await page.click('form button');
    });

    test('the form shows an error message', async () => {
      const titleError = await page.getContentsOf('.title .red-text');
      const contentError = await page.getContentsOf('.content .red-text');

      expect(titleError).toEqual('You must provide a value');
      expect(contentError).toEqual('You must provide a value');
    });
  });

  describe('and using valid inputs', async () => {
    beforeEach(async () => {
      // type in some valid input
      await page.type('.title input', 'My Title');
      await page.type('.content input', 'My Content');

      // submit the form
      await page.click('form button');
    });

    test('submitting takes user to review screen', async () => {
      // review page starts with 'Please confirm your entries'
      const text = await page.getContentsOf('h5');

      expect(text).toEqual('Please confirm your entries');
    });

    test('submitting then saving adds blog to index page', async () => {
      // click the Save button
      await page.click('button.green');

      // should be back to the blog list
      // get the selector for the new content
      await page.waitFor('.card');
      const title = await page.getContentsOf('.card-title');
      const content = await page.getContentsOf('p');

      expect(title).toEqual('My Title');
      expect(content).toEqual("My Content");
    });
  });
});

describe('When not logged in', async () => {
  const actions = [
    {
      method: 'get',
      path: '/api/blogs'
    },
    {
      method: 'post',
      path: '/api/blogs',
      data: {
        title: 'My Title',
        content: 'My Content'
      }
    },
    // ...
  ];


  test('Blog related actions are prohibited', async () => {
    // results of every request we make
    const results = await page.execRequests(actions);

    for (let result of results) {
      expect(result).toEqual({ error: 'You must log in!' });
    }
  });
});
