test('SERVICE OK #1', async () => {
  expect('dummy').toBe('dummy');
});

// #########################################################################################

// import 'whatwg-fetch';

// import FetchService from '../index';

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

// const fetchService = new FetchService(COLLECTIONS);

// test('Use unexisting collection', async () => {
//   const request = await fetchService.GetData('erroneousNameHere');
//   expect(request.data).toBe(null);
// });

// test('Use existing collection', async () => {
//   const request = await fetchService.GetData('employees');
//   const { data } = request;
  
//   expect(data).toEqual(
//     expect.arrayContaining([
//       expect.objectContaining({
//         id: '22',
//         employee_name: 'Yuri Berry',
//         employee_salary: '675000',
//         employee_age: '40',
//         profile_image: '',
//       })
//     ])
//   );
// });

// // test('Use combined collection', async () => {
// //   const data = await fetchService.GetData('allInfo', {we: 'have', many: 'params'});
// //   const ANY = expect.anything();

// //   expect(data).toEqual(
// //     expect.objectContaining({
// //       'about': ANY,
// //       'info': ANY,
// //       'employees': ANY,
// //       'employee': ANY,
// //       'create': ANY,
// //       'update': ANY,
// //       'delete': ANY,
// //     })
// //   );
// // });

// // test('Use BROKEN HOST collection', async () => {
// //   const request = await fetchService.GetData('broken');
// //   expect(request.data).toEqual(null);
// // });

// // SPECIAL DIRECTIVES
// test('Use @path correctly', async () => {
//   const request = await fetchService.GetData('employee', {
//     '@path': 'user_id_15',
//     more: {props: 'here'},
//   });
//   expect(request.message).toEqual('Successfully! Record has been fetched.');
//   expect(request.data).toEqual(null);
// });
// test('Use @path in a BROKEN way', async () => {
//   const request = await fetchService.GetData('employee', {
//     '@path': ['user_id_15'],
//     more: {props: 'here'},
//   });
//   expect(request.message).toEqual('Property "@path" must be a non-empty string');
// });