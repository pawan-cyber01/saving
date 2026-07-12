// auth.js — Firebase Authentication (Email/Password + Google + Forgot Password)

const Auth = {
  renderLogin() {
    document.getElementById('auth-page-outlet').innerHTML = `
      <div class="min-h-screen flex items-center justify-center px-4 py-12 relative overflow-hidden">
        <!-- Background glows -->
        <div class="absolute top-[-20%] left-[-20%] w-[500px] h-[500px] rounded-full opacity-20 blur-3xl" style="background:radial-gradient(circle,#7c3aed,transparent)"></div>
        <div class="absolute bottom-[-20%] right-[-20%] w-[400px] h-[400px] rounded-full opacity-15 blur-3xl" style="background:radial-gradient(circle,#14b8a6,transparent)"></div>

        <div class="w-full max-w-md relative z-10">
          <!-- Logo -->
          <div class="text-center mb-8 animate-fade-in">
            <div class="w-16 h-16 mx-auto mb-4 rounded-3xl logo-gradient flex items-center justify-center shadow-2xl shadow-violet-500/30">
              <svg width="30" height="30" viewBox="0 0 24 24" fill="none"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15v-4H7l5-8v4h4l-5 8z" fill="white"/></svg>
            </div>
            <h1 class="text-3xl font-outfit font-bold gradient-text">SaveLock</h1>
            <p class="text-sm mt-1" style="color:var(--text-secondary)">Your premium savings companion</p>
          </div>

          <!-- Auth Card -->
          <div class="card animate-slide-up" style="padding:32px">
            <!-- Tabs -->
            <div class="tab-container mb-6">
              <button class="tab-btn active" id="tab-login" onclick="Auth.showTab('login')">Sign In</button>
              <button class="tab-btn" id="tab-register" onclick="Auth.showTab('register')">Create Account</button>
            </div>

            <!-- Login Form -->
            <form id="login-form" onsubmit="Auth.login(event)" class="space-y-4">
              <div class="form-group">
                <label class="form-label">Email Address</label>
                <input type="email" id="login-email" class="form-input" placeholder="you@example.com" required autocomplete="email">
              </div>
              <div class="form-group">
                <label class="form-label">Password</label>
                <div class="relative">
                  <input type="password" id="login-password" class="form-input pr-10" placeholder="••••••••" required autocomplete="current-password">
                  <button type="button" onclick="Auth.togglePassword('login-password')" class="absolute right-3 top-1/2 -translate-y-1/2" style="color:var(--text-tertiary)">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                  </button>
                </div>
              </div>
              <div class="text-right">
                <button type="button" onclick="Auth.showForgotPassword()" class="text-sm font-medium" style="color:var(--color-violet);background:none;border:none;cursor:pointer;">
                  Forgot password?
                </button>
              </div>
              <button type="submit" id="login-btn" class="btn-primary w-full justify-center py-3">
                Sign In
              </button>
            </form>

            <!-- Register Form -->
            <form id="register-form" class="space-y-4 hidden" onsubmit="Auth.register(event)">
              <div class="form-group">
                <label class="form-label">Full Name</label>
                <input type="text" id="reg-name" class="form-input" placeholder="Rahul Sharma" required autocomplete="name">
              </div>
              <div class="form-group">
                <label class="form-label">Email Address</label>
                <input type="email" id="reg-email" class="form-input" placeholder="you@example.com" required autocomplete="email">
              </div>
              <div class="form-group">
                <label class="form-label">Password</label>
                <input type="password" id="reg-password" class="form-input" placeholder="Min. 6 characters" required autocomplete="new-password" minlength="6">
              </div>
              <div class="form-group">
                <label class="form-label">Confirm Password</label>
                <input type="password" id="reg-confirm" class="form-input" placeholder="Repeat password" required autocomplete="new-password">
              </div>
              <button type="submit" id="reg-btn" class="btn-primary w-full justify-center py-3">
                Create Account
              </button>
            </form>

            <!-- Forgot Password Form -->
            <div id="forgot-form" class="space-y-4 hidden">
              <div class="text-center mb-4">
                <div class="text-3xl mb-2">🔑</div>
                <p class="text-sm" style="color:var(--text-secondary)">Enter your email and we'll send a reset link</p>
              </div>
              <div class="form-group">
                <label class="form-label">Email Address</label>
                <input type="email" id="forgot-email" class="form-input" placeholder="you@example.com">
              </div>
              <button onclick="Auth.sendReset()" id="reset-btn" class="btn-primary w-full justify-center py-3">
                Send Reset Link
              </button>
              <button onclick="Auth.showTab('login')" class="btn-secondary w-full justify-center">
                Back to Sign In
              </button>
            </div>

            <!-- Divider -->
            <div class="flex items-center gap-3 my-5" id="oauth-divider">
              <div class="flex-1 h-px" style="background:var(--color-border)"></div>
              <span class="text-xs" style="color:var(--text-tertiary)">or continue with</span>
              <div class="flex-1 h-px" style="background:var(--color-border)"></div>
            </div>

            <!-- Google Sign In -->
            <button onclick="Auth.googleSignIn()" id="google-btn" class="btn-secondary w-full justify-center gap-3 py-3">
              <svg width="18" height="18" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
              Continue with Google
            </button>
          </div>

          <p class="text-center text-xs mt-6" style="color:var(--text-tertiary)">
            🔒 Your data is encrypted and secured with Firebase
          </p>
        </div>
      </div>
    `;
  },

  showTab(tab) {
    const isLogin = tab === 'login';
    const isRegister = tab === 'register';
    const isForgot = tab === 'forgot';

    document.getElementById('login-form').classList.toggle('hidden', !isLogin);
    document.getElementById('register-form').classList.toggle('hidden', !isRegister);
    document.getElementById('forgot-form').classList.toggle('hidden', !isForgot);

    document.getElementById('tab-login')?.classList.toggle('active', isLogin);
    document.getElementById('tab-register')?.classList.toggle('active', isRegister);

    const divider = document.getElementById('oauth-divider');
    const googleBtn = document.getElementById('google-btn');
    if (divider) divider.classList.toggle('hidden', isForgot);
    if (googleBtn) googleBtn.classList.toggle('hidden', isForgot);
  },

  showForgotPassword() {
    this.showTab('forgot');
  },

  togglePassword(id) {
    const input = document.getElementById(id);
    if (input) input.type = input.type === 'password' ? 'text' : 'password';
  },

  async login(e) {
    e.preventDefault();
    const email = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value;
    const btn = document.getElementById('login-btn');
    setLoading(btn, true);
    try {
      await AUTH.signInWithEmailAndPassword(email, password);
    } catch(err) {
      showToast(Auth.errorMessage(err), 'error');
      setLoading(btn, false);
    }
  },

  async register(e) {
    e.preventDefault();
    const name = sanitize(document.getElementById('reg-name').value.trim());
    const email = document.getElementById('reg-email').value.trim();
    const password = document.getElementById('reg-password').value;
    const confirm = document.getElementById('reg-confirm').value;

    if (password !== confirm) { showToast('Passwords do not match', 'error'); return; }
    if (password.length < 6) { showToast('Password must be at least 6 characters', 'error'); return; }

    const btn = document.getElementById('reg-btn');
    setLoading(btn, true);
    try {
      const cred = await AUTH.createUserWithEmailAndPassword(email, password);
      await cred.user.updateProfile({ displayName: name });
      showToast('Account created! Welcome to SaveLock 🎉', 'success');
    } catch(err) {
      showToast(Auth.errorMessage(err), 'error');
      setLoading(btn, false);
    }
  },

  async googleSignIn() {
    const btn = document.getElementById('google-btn');
    setLoading(btn, true);
    try {
      const provider = new firebase.auth.GoogleAuthProvider();
      await AUTH.signInWithPopup(provider);
    } catch(err) {
      showToast(Auth.errorMessage(err), 'error');
      setLoading(btn, false);
    }
  },

  async sendReset() {
    const email = document.getElementById('forgot-email').value.trim();
    if (!email) { showToast('Please enter your email', 'warning'); return; }
    const btn = document.getElementById('reset-btn');
    setLoading(btn, true);
    try {
      await AUTH.sendPasswordResetEmail(email);
      showToast('Reset link sent! Check your inbox 📧', 'success');
      setTimeout(() => this.showTab('login'), 2000);
    } catch(err) {
      showToast(Auth.errorMessage(err), 'error');
    } finally { setLoading(btn, false); }
  },

  errorMessage(err) {
    const map = {
      'auth/user-not-found': 'No account found with this email',
      'auth/wrong-password': 'Incorrect password',
      'auth/email-already-in-use': 'Email is already registered',
      'auth/weak-password': 'Password is too weak (min 6 chars)',
      'auth/invalid-email': 'Invalid email address',
      'auth/too-many-requests': 'Too many attempts. Try again later',
      'auth/popup-closed-by-user': 'Sign-in cancelled',
      'auth/network-request-failed': 'Network error. Check your connection',
    };
    return map[err.code] || err.message || 'Authentication failed';
  }
};
