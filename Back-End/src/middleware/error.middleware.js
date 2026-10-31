const logger = require('../utils/logger');

const errorMiddleware = (err, req, res, next) => {
  logger.error('Global Error caught:', err);

  const isMalformedJson = err instanceof SyntaxError && err.status === 400 && Object.prototype.hasOwnProperty.call(err, 'body');
  const isUploadError = err.name === 'MulterError' || err.code === 'LIMIT_FILE_SIZE';
  const statusCode = isMalformedJson || isUploadError ? 400 : (err.statusCode || err.status || (err.code === 'P2002' ? 409 : 500));
  const message = isMalformedJson ? 'Malformed JSON request' : (isUploadError ? 'Invalid upload' : (statusCode >= 500 ? 'Internal Server Error' : (err.code === 'P2002' ? 'A record with these values already exists' : (err.message || 'Request failed'))));

  res.status(statusCode).json({
    message,
    errors: statusCode < 500 ? err.errors || undefined : undefined,
    ...(process.env.NODE_ENV === 'development' ? { stack: err.stack } : {})
  });
};

module.exports = errorMiddleware;
