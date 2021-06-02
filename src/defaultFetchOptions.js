const DEFAULT_OPTIONS = {
  mode: 'cors', // no-cors, cors, *same-origin
  // cache: 'no-cache', // *default, no-cache, reload, force-cache, only-if-cached
  credentials: 'same-origin', // include, *same-origin, omit
  headers: {
    'content-type': 'application/json',
    accept: 'application/json',
    // SameSite: 'None',
    // Secure: 'true',
  },
  // redirect: 'follow', // manual, *follow, error
  // referrer: 'no-referrer', // no-referrer, *client
};

export default DEFAULT_OPTIONS;
