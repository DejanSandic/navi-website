import * as Navi from "navi";
import React from "react";
import ReactDOM from "react-dom";
import pages from "./pages";
import App from "./App";

// `Navi.app()` is responsible for exporting your app's pages and App
// component to the static renderer, and for starting the app with the
// `main()` function when running within a browser.
Navi.app({
  // Specify the pages that navi-app should statically build, by passing in a
  // Switch object.
  pages,

  // The default create-react-app renderer needs access to the App component.
  // Learn about custom static renderers at:
  // https://frontarm.com/navi/guides/static-rendering/
  exports: {
    App,
  },

  // This will only be called when loading your app in the browser. It won't
  // be called when performing static generation.
  async main() {
    let navigation = Navi.createBrowserNavigation({
      pages,
    });

    // Wait until the navigation has loaded the page's content, or failed to do
    // so. If you want to load other data in parallel while the initial page is
    // loading, make sure to start loading before this line.
    await navigation.steady();

    // React requires that you call `ReactDOM.hydrate` if there is statically
    // rendered content in the root element, but prefers us to call
    // `ReactDOM.render` when it is empty.
    let hasStaticContent = process.env.NODE_ENV === "production";
    let renderer = hasStaticContent ? ReactDOM.hydrate : ReactDOM.render;

    // Start react.
    renderer(
      <App navigation={navigation} />,
      document.getElementById("root")
    );
  }
});
