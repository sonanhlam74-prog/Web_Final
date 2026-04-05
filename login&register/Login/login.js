$(document).ready(function () {
  function createGuestUser() {
    return {
      id: "guest_" + Date.now(),
      email: "guest@example.com",
      name: "Khach",
      username: "guest",
      displayName: "Khach",
      avatar: "https://ui-avatars.com/api/?name=Guest&background=9ca3af&color=fff",
      role: "guest",
      accumulatedSpend: 0,
    };
  }

  if (window.Auth) {
    // If already logged in, redirect
    const currentUser = Auth.getCurrentUser();
    if (currentUser) {
      const userRole = (currentUser.role || "user").toLowerCase();
      if (userRole === "admin") {
        window.location.href = "../../Tasks/admin.html";
      } else {
        window.location.href = "../../Test app/main.html";
      }
      return; // Stop further execution
    }
  }

  $("#loginForm").on("submit", async function (e) {
    e.preventDefault();
    const email = $("#email").val().trim();
    const password = $("#password").val().trim();

    if (!window.Auth) {
      alert("Hệ thống xác thực chưa được tải.");
      return;
    }

    const res = await Auth.login({ email, password });
    if (res.ok) {
      const userRole = (res.user?.role || "user").toLowerCase();

      const currentUser = JSON.parse(localStorage.getItem("currentUser") || "null");
      if (currentUser) {
        currentUser.role = userRole;
        currentUser.status = res.user?.status || currentUser.status || "active";
        localStorage.setItem("currentUser", JSON.stringify(currentUser));
      }

      if (userRole === "admin") {
        window.location.href = "../../Tasks/admin.html";
      } else {
        window.location.href = "../../Test app/main.html";
      }
    } else {
      $("#loginError").text(res.message).removeClass("d-none");
    }
  });

  $("#guestLoginBtn").on("click", function () {
    const guestUser = createGuestUser();
    localStorage.setItem("currentUser", JSON.stringify(guestUser));
    if (window.Auth?.logout) {
      // Ensure no previous authenticated session blocks guest flow
      window.Auth.logout();
      localStorage.setItem("currentUser", JSON.stringify(guestUser));
    }
    window.location.href = "../../Test app/main.html";
  });

  $("#togglePasswordBtn").on("change", function () {
    const passwordInput = $("#password");
    if ($(this).is(":checked")) {
      passwordInput.attr("type", "text");
    } else {
      passwordInput.attr("type", "password");
    }
  });
});
