const errorHandler = (err, req, res, next) => {
  console.error("Error:", err);

  // Default error
  let error = {
    status: err.status || 500,
    message: err.message || "Internal Server Error",
    service: "api-gateway",
  };

  // JWT errors
  if (err.name === "JsonWebTokenError") {
    error.status = 401;
    error.message = "Invalid token";
  } else if (err.name === "TokenExpiredError") {
    error.status = 401;
    error.message = "Token expired";
  }

  // Validation errors
  if (err.isJoi) {
    error.status = 400;
    error.message = err.details[0].message;
  }

  res.status(error.status).json(error);
};

module.exports = { errorHandler };
