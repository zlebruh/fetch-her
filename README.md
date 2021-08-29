# fetch-her
Simple data fetching service for REST APIs
Now, with a bit saner JWT Bearer implementation, mocking endpoints, and more

## Usage
```javascript
import fetchService from 'fetch-her';

fetchService.Setup({ collections: myCollections });

await fetchService.GetData('SOME_COLLECTION_NAME', {...});
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

    // Extract these properties into the returned data object
    // If only a single prop is being extracted,
    // its content will be merged into the returned data object
    // Empty strings are being filtered out/ignored
    extract: ['some', 'ccc'] // OPTIONAL - String[] | String
    // OR
    extract: 'more'
  },
  
  employees: {
    url: 'http://dummy.restapiexample.com/api/v1/employees',
    cache: 'ram', // OPTIONAL PARAMETER. 'ram' is the only accepted value at this time
    method: 'GET',
    options: {}, // OPTIONAL PARAMETER
    headers: {}, // OPTIONAL PARAMETER
    emit: (e) => (), // OPTIONAL PARAMETER - Function | String
  },
  employee: {
    url: 'http://dummy.restapiexample.com/api/v1/employee/1',
    method: 'GET',
    cache: 'ram',
    emit: 'YOUR_CUSTOM_EVENT_NAME_HERE', // OPTIONAL PARAMETER - Function | String
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

const mai_data = await fff.GetData('employee', {
  // Your props are transformed to either CGI in the URL or body payload
  a: 1,
  b: 2,
  c: 3,
  
  // Special props ARE OPTIONAL

  // Two ways to replace a collection emit or add a new one just for this call
  '@emit': (e) => (),
  '@emit': 'FETCH_DATA',
  

  // Merged into a collection's url
  '@path': '/aaa/bbb/ccc',

  // Merged with the fetch options object.
  // Will overwrite any matching props provided by
  // the global options and the collection itself
  '@options': {...},

  // Merged with headers from the global Setup object
  // AND the headers in the collection itself
  '@headers': {x: 1, y: 2, z: 3},

  // Cached collection response, if any, is being ignored and a new request is being made.
  // If successful, any prior cache is updated
  '@refresh': true,

  // Replaces the collection `extract` property, if any
  '@extract': 'prop1',
  '@extract': ['prop1', 'prop2', 'prop3'],
})
```

## Overwriting collection HTTP method
`GetData` does't make much sense to you? We've got you covered with<br >
Existing collection method is being overwritten while making this request
```javascript
await fetchService.get('getSomeCollection', {...})
await fetchService.put('putSomeCollection', {...})
await fetchService.post('postSomeCollection', {...})
await fetchService.patch('patchSomeCollection', {...})
await fetchService.delete('deleteSomeCollection', {...})
```

## Changing options, headers and JWT
```javascript
fetchService.Setup({
  collections: myCollections,
  options: { headers: { no: 'more', hanging: 'wires' } },
  bearer: 'HASH' // or null to disable the header
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

await fff.GetData('unfinished')
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
    // Only called after a `successful` fetch.
    // Returning cache does not trigger it
    emit: ({collection: String, response: Object}) => console.warn('Yeah...'),
  },
  employee: {
    url: 'http://dummy.restapiexample.com/api/v1/employee/1',
    method: 'GET',

    // User provided string is used to dispatch a CustomEvent instance
    // that receives `{response: Object, collection: String}` as its `detail`
    // Only called after a `successful` fetch. Returning cache does not trigger it
    emit: 'YOUR_STRING',
  }
};
```
## Important note about fetch
You are expected to have `fetch` in your global scope.
