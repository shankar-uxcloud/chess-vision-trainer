"use strict";

/* =====================================================
   CHESS VISION TRAINER — SUPABASE AUTHENTICATION
   Sign in | Sign up | Password reset | Guest | Sign out
   ===================================================== */

// Keep your own Supabase project URL and publishable key.
const CVT_SUPABASE_URL =
  "https://sugnutuorhddsxfqnlpe.supabase.co";

const CVT_SUPABASE_KEY =
  "sb_publishable_NzBEjINDhNSRzUHpmde5zQ_FCUwh4Uh";

(() => {
  const $ = (id) => document.getElementById(id);

  const screen = $("authScreen");
  const guestWelcome = $("guestWelcome");
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
    CVT_SUPABASE_KEY.startsWith("sb_publishable_");

  // Initialize Supabase.
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
  } else {
    console.error(
      "Supabase is unavailable. Check the Supabase CDN script and configuration."
    );
  }

  // Share the authenticated client with the training app's account-rating sync.
  window.CVT_SUPABASE_CLIENT = supabaseClient;

  // Display a message in the authentication screen.
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

  // Switch between sign-in, signup and password-reset forms.
  function switchMode(mode) {
    clearMessage();

    const signInForm = $("signInForm");
    const signUpForm = $("signUpForm");
    const resetForm = $("resetForm");

    if (signInForm) signInForm.hidden = mode !== "signin";
    if (signUpForm) signUpForm.hidden = mode !== "signup";
    if (resetForm) resetForm.hidden = mode !== "reset";

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

    if (!content[mode]) return;

    const title = $("authTitle");
    const description = $("authDescription");

    if (title) title.textContent = content[mode][0];
    if (description) description.textContent = content[mode][1];
  }

  function requireSupabase() {
    if (!supabaseClient) {
      showMessage(
        "Login is unavailable. Check the Supabase URL, publishable key and CDN script in index.html.",
        "error"
      );
      return false;
    }

    return true;
  }

  // Disable buttons while a request is running.
  function setBusy(button, busy, text = "Please wait…") {
    if (!button) return;

    if (busy) {
      if (!button.disabled) {
        button.dataset.originalText = button.textContent;
      }

      button.textContent = text;
      button.disabled = true;
    } else {
      button.textContent =
        button.dataset.originalText || button.textContent;

      button.disabled = false;
      delete button.dataset.originalText;
    }
  }

  // Convert common errors into understandable messages.
  function friendlyError(error) {
    const text = String(
      error?.message || "Something went wrong."
    );

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
      return "Network error. Check your internet connection and Supabase configuration.";
    }

    return text;
  }

  // Enter the chess trainer after authentication or as a guest.
  function enterApp(user = null) {
    window.dispatchEvent(new CustomEvent("cvt:auth-state", {
      detail: { user: user ? { id: user.id, email: user.email || "" } : null }
    }));
    screen.hidden = true;
    if (guestWelcome) guestWelcome.hidden = true;

    if (accountPill) {
      accountPill.hidden = !user;
    }

    // Keep the header CTA and signed-in account pill mutually exclusive.
    const dashboardAuthButton = $("dashboardAuthButton");
    if (dashboardAuthButton) {
      dashboardAuthButton.hidden = Boolean(user);
    }

    if (user && accountLabel) {
      accountLabel.textContent = user.email || "Signed in";
    }

    if (user) {
      sessionStorage.removeItem("cvt-guest-session");
    }
  }


  // Guest mode works without creating an online account.
  function enterGuestMode() {
    sessionStorage.setItem("cvt-guest-session", "true");
    enterApp(null);
    if (guestWelcome) guestWelcome.hidden = false;
  }

  // Guest landing actions: start in the app, try a quick training demo, or sign in.
  $("guestStartJourney")?.addEventListener("click", () => {
    if (guestWelcome) guestWelcome.hidden = true;
    document.querySelector('[data-nav="dashboard"]')?.click();
  });

  $("guestSeeDemo")?.addEventListener("click", () => {
    if (guestWelcome) guestWelcome.hidden = true;
    const quickTrain = document.querySelector('[data-action="quick-train"]');
    if (quickTrain) quickTrain.click();
    else document.querySelector('[data-nav="training"]')?.click();
  });

  $("guestSignIn")?.addEventListener("click", () => {
    if (guestWelcome) guestWelcome.hidden = true;
    screen.hidden = false;
    screen.style.visibility = "visible";
    switchMode("signin");
  });

  // Return to the login screen.
  function showLogin() {
    screen.hidden = false;
    screen.style.visibility = "visible";

    if (accountPill) {
      accountPill.hidden = true;
    }
    const dashboardAuthButton = $("dashboardAuthButton");
    if (dashboardAuthButton) dashboardAuthButton.hidden = false;

    switchMode("signin");
  }


  // Open login from the dashboard top bar.
  $("dashboardAuthButton")?.addEventListener("click", () => {
    screen.hidden = false;
    screen.style.visibility = "visible";
    switchMode("signin");
  });

  // Switch to signup.

  // Switch to signup.
  $("showSignup")?.addEventListener("click", () => {
    switchMode("signup");
  });

  // Switch back to sign-in.
  $("showSignin")?.addEventListener("click", () => {
    switchMode("signin");
  });

  // Open password reset and reuse the entered email.
  $("showForgot")?.addEventListener("click", () => {
    const loginEmail = $("loginEmail");
    const resetEmail = $("resetEmail");

    if (loginEmail && resetEmail) {
      resetEmail.value = loginEmail.value.trim();
    }

    switchMode("reset");
  });

  $("backToSignin")?.addEventListener("click", () => {
    switchMode("signin");
  });

  // Show/hide password fields.
  document
    .querySelectorAll("[data-toggle-password]")
    .forEach((button) => {
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

  // Continue as guest.
  $("continueGuest")?.addEventListener("click", () => {
    enterGuestMode();
  });

  // SIGN IN.
  $("signInForm")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    clearMessage();

    if (!requireSupabase()) return;

    const email = $("loginEmail")?.value.trim();
    const password = $("loginPassword")?.value;
    const button = $("signInButton");

    if (!email || !password) {
      showMessage("Enter your email and password.", "error");
      return;
    }

    setBusy(button, true, "Signing in…");

    try {
      const { data, error } =
        await supabaseClient.auth.signInWithPassword({
          email,
          password
        });

      if (error) throw error;

      if (data?.user) {
        sessionStorage.removeItem("cvt-guest-session");
        enterApp(data.user);
      } else {
        showMessage(
          "Login could not be completed. Please try again.",
          "error"
        );
      }
    } catch (error) {
      showMessage(friendlyError(error), "error");
    } finally {
      setBusy(button, false);
    }
  });

  // CREATE ACCOUNT.
  $("signUpForm")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    clearMessage();

    if (!requireSupabase()) return;

    const email = $("signupEmail")?.value.trim();
    const password = $("signupPassword")?.value;
    const displayName = $("signupName")?.value.trim() || "";
    const button = $("signUpButton");

    if (!email || !password) {
      showMessage("Enter your email and password.", "error");
      return;
    }

    if (password.length < 6) {
      showMessage(
        "Your password must contain at least 6 characters.",
        "error"
      );
      return;
    }

    setBusy(button, true, "Creating account…");

    try {
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

      if (data?.session && data?.user) {
        sessionStorage.removeItem("cvt-guest-session");
        enterApp(data.user);
      } else {
        switchMode("signin");

        const loginEmail = $("loginEmail");
        if (loginEmail) loginEmail.value = email;

        showMessage(
          "Account created! Check your email for a confirmation link. Confirm your email, then sign in.",
          "info"
        );
      }
    } catch (error) {
      showMessage(friendlyError(error), "error");
    } finally {
      setBusy(button, false);
    }
  });

  // FORGOT PASSWORD.
  $("resetForm")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    clearMessage();

    if (!requireSupabase()) return;

    const email = $("resetEmail")?.value.trim();
    const button = $("resetForm")?.querySelector(
      'button[type="submit"]'
    );

    if (!email) {
      showMessage("Enter your email address.", "error");
      return;
    }

    setBusy(button, true, "Sending link…");

    try {
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

  // SIGN OUT.
  $("authSignOut")?.addEventListener("click", async () => {
    if (!supabaseClient) {
      sessionStorage.removeItem("cvt-guest-session");
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

  // RESTORE SESSION ON PAGE LOAD.
  async function restoreSession() {
    if (!supabaseClient) {
      if (sessionStorage.getItem("cvt-guest-session") === "true") {
        enterApp(null);
      } else {
        screen.hidden = false;
        switchMode("signin");

        showMessage(
          "Supabase is unavailable. Check the project URL, publishable key and Supabase script in index.html. Guest mode is available.",
          "error"
        );
      }

      return;
    }

    try {
      const { data, error } =
        await supabaseClient.auth.getSession();

      if (error) throw error;

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
    } catch (error) {
      console.error("Could not restore Supabase session:", error);

      screen.hidden = false;
      switchMode("signin");

      showMessage(
        "Unable to restore your session. Please try signing in again.",
        "error"
      );
    }

    supabaseClient.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        enterApp(session.user);
      } else if (event === "SIGNED_OUT") {
        window.dispatchEvent(new CustomEvent("cvt:auth-state", { detail: { user: null } }));
        sessionStorage.removeItem("cvt-guest-session");
        showLogin();
      }
    });
  }
  // Wait for the chess loading animation before revealing login.
  screen.style.visibility = "hidden";

  let cvtPreloaderDone = false;

  window.addEventListener("cvt:preloader-finished", () => {
    cvtPreloaderDone = true;

    if (!screen.hidden) {
      screen.style.visibility = "visible";
    }
  });

  // Restore the existing session exactly once.
  restoreSession().then(() => {
    if (cvtPreloaderDone && !screen.hidden) {
      screen.style.visibility = "visible";
    }
  }).catch((error) => {
    console.error("Authentication startup failed:", error);
    screen.hidden = false;

    if (cvtPreloaderDone) {
      screen.style.visibility = "visible";
    }
  });

})();
