// Middleware này bắt buộc phải chạy SAU verifyToken
export const isRecruiter = (req, res, next) => {
  // req.user có được là nhờ middleware verifyToken giải mã và gắn vào trước đó
  if (req.user && req.user.role === "recruiter") {
    next(); // Cho phép đi tiếp vào API
  } else {
    return res.status(403).json({
      message:
        "Forbidden: Chỉ nhà tuyển dụng mới có quyền thực hiện hành động này",
    });
  }
};

export const isCandidate = (req, res, next) => {
  if (req.user && req.user.role === "candidate") {
    next();
  } else {
    return res.status(403).json({
      message: "Forbidden: Chỉ ứng viên mới có quyền thực hiện hành động này",
    });
  }
};
