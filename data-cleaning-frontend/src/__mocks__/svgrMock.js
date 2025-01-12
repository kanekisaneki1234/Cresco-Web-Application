// __mocks__/svgrMock.js
const React = require('react');
module.exports = {
  __esModule: true,
  default: 'SvgMock',
  ReactComponent: React.forwardRef((props, ref) => (
    <div ref={ref} data-testid="svg-mock" {...props} />
  ))
};