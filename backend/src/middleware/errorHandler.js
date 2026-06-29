const errorHandler = (err, _req, res, _next) => {
  console.error('[ERROR]', err.message);

  if (err.code === '23505') {
    return res.status(409).json({ error: 'Duplicate entry – this email may already be registered.' });
  }
  if (err.code === '23503') {
    return res.status(400).json({ error: 'Referenced resource not found.' });
  }

  const status = err.status || 500;
  res.status(status).json({
    error  : process.env.NODE_ENV === 'production' ? 'Internal server error.' : err.message,
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
  });
};

module.exports = { errorHandler };
