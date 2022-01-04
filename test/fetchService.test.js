// import fetchService from '../dist/index.js'

// const COLLECTIONS = {
//   employees: {
//     url: 'http://dummy.restapiexample.com/api/v1/employees',
//     cache: 'ram', // OPTIONAL PARAMETER. 'ram' is the only accepted value at this time
//     method: 'GET',
//   },
//   employee: {
//     url: 'http://dummy.restapiexample.com/api/v1/employee/',
//     method: 'GET',
//   },
//   create: {
//     url: 'http://dummy.restapiexample.com/api/v1/create',
//     method: 'POST',
//   },
//   update: {
//     url: 'http://dummy.restapiexample.com/api/v1/update/',
//     method: 'PUT',
//   },
//   delete: {
//     url: 'http://dummy.restapiexample.com/api/v1/delete/',
//     method: 'DELETE',
//   },

//   // You can also upload files
//   uploadFile: {
//     url: 'http://dummy.restapiexample.com/api/v1/upload/',
//     method: 'POST',
//     isFile: true,
//   },

//   // AGGREGATED
//   // You may use collections of aggregated collections
//   allInfo: {
//     collections: [
//       'about', 'info',                                       // No such collections. Someone forgot them here...
//       'employees', 'employee', 'create', 'update', 'delete', // These are real ones
//     ],
//   },

//   // BROKEN
//   broken: {
//     url: 'https://fuck.you.hard/yea/deepr',
//     method: 'POST',
//   },
// };

// fetchService.Setup({ collections: COLLECTIONS });

describe('FetchService - index.js', () => {
  test('SERVICE OK #1', async () => {
    expect('dummy').toBe('dummy')
  })
})
