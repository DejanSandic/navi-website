export const filename = __filename

# Navigation objects

Each Navi app has a `Navigation` object that holds its history, routing state, etc.

You can either create a `Navigation` object with `createBrowserNavigation()` in the browser, or `createMemoryNavigation()` on the server.

Whichever way you create a Navigation object, they both implement the same `Navigation` interface.

## `Navigation` interface

### Properties

#### `navigation.history`

An interface to the browser history. You can use this object's `push()` and `replace()` to navigate programatically:

```js
// Push a URL onto the browser history
history.push(path, state?)

// Replace the current URL
history.replace(path, state?)
```

This object is managed by the [history](https://npmjs.com/package/history) package -- the same package used by react-router. This makes it possible to [use both Navi and react-router]() in the same project.

#### `navigation.router`

A [Router](http://localhost:3000/reference/router/) object, which can be used to resolves URLs to [`Route` objects](../routes-segments-urls/#route) or site maps.

### Methods

#### `navigation.getCurrentValue()`

```typescript
navigation.getCurrentValue(): NavigationSnapshot
```

Returns the current `NavigationSnapshot` object.

#### `navigation.getSteadyValue()`

```typescript
navigation.getSteadyValue(): Promise<NavigationSnapshot>
```

Returns a promise to a steady state `NavigationSnapshot` object.

#### `navigation.setContext()`

```typescript
navigation.setContext(context)
```

Sets the top-level [Env object](../declarations/#env-objects)'s context and recomputes any getter functions in your declarations.

#### `navigation.steady()`

```typescript
navigation.getCurrentValue(): Promise<void>
```

Returns a promise that resolves once the current value will no longer change without the history itself changing; i.e. once it reaches a steady state.

#### `navigation.subscribe()`

```typescript
navigation.subscribe(listener: navigationSnapshot => void)
```

## `NavigationSnapshot`

```typescript
{
  history: History
  router: Router

  route: Route
  url: URLDescriptor
}
```

## `createBrowserNavigation()`

```typescript
createBrowserNavigation(options: {
  pages: Switch,

  /**
   * If `true`, this will not scroll the user when navigating between
   * pages.
   */
  disableScrollHandling?: boolean,

  /**
   * The scroll behavior to use when scrolling between hashes on a
   * page. Defaults to smooth.
   */
  hashScrollBehavior?: 'smooth' | 'instant'

  initialContext?: Context,

  /**
   * You can manually supply a history object. This is useful for
   * integration with react-router.
   * 
   * By default, a browser history object will be created.
   */
  history?: History,

  rootPath?: string,

  /**
   * Sets `document.title` to the value of the
   * `pageTitle` property in the current switch's meta, if it exists.
   * 
   * You can also supply a function that receives `pageTitle`, and
   * returns a processed string that will be set.
   * 
   * Defaults to `true`.
   */
  setDocumentTitle?: boolean | ((pageTitle?: string) => string),
})
```

#### Example

```js
import pages from './pages'

let navigation = Navi.createBrowserNavigation({
  // Your app's root switch
  pages,
})
```

## `createMemoryNavigation()`

```typescript
createMemoryNavigation(options: {
  pages: Switch,

  url: string | Partial<URLDescriptor>

  initialContext?: Context,

  rootPath?: string,
})
```

#### Example

```js
let navigation = Navi.createMemoryNavigation({
  // Your app's root switch
  pages: Navi.createSwitch({
    // ...
  }),

  // The URL to resolve
  url: '/test',
})
```