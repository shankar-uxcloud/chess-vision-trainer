
"use strict";

/* =====================================================
   CHESS VISION TRAINER — SUPABASE AUTHENTICATION
   Login | Signup | Password reset | Guest | Sign out
   ===================================================== */

/*
  STEP 1:
  Replace these two placeholders with your own Supabase
  Project URL and publishable key.

  NEVER use a service_role or secret key here.
*/

const CVT_SUPABASE_URL = "https://YOUR_PROJECT_ID.supabase.co";
const CVT_SUPABASE_KEY = "YOUR_SUPABASE_PUBLISHABLE_KEY";

(() => {
  const $ = id => document.getElementById(id);

  const screen = $("authScreen");
  const message = $("authMessage");
  const accountPill = $("authAccountPill");
  const accountLabel = $("authAccountLabel");

  if (!screen) {
    console.error(
      "Chess Vision Trainer: authScreen is missing from index.html."
    );
    return;
  }

  let supabaseClient = null;

  const configured =
    CVT_SUPABASE_URL.startsWith("https://") &&
    !CVT_SUPABASE_URL.includes("YOUR_PROJECT_ID") &&
    CVT_SUPABASE_KEY.length > 20 &&
    !CVT_SUPABASE_KEY.includes("YOUR_SUPABASE");

  if (configured && window.supabase?.createClient) {
    try {
      supabaseClient = window.supabase.createClient(
        CVT_SUPABASE_URL,
        CVT_SUPABASE_KEY,
        {
          auth: {
            persistSession: true,
            autoRefreshToken: true,
            detectSessionInUrl: true
          }
        }
      );
    } catch (error) {
      console.error("Supabase initialization failed:", error);
    }
  }

  function showMessage(text, type = "info") {
    if (!message) return;

    message.textContent = text;
    message.dataset.type = type;
    message.hidden = false;
  }

  function clearMessage() {
    if (!message) return;

    message.textContent = "";
    message.hidden = true;
    delete message.dataset.type;
  }

  function switchMode(mode) {
    clearMessage();

    $("signInForm").hidden = mode !== "signin";
    $("signUpForm").hidden = mode !== "signup";
    $("resetForm").hidden = mode !== "reset";

    const content = {
      signin: [
        "Welcome back.",
        "Sign in to enter your chess training space."
      ],
      signup: [
        "Create your account.",
        "Your chess training journey starts here."
      ],
      reset: [
        "Reset password.",
        "We'll send a password reset link to your email."
      ]
    };

    $("authTitle").textContent = content[mode][0];
    $("authDescription").textContent = content[mode][1];
  }

  function requireSupabase() {
    if (!supabaseClient) {
      showMessage(
        "Supabase is not configured. Check the Project URL, publishable key, and Supabase script in index.html.",
        "error"
      );
      return false;
    }

    return true;
  }

  function setBusy(button, busy, text = "Please wait…") {
    if (!button) return;

    if (busy) {
      button.dataset.originalText = button.textContent;
      button.textContent = text;
      button.disabled = true;
    } else {
      button.textContent =
        button.dataset.originalText || button.textContent;
      button.disabled = false;
    }
  }

  function friendlyError(error) {
    const text = String(error?.message || "Something went wrong.");

    if (/invalid login credentials/i.test(text)) {
      return "Incorrect email or password. Please try again.";
    }

    if (/email not confirmed/i.test(text)) {
      return "Please confirm your email using the link sent to your inbox.";
    }

    if (/already registered|user already registered/i.test(text)) {
      return "This email may already have an account. Try signing in.";
    }

    if (/rate limit|too many requests/i.test(text)) {
      return "Too many attempts. Please wait before trying again.";
    }

    if (/failed to fetch|network/i.test(text)) {
      return "Network error. Check your connection and Supabase configuration.";
    }

    return text;
  }

  function enterApp(user = null) {
    screen.hidden = true;

    if (accountPill) {
      accountPill.hidden = !user;
    }

    if (user && accountLabel) {
      accountLabel.textContent = user.email || "Signed in";
    }

    if (user) {
      sessionStorage.removeItem("cvt-guest-session");
    }
  }

  function enterGuestMode() {
    sessionStorage.setItem("cvt-guest-session", "true");
    enterApp(null);
  }

  function showLogin() {
    screen.hidden = false;

    if (accountPill) {
      accountPill.hidden = true;
    }

    switchMode("signin");
  }

  // -----------------------------------------------
  // Switch between sign in, signup and reset forms
  // -----------------------------------------------

  $("showSignup").addEventListener("click", () => {
    switchMode("signup");
  });

  $("showSignin").addEventListener("click", () => {
    switchMode("signin");
  });

  $("showForgot").addEventListener("click", () => {
    $("resetEmail").value = $("loginEmail").value.trim();
    switchMode("reset");
  });

  $("backToSignin").addEventListener("click", () => {
    switchMode("signin");
  });

  // -----------------------------------------------
  // Show / hide passwords
  // -----------------------------------------------

  document.querySelectorAll("[data-toggle-password]").forEach(button => {
    button.addEventListener("click", () => {
      const input = $(button.dataset.togglePassword);

      if (!input) return;

      const show = input.type === "password";
      input.type = show ? "text" : "password";
      button.textContent = show ? "Hide" : "Show";
      button.setAttribute(
        "aria-label",
        show ? "Hide password" : "Show password"
      );
    });
  });

  // -----------------------------------------------
  // Continue as guest
  // Guest mode does not create an online account
  // -----------------------------------------------

  $("continueGuest").addEventListener("click", () => {
    enterGuestMode();
  });

  // -----------------------------------------------
  // Sign in
  // -----------------------------------------------

  $("signInForm").addEventListener("submit", async event => {
    event.preventDefault();
    clearMessage();

    if (!requireSupabase()) return;

    const button = $("signInButton");
    setBusy(button, true, "Signing in…");

    try {
      const { data, error } =
        await supabaseClient.auth.signInWithPassword({
          email: $("loginEmail").value.trim(),
          password: $("loginPassword").value
        });

      if (error) throw error;

      enterApp(data.user);
    } catch (error) {
      showMessage(friendlyError(error), "error");
    } finally {
      setBusy(button, false);
    }
  });

  // -----------------------------------------------
  // Create account
  // -----------------------------------------------

  $("signUpForm").addEventListener("submit", async event => {
    event.preventDefault();
    clearMessage();

    if (!requireSupabase()) return;

    const button = $("signUpButton");
    setBusy(button, true, "Creating account…");

    try {
      const email = $("signupEmail").value.trim();
      const password = $("signupPassword").value;
      const displayName = $("signupName").value.trim();

      if (password.length < 6) {
        throw new Error("Your password must contain at least 6 characters.");
      }

      const { data, error } = await supabaseClient.auth.signUp({
        email,
        password,
        options: {
          data: {
            display_name: displayName
          },
          emailRedirectTo:
            window.location.origin + window.location.pathname
        }
      });

      if (error) throw error;

      if (data.session && data.user) {
        enterApp(data.user);
      } else {
        // Switch first, then display the confirmation message.
        switchMode("signin");
        $("loginEmail").value = email;

        showMessage(
          "Account created! Check your email for a confirmation link. After confirming, return here to sign in.",
          "info"
        );
      }
    } catch (error) {
      showMessage(friendlyError(error), "error");
    } finally {
      setBusy(button, false);
    }
  });

  // -----------------------------------------------
  // Forgot password
  // -----------------------------------------------

  $("resetForm").addEventListener("submit", async event => {
    event.preventDefault();
    clearMessage();

    if (!requireSupabase()) return;

    const button =
      $("resetForm").querySelector('button[type="submit"]');

    setBusy(button, true, "Sending link…");

    try {
      const email = $("resetEmail").value.trim();

      const { error } =
        await supabaseClient.auth.resetPasswordForEmail(email, {
          redirectTo:
            window.location.origin + window.location.pathname
        });

      if (error) throw error;

      showMessage(
        "If an account exists for that email, a password reset link will be sent. Check your inbox and spam folder.",
        "info"
      );
    } catch (error) {
      showMessage(friendlyError(error), "error");
    } finally {
      setBusy(button, false);
    }
  });

  // -----------------------------------------------
  // Sign out
  // -----------------------------------------------

  $("authSignOut").addEventListener("click", async () => {
    if (!supabaseClient) {
      showLogin();
      return;
    }

    const button = $("authSignOut");
    button.disabled = true;

    try {
      const { error } = await supabaseClient.auth.signOut();

      if (error) throw error;

      sessionStorage.removeItem("cvt-guest-session");
      showLogin();
    } catch (error) {
      console.error("Sign out failed:", error);
      showMessage(friendlyError(error), "error");
    } finally {
      button.disabled = false;
    }
  });

  // -----------------------------------------------
  // Restore login session on page load
  // -----------------------------------------------

  async function restoreSession() {
    if (!supabaseClient) {
      if (sessionStorage.getItem("cvt-guest-session") === "true") {
        enterApp(null);
      } else {
        screen.hidden = false;
        switchMode("signin");

        showMessage(
          "Add your Supabase Project URL and publishable key to auth.js to enable real login. Guest mode is available.",
          "error"
        );
      }

      return;
    }

    const { data, error } = await supabaseClient.auth.getSession();

    if (error) {
      console.error("Could not restore Supabase session:", error);
    }

    if (data?.session?.user) {
      enterApp(data.session.user);
    } else if (
      sessionStorage.getItem("cvt-guest-session") === "true"
    ) {
      enterApp(null);
    } else {
      screen.hidden = false;
      switchMode("signin");
    }

    supabaseClient.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        enterApp(session.user);
      } else if (event === "SIGNED_OUT") {
        showLogin();
      }
    });
  }

  restoreSession();
})();
