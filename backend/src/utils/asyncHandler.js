const asyncHandler = (requestHandler) => {
  (req, res, next) => {
    return Promise.resolve(() => {
      requestHandler(req, res, next);
    }).catch((error) => {
      res.status(error.code || 500).json({
        message: error.message,
      });
      next(error);
    });
  };
};

export { asyncHandler };

// Higher-Order Function for Express Error Handling
// This is a wrapper function that eliminates repetitive try/catch blocks in Express route handlers.
// const asyncHandler = (fun) => async (req, res, next) => {
//   try {
//     await fun(req, res, next);
//   } catch (error) {
//     res.status(error.code | 500).json({
//       status: false,
//       message: error.message,
//     });
//   }
// };
