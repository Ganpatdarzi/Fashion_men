function errorHandler(err, req, res, next) {
  if (err.name === "MulterError") {
    const msg = err.code === "LIMIT_FILE_SIZE" ? "File too large (max 5MB)" : `Upload error: ${err.message}`;
    return res.status(400).json({ error: msg });
  }

  if (err.name === "PrismaClientKnownRequestError") {
    if (err.code === "P2025") return res.status(404).json({ error: "Resource not found" });
    if (err.code === "P2002") return res.status(409).json({ error: "Duplicate value" });
    if (err.code === "P2003") return res.status(400).json({ error: "Related record missing" });
  }

  const status = err.status || 500;
  if (status >= 500) {
    console.error(err.stack);
    return res.status(status).json({ error: "Internal server error" });
  }
  res.status(status).json({ error: err.message });
}

module.exports = errorHandler;
