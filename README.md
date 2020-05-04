# fetch-her
Simple data fetching service for REST APIs

## Purpose
I built this tool for my own needs. It's far from perfect but it's been serving me well over a handful of projects with different depth and requirements. JWT Bearer implementation looking into localStorage.Bearer. Sue me.

## Usage

### Add to your project
```javascript
const FetchService = require('fetch-her');
```

### Define your collections / end-points
```javascript
const myCollections = {
  employees: {
    url: 'http://dummy.restapiexample.com/api/v1/employees',
    cache: 'ram', // OPTIONAL PARAMETER. 'ram' is the only accepted value at this time
    method: 'GET',
  },
  employee: {
    url: 'http://dummy.restapiexample.com/api/v1/employee/',
    method: 'GET',
    noTransform: true,
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
  // Skip transformation of params and use your custom string instead.
  // NOTE: You must use {text: 'Your_string_here'} for this to work
  // Example: await dataService.GetData('aboutStuff', {text: 'oh/yeah/215'})
  doThingA: {
    url: '/do_thing_a',
    method: 'POST',
    noTransform: true,
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

### Actual usage
```javascript
const fetchService = new FetchService(myCollections);

// Now, let's observe

const d1 = await fetchService.GetData('employees'); // {status: "success", data: Array(24)}
const d2 = await fetchService.GetData('employee', {text: '1'}); // {message: "Oops! someting issue found to fetch record.", error: 1, data: null}

// Cache
// This is the same as d1. Since collection `employees` is being cached (look at its definition up there), no second request is being initiated
const d3 = await fetchService.GetData('employees');

// Refresh cache
// The following will cause a new request and will (provided there are no errors) refresh the cache itself
const d4 = await fetchService.GetData('employees', {_refresh: true});

// Aggregation
// You get a list your collections and their respective results
const d5 = await fetchService.GetData('allInfo');

const d1000 = await fetchService.GetData('some_collection', {we: 'have', many: 'params'});
```

## TBD
As mentioned above, current JWT implementation kind of sucks and is hardcoded. The plan is to fix it as soon as I find the time.
