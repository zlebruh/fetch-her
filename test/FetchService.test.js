const FetchService = require('../index');

const COLLECTIONS = {
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

  // BROKEN
  broken: {
    url: 'https://fuck.you.hard/yea/deepr',
    method: 'POST',
  },
};

const fetchService = new FetchService(COLLECTIONS);

test('Use unexisting collection', async () => {
  const request = await fetchService.GetData('erroneousNameHere');
  expect(request.data).toBe(null);
});

test('Use existing collection', async () => {
  const request = await fetchService.GetData('employees');
  const { data } = request;
  
  expect(data).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        id: '22',
        employee_name: 'Yuri Berry',
        employee_salary: '675000',
        employee_age: '40',
        profile_image: '',
      })
    ])
  );
});

test('Use combined collection', async () => {
  const data = await fetchService.GetData('allInfo', {we: 'have', many: 'params'});
  const ANY = expect.anything();

  expect(data).toEqual(
    expect.objectContaining({
      'about': ANY,
      'info': ANY,
      'employees': ANY,
      'employee': ANY,
      'create': ANY,
      'update': ANY,
      'delete': ANY,
    })
  );
});

test('Use BROKEN HOST collection', async () => {
  const request = await fetchService.GetData('broken');
  expect(request.data).toEqual(null);
});
