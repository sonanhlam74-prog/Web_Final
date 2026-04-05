$(document).ready(function () {
  $("#registerForm").on("submit", async function (e) {
    e.preventDefault();

    if (!window.Auth) {
      alert("Hệ thống xác thực chưa được tải.");
      return;
    }

    const email = $("#email").val().trim();
    const password = $("#password").val();
    const confirmPassword = $("#confirmPassword").val();

    const msg = $("#registerMessage");
    msg.addClass("d-none").removeClass("alert-danger alert-success alert-info");

    if (password !== confirmPassword) {
      msg.text("Mật khẩu xác nhận không khớp.").addClass("alert-danger").removeClass("d-none");
      return;
    }

    const res = await Auth.register({ email, password });
    if (!res.ok) {
      msg.text(res.message || "Đăng ký thất bại.").addClass("alert-danger").removeClass("d-none");
      return;
    }

    msg.text("Đăng ký thành công! Đang chuyển trang...").addClass("alert-success").removeClass("d-none");
    setTimeout(() => {
      window.location.href = "../Login/login.html";
    }, 1500);
  });

  // Toggle password visibility
  $("#togglePasswordBtn").on("change", function () {
    const passwordInput = $("#password");
    if ($(this).is(":checked")) {
      passwordInput.attr("type", "text");
    } else {
      passwordInput.attr("type", "password");
    }
  });

  // Toggle confirm password visibility
  $("#toggleConfirmPasswordBtn").on("change", function () {
    const passwordInput = $("#confirmPassword");
    if ($(this).is(":checked")) {
      passwordInput.attr("type", "text");
    } else {
      passwordInput.attr("type", "password");
    }
  });
});
