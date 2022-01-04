# fetch-her
Simple data fetching service for REST APIs
Now, with a bit saner JWT Bearer implementation, mocking endpoints, and more

## Usage
```javascript
import fetchService from 'fetch-her';

fetchService.Setup({ collections: myCollections });

await fetchService.fetch('SOME_COLLECTION_NAME', {...});
```

## Configuration
### Define your collections / end-points
```javascript
const myCollections = {
  unfinished: {
    url: 'http://non.finished-api.yourdomain.com/api/v3/something',
    method: 'GET',

    // OPTIONAL PARAMETER - You can assign anything to the `mock` property
    // Whatever you put here will be your `data` property
    mock: {some: [1, 22, 333], more: 'stuff', aaa: 111, bbb: 222, ccc: {ama: 'zing'}},
    extract: ['some', 'ccc'] // OPTIONAL - string[]
  },
  
  employees: {
    url: 'http://dummy.restapiexample.com/api/v1/employees',
    cache: 'ram', // OPTIONAL PARAMETER. 'ram' is the only accepted value at this time
    method: 'GET',
    options: {}, // OPTIONAL PARAMETER
    headers: {}, // OPTIONAL PARAMETER
    done: (e) => (), // OPTIONAL PARAMETER - Function | String
  },
  employee: {
    url: 'http://dummy.restapiexample.com/api/v1/employee/1',
    method: 'GET',
    cache: 'ram',
    done: 'YOUR_CUSTOM_EVENT_NAME_HERE', // OPTIONAL PARAMETER - Function | String
  },
  create: {
    url: 'http://dummy.restapiexample.com/api/v1/create',
    method: 'POST',
  },
  update: {
    url: 'http://dummy.restapiexample.com/api/v1/update/21',
    method: 'PUT',
  },
  delete: {
    url: 'http://dummy.restapiexample.com/api/v1/delete/2',
    method: 'DELETE',
  },

  // You can also upload files
  uploadFile: {
    url: '/upload',
    method: 'POST',
    isFile: true,
  },

  // AGGREGATED
  // You may use collections of aggregated collections
  allInfo: {
    collections: [
      // No such collections. Someone forgot them here...
      'about', 'info',

      // These are real ones
      'employees', 'employee', 'create', 'update', 'delete',
    ],
  },
};
```

## Usage and special props - everything is optional
```javascript

const mai_data = await fff.fetch('employee', {
  // Your props are transformed to either CGI in the URL or body payload
  a: 1,
  b: 2,
  c: 3,
  
  // Special props ARE OPTIONAL

  // When used, its value will replace your regular non-special props
  // which are usually used as your body payload
  $body: {},

  // Two ways to replace a collection emit or add a new one just for this call
  $done: (e) => (),
  $done: 'FETCH_DATA',
  
  // Causes the fetcher to reject failed attempts
  // Be default, we don't do that and simply resolve
  // Exmaple: {error: 1, message: 'Bla bla bla', data: null}
  $reject: true,

  // Merged into a collection's url
  $path: '/aaa/bbb/ccc',

  // Merged with the fetch options object.
  // Will overwrite any matching props provided by
  // the global options and the collection itself
  $options: {...},

  // Merged with headers from the global Setup object
  // AND the headers in the collection itself
  $headers: {x: 1, y: 2, z: 3},

  // Cached collection response, if any, is being ignored and a new request is being made.
  // If successful, any prior cache is updated
  $refresh: true,

  // Replaces the collection `extract` property, if any
  $extract: ['prop1', 'prop2', 'prop3'],
})
```

## Aborting requests
The simplest way to abort a request is like this
```javascript
const ac = new AbortController()

fetchService.get('someCollection', {
  $options: { signal: ac.signal }
})

ac.abort()
```

## Overwriting collection HTTP method
`fetchService.fetch` does't make much sense to you? We've got you covered with<br >
Existing collection method is being overwritten while making this request
```javascript
fetchService.get('someCollection', {...})
fetchService.put('someCollection', {...})
fetchService.post('someCollection', {...})
fetchService.patch('someCollection', {...})
fetchService.delete('someCollection', {...})
```

## Changing options, headers and JWT
```javascript
fetchService.Setup({
  collections: myCollections,
  options: {
    headers: {
      no: 'more',
      hanging: 'wires',
      bearer: 'HASH' // Your token or null to disable the header
    }
  }
});
```

## Mocking endpoints
```javascript
const myCollections = {
  unfinished: {
    url: 'http://non.finished-api.yourdomain.com/api/v3/something',
    method: 'GET',

    // OPTIONAL PARAMETER - Whatever you put here will be your `data`
    mock: {some: [1, 22, 333], more: 'stuff'}
  },
};

await fff.fetch('unfinished')
// {
//   MOCK: true,
//   collection: "unfinished",
//   data: {some: [1, 22, 333], more: "stuff"},
// }
```

## Emitting events on successful fetch
```javascript
const myCollections = {
  employees: {
    url: 'http://dummy.restapiexample.com/api/v1/employees',
    method: 'GET',
    
    // Recevies an object with the collection's name and the response
    done: ({collection: String, response: Object}) => console.warn('Yeah...'),
  },
  employee: {
    url: 'http://dummy.restapiexample.com/api/v1/employee/1',
    method: 'GET',

    // User provided string is used to dispatch a CustomEvent instance
    done: 'YOUR_STRING',
  }
};
```
## Important note about fetch
You are expected to have `fetch` in your global scope.
