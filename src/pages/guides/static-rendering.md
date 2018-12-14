export const filename = __filename
export const demoboardHelpers = {
  'App.js': require('!raw-loader!./minimal-example/App.js'),
  'index.js': require('!raw-loader!./minimal-example/index.js'),
  'pages.js': require('!raw-loader!./minimal-example/pages.js'),
  'pages/Reference.js': require('!raw-loader!./minimal-example/Reference.js'),
  'styles.css': require('!raw-loader!./minimal-example/styles.css'),
}

Static Rendering
================

It only takes two small changes to set up static HTML generation for your Navi-based create-react-app site:

1. Call `Navi.app()` in `src/index.js`
2. Update your `package.json`


`Navi.app()`
------------

```typescript
Navi.app({
  // Your app's `pages` switch (which lets Navi know what
  // files need to be created).
  pages: Switch,

  // The function that will be called to start your app.
  main: Function,

  // An object that allows you to pass arbitrary information
  // to the static renderer. For the default create-create-app
  // renderer, you'll need to pass your `App` component.
  exports: any,
})
```

To let Navi know what to render, you'll need to call `Navi.app()` from within `src/index.js` .

Assuming that you're using the default `src/index.js` from create-react-app, here's what it'll look after adding a call to `Navi.app()`:

```js
//---
restricted: true
//--- index.js
import * as Navi from 'navi'
import React from 'react'
import ReactDOM from 'react-dom'
import pages from './pages'
import App from './App'

Navi.app({
  // Specify the pages that navi-app should statically build, by passing
  // in a Switch object
  pages,

  // The default create-react-app renderer needs access to the App
  // component.
  exports: App,

  async main() {
    let navigation = Navi.createBrowserNavigation({
      pages,
    })

    // Wait until the navigation has loaded the page's content,
    // or failed to do so. If you want to load other data in parallel
    // while the initial page is loading, make sure to start loading
    // before this line.
    await navigation.steady()

    // React requires that you call `ReactDOM.hydrate` if there is
    // statically rendered content in the root element, but prefers
    // us to call `ReactDOM.render` when it is empty.
    let hasStaticContent = process.env.NODE_ENV === 'production'
    let renderer = hasStaticContent ? ReactDOM.hydrate : ReactDOM.render

    // Start react.
    renderer(
      <App navigation={navigation} />,
      document.getElementById('root')
    )
  }
})
//--- pages.js <-- pages.js
//--- pages/Reference.js <-- pages/Reference.js
//--- App.js <-- App.js
//--- styles.css <-- styles.css
```

Note that `Navi.app()` will call the provided `main()` function when appropriate, so you won't need to manually call `main()`.


Building the app
----------------

Navi's static renderer is part of the `navi-scripts` package, so start by installing it:

```bash
npm install --save navi-scripts
```

To render your app, navi-scripts loads the result of the create-react-app's build script in a [jsdom](https://github.com/jsdom/jsdom). Because of this, you'll always need to run create-react-app's build script before running Navi's build script:

```bash
npx react-scripts build
```

Finally, once you've added `Navi.app()` to your entry point, and build it with create-react-app's build script, all that's left is to execute Navi's build script:

```bash
npx navi-scripts build
```

You can simplify the build process further by modifying the `build` script with in your `package.json` file to call both React and Navi's build scripts:

```js
"build": "react-scripts build && navi-scripts build"
```

After making this change, you can build your app by simply running your package's build script:

```bash
npm run build
```

And that's all there is to it! After running this command, you'll have HTML files in your `build` folder for every page and redirect. And to try them out, you can use Navi's included server:

```bash
npx navi-scripts serve
```


Custom renderers
----------------

By default, `navi-scripts` produces HTML by passing your `<App>` component to `ReactDOMServer.renderToString()`. However, if you need more control over this process, it's possible to configure a custom renderer.

To start, you'll need to create a `navi.config.js` file in your project's root directory. Then, to configure the custom renderer, simply export a `renderPageToString()` function.

Here's an example `navi.config.js` that configures a custom renderer that matches the default behavior:

```js
import he from 'he'
import * as Navi from 'navi'
import React from 'react'
import ReactDOMServer from 'react-dom/server'
import { renderCreateReactAppTemplate } from 'react-navi/create-react-app'

export async function renderPageToString({
  // The URL to be rendered
  url,

  // The `exports` object passed to `Navi.app()`
  exports,
  
  // The `pages` switch passed to `Navi.app()`
  pages,

  // An object containing all rendered pages and redirects
  siteMap,
}) {
  // Create an in-memory Navigation object with the given URL
  let navigation = Navi.createMemoryNavigation({
    pages,
    url,
  })

  // Wait for any asynchronous content to finish fetching
  await navigation.steady()

  // Get the `title` and `meta` for the matched page
  let { title, meta } = navigation.getCurrentValue()

  // Render the <App> element to a string, passing in
  // `navigation` and `siteMap` objects as props
  let appHTML = ReactDOMServer.renderToString(
    React.createElement(exports, {
      navigation,
      siteMap,
    })
  )

  // Generate metadata 
  let metaHTML =
    `\n<title>${title || 'Untitled'}</title>\n` +
    `<link rel="canonical" href="${process.env.PUBLIC_URL+url.href}" />\n`+
    Object.entries(meta || {}).map(([key, value]) =>
      `<meta name="${he.encode(key)}" content="${he.encode(value)}" />`
    ).concat('').join('\n')

  // Read the `index.html` produced by create-react-app's build script,
  // then inject `appHTML` into the `<div id="root"></div>` tag,
  // and replace the `<title>` tag with `metaHTML`.
  return renderCreateReactAppTemplate({
    insertIntoRootDiv: appHTML,
    replaceTitleWith: metaHTML,
  })
}
```


## HTTP redirects

By default, `navi-scripts` renders redirects as a HTML file with `<meta>`-based redirect. While this default will usually get the job done, it does have the issue of not being able to forward the URL `?search` through to the target URL. As a result, to use `?search` parameters with redirects, you'll need to set up HTTP redirects.

Unfortunately, there's no common standard between hosting platforms by which you can configure HTTP redirects. However, you can easily configure your own method for rendering redirects by exporting a `createRedirectFiles()` function from `navi.config.js`. Here's the default implementation that renders each redirect as a HTML file with a single `<meta>` tag.

```js
// The 'fs-extra' package mirrors Node's 'fs' packages, but its functions
// return promises, facilitating use within `async` functions.
import fs from 'fs-extra'
import path from 'path'

export async function createRedirectFiles({ config, siteMap }) {
  // The `siteMap.redirects` object contains all of the site's redirects,
  // mapping the "from" URL to a Route object.
  for (let { url, to } of Object.values(siteMap.redirects)) {
    // Compute an `index.html` pathname, which will work on hosts that
    // don't automatically map URLs to HTML files that share the same name.
    let pathname =
      url === '/'
        ? 'index.html'
        : path.join(url.pathname.slice(1), 'index.html')

    console.log("[redirect] "+pathname+" -> "+to)

    let filesystemPath = path.resolve(config.root, pathname)
    let text = `<meta http-equiv="refresh" content="0; URL='${to}'" />`

    // Make sure the directory exists before writing the redirect to
    // a file in the directory.
    await fs.ensureDir(path.dirname(filesystemPath))
    await fs.writeFile(filesystemPath, text)
  }
}
```

