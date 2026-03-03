// ============================================
// AUTHENTICATION FUNCTIONS
// ============================================

// SIGN IN FUNCTION
async function signIn(email, password) {
  try {
    console.log('Attempting to sign in:', email);
    
    const { data, error } = await window.supabase.auth.signInWithPassword({
      email: email,
      password: password
    });

    if (error) {
      console.error('Sign in error:', error.message);
      return { success: false, error: error.message };
    }

    console.log('Sign in successful');
    localStorage.setItem('user_id', data.user.id);
    return { success: true, user: data.user };
  } catch (error) {
    console.error('Unexpected error:', error);
    return { success: false, error: error.message };
  }
}

// SIGN UP FUNCTION
async function signUp(email, password, fullName) {
  try {
    console.log('Attempting to sign up:', email);
    
    // Step 1: Create auth user
    const { data, error } = await window.supabase.auth.signUp({
      email: email,
      password: password
    });

    if (error) {
      console.error('Signup error:', error.message);
      return { success: false, error: error.message };
    }

    // Step 2: Create user profile
    const { error: profileError } = await window.supabase
      .from('user_profiles')
      .insert([{
        id: data.user.id,
        email: email,
        full_name: fullName
      }]);

    if (profileError) {
      console.error('Profile creation error:', profileError.message);
      return { success: false, error: profileError.message };
    }

    console.log('Signup successful');
    return { 
      success: true, 
      message: 'Account created! Check your email to verify.',
      user: data.user
    };
  } catch (error) {
    console.error('Unexpected error:', error);
    return { success: false, error: error.message };
  }
}

// SIGN OUT FUNCTION
async function signOut() {
  try {
    const { error } = await window.supabase.auth.signOut();
    
    if (error) {
      console.error('Sign out error:', error.message);
      return { success: false, error: error.message };
    }

    localStorage.removeItem('user_id');
    return { success: true };
  } catch (error) {
    console.error('Unexpected error:', error);
    return { success: false, error: error.message };
  }
}