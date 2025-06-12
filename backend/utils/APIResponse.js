const APIresponse = {
  suceess(res, data = {}, message = "success", status = 200) {
    console.log("API call Success");
    res.status(status).json({
      success: true,
      message,
      data,
    });
  },
  error(res, error = {}, message = "Something with wrong", status = 500) {
    console.error("API call Failed", error);
    res.status(status).json({
      success: false,
      message,
      error: error?.message || error,
    });
  },
};

module.exports = APIresponse;
