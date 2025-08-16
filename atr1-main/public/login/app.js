const sign_in_btn = document.querySelector("#sign-in-btn");
const sign_up_btn = document.querySelector("#sign-up-btn");
const container = document.querySelector(".container");

sign_up_btn.addEventListener("click", () => {
  container.classList.add("sign-up-mode");
});

sign_in_btn.addEventListener("click", () => {
  container.classList.remove("sign-up-mode");
});

// 添加登录表单提交处理
document.querySelector(".sign-in-form").addEventListener("submit", function(e) {
  e.preventDefault();
  
  const login = this.querySelector('input[type="text"]').value;
  const password = this.querySelector('input[type="password"]').value;
  
  // 发送登录请求
  fetch('/api/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ login, password })
  })
  .then(response => response.json())
  .then(data => {
    if (data.success) {
      alert('登录成功！');
      // 跳转到主页或其他页面
      window.location.href = '/';
    } else {
      alert('登录失败：' + data.message);
    }
  })
  .catch(error => {
    console.error('Error:', error);
    alert('登录过程中出现错误');
  });
});

// 添加发送验证码功能
document.querySelector('.send-code-btn')?.addEventListener('click', function() {
  const phoneInput = document.querySelector('.sign-up-form input[placeholder="手机号"]');
  const phone = phoneInput.value;
  
  if (!phone) {
    alert('请输入手机号');
    return;
  }
  
  // 发送获取验证码请求
  fetch('/api/send-sms', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ phone })
  })
  .then(response => response.json())
  .then(data => {
    if (data.success) {
      alert('验证码已发送，请注意查收');
      // 禁用按钮并开始倒计时
      const button = this;
      button.disabled = true;
      let countdown = 60;
      const originalText = button.textContent;
      const timer = setInterval(() => {
        button.textContent = `${countdown}秒后重发`;
        countdown--;
        if (countdown < 0) {
          clearInterval(timer);
          button.disabled = false;
          button.textContent = originalText;
        }
      }, 1000);
    } else {
      alert('发送失败：' + data.message);
    }
  })
  .catch(error => {
    console.error('Error:', error);
    alert('发送验证码过程中出现错误');
  });
});

// 添加注册表单提交处理
document.querySelector(".sign-up-form").addEventListener("submit", function(e) {
  e.preventDefault();
  
  const username = this.querySelector('input[placeholder="用户名"]').value;
  const phone = this.querySelector('input[placeholder="手机号"]').value;
  const password = this.querySelector('input[placeholder="密码"]').value;
  const confirmPassword = this.querySelector('input[placeholder="确认密码"]').value;
  const smsCode = this.querySelector('input[placeholder="短信验证码"]').value;
  
  // 验证密码和确认密码是否一致
  if (password !== confirmPassword) {
    alert('两次输入的密码不一致，请重新输入');
    return;
  }
  
  // 发送注册请求
  fetch('/api/register', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ 
      username, 
      password, 
      phone, 
      smsCode
    })
  })
  .then(response => response.json())
  .then(data => {
    if (data.success) {
      alert('注册成功！');
      // 切换到登录模式
      container.classList.remove("sign-up-mode");
    } else {
      alert('注册失败：' + data.message);
    }
  })
  .catch(error => {
    console.error('Error:', error);
    alert('注册过程中出现错误');
  });
});