# fetch-her
Simple data fetching service for REST APIs
Now, with a bit saner JWT Bearer implementation.

## Purpose
I built this tool for my own needs. It's far from perfect but it's been serving me well over a handful of projects with different depth and requirements.

## Usage
```javascript
import fetchService from 'fetch-her';

fetchService.Setup({ collections: myCollections });

await fetchService.GetData('employees');
```

## Configuration
### Define your collections / end-points
```javascript
const myCollections = {
  employees: {
    url: 'http://dummy.restapiexample.com/api/v1/employees',
    cache: 'ram', // OPTIONAL PARAMETER. 'ram' is the only accepted value at this time
    method: 'GET',
    headers: {}, // OPTIONAL PARAMETER
  },
  employee: {
    url: 'http://dummy.restapiexample.com/api/v1/employee/',
    method: 'GET',
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
      'about', 'info',                                       // No such collections. Someone forgot them here...
      'employees', 'employee', 'create', 'update', 'delete', // These are real ones
    ],
  },
};
```

## Actual usage
```javascript
import fetchService from 'fetch-her';

// { collections?: Object; options?: Object; bearer?: String; }
fetchService.Setup({ collections: myCollections });
// OR
fetchService.Setup({
  collections: myCollections,
  options: my_custom_options_object,
  bearer: 'HASH'
});

// Now, let's observe
const d1 = await fetchService.GetData('employees'); // {status: "success", data: Array(24)}
const d2 = await fetchService.GetData('employee', {id: '1'}); // {message: "Oops! someting issue found to fetch record.", error: 1, data: null}

// Cache
// This is the same as d1. Since collection `employees` is being cached (look at its definition up there), no second request is being initiated
const d3 = await fetchService.GetData('employees');

// Refresh cache
// The following will cause a new request and will (provided there are no errors) refresh the cache itself
const d4 = await fetchService.GetData('employees', {
  '@refresh': true,
  prop1: 'bla',
  prop2: ['blah'],
  ...more_props,
});

// Special properties
const mai_data = await fff.GetData('employee', {
  // Your props - these are transform to either CGI in the URL or body payload
  a: 1,
  b: 2,
  c: 3,
  
  // Special props - ALL ARE OPTIONAL
  '@path': '/aaa/bbb/ccc',        // Merged into a collection's url
  '@headers': {x: 1, y: 2, z: 3}, // Merged with headers from the global Setup object AND the headers in the collection itself
  '@refresh': true                // Cached collection response, if any, is being ignored and a new request is being made. If successful, cache is updated
})

// Collection URL postfix
// The value of the `@path` property will be used as a postfix to your `collection.url`
const d5 = await fetchService.GetData('employee', {
  '@path': 'user_id_or_whatever',
  ...more_props,
});

// Aggregation
// You get a list your collections and their respective results
const d6 = await fetchService.GetData('allInfo');

const d1000 = await fetchService.GetData('some_collection', {we: 'have', many: 'params'});
```

## Changing headers and JWT
```javascript
fetchService.Setup({
  collections: myCollections,
  options: { headers: { no: 'more', hanging: 'wires' } },
  bearer: 'HASH' // or null to disable the header
});
```

## Important note about fetch
You are expected to have `fetch` in your global scope.
