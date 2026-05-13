import pool from "../libs/db.js";
import bcrypt from "bcryptjs";

export const getMe = async (req, res) => {
  try {
    const user = req.user;
    return res.status(200).json(user);
  } catch (error) {
    console.log("Lỗi khi gọi authMe", error);
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

export const getUserById = async (req, res) => {
  try {
    const targetId = req.params.id;
    const [users] = await pool.query(
      "SELECT id, name, email, role, createdAt FROM users WHERE id = ?",
      [targetId],
    );

    if (users.length === 0) {
      return res.status(404).json({ message: "Not found" });
    }

    res.json({ user: users[0] });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// 3. CẬP NHẬT THÔNG TIN CÁ NHÂN
export const updateProfile = async (req, res) => {
  try {
    const userId = req.user.id; // Lấy ID từ Token
    const { name, phone } = req.body;

    // Kỹ thuật cập nhật động (chỉ cập nhật trường có gửi lên)
    const updates = [];
    const values = [];

    if (name) {
      updates.push("name = ?");
      values.push(name);
    }

    // Kiểm tra undefined để cho phép người dùng xóa sđt (gửi lên chuỗi rỗng "")
    if (phone !== undefined) {
      updates.push("phone = ?");
      values.push(phone);
    }

    if (updates.length === 0) {
      return res
        .status(400)
        .json({ message: "Không có dữ liệu nào để cập nhật" });
    }

    // Đẩy userId vào cuối mảng để dùng cho WHERE
    values.push(userId);

    const sql = `UPDATE users SET ${updates.join(", ")} WHERE id = ?`;
    await pool.query(sql, values);

    // Lấy lại thông tin user sau khi cập nhật để trả về cho Frontend
    const [updatedUsers] = await pool.query(
      "SELECT id, name, email, phone, role FROM users WHERE id = ?",
      [userId],
    );

    res.status(200).json({
      message: "Cập nhật thông tin thành công!",
      user: updatedUsers[0],
    });
  } catch (error) {
    console.error("Lỗi cập nhật user:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// 4. ĐỔI MẬT KHẨU
export const changePassword = async (req, res) => {
  try {
    const userId = req.user.id;
    const { oldPassword, newPassword, confirmPassword } = req.body;

    // 1. Kiểm tra xem người dùng đã nhập đủ chưa
    if (!oldPassword || !newPassword || !confirmPassword) {
      return res
        .status(400)
        .json({ message: "Vui lòng nhập đầy đủ thông tin" });
    }

    // 2. Kiểm tra mật khẩu mới và xác nhận có khớp nhau không
    if (newPassword !== confirmPassword) {
      return res
        .status(400)
        .json({ message: "Mật khẩu mới và xác nhận không khớp" });
    }

    // 3. Lấy mật khẩu cũ (đã mã hóa) từ database
    const [users] = await pool.query(
      "SELECT password FROM users WHERE id = ?",
      [userId],
    );
    if (users.length === 0) {
      return res.status(404).json({ message: "Người dùng không tồn tại" });
    }

    const currentHashedPassword = users[0].password;

    // 4. So sánh mật khẩu cũ người dùng nhập với mật khẩu trong DB
    const isMatch = await bcrypt.compare(oldPassword, currentHashedPassword);
    if (!isMatch) {
      return res
        .status(400)
        .json({ message: "Mật khẩu hiện tại không chính xác" });
    }

    // 5. Nếu đúng, tiến hành băm (hash) mật khẩu mới
    const salt = await bcrypt.genSalt(10);
    const newHashedPassword = await bcrypt.hash(newPassword, salt);

    // 6. Lưu mật khẩu mới vào DB
    await pool.query("UPDATE users SET password = ? WHERE id = ?", [
      newHashedPassword,
      userId,
    ]);

    res.status(200).json({ message: "Đổi mật khẩu thành công!" });
  } catch (error) {
    console.error("Lỗi đổi mật khẩu:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
