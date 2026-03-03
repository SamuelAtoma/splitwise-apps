// ============================================
// LOCATION FUNCTIONS
// ============================================

// Get user's GPS location
async function getUserLocation() {
  return new Promise((resolve, reject) => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          console.log('Location retrieved:', latitude, longitude);
          resolve({ latitude, longitude });
        },
        (error) => {
          console.error('Geolocation error:', error);
          reject(error);
        }
      );
    } else {
      reject(new Error('Geolocation not supported by this browser'));
    }
  });
}

// Update user location in database
async function updateUserLocation() {
  try {
    const user = await window.checkAuth();
    if (!user) {
      console.error('User not authenticated');
      return { success: false, error: 'User not authenticated' };
    }

    const location = await getUserLocation();

    const { error } = await window.supabase
      .from('user_profiles')
      .update({
        latitude: location.latitude,
        longitude: location.longitude,
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id);

    if (error) {
      console.error('Location update error:', error);
      return { success: false, error: error.message };
    }

    console.log('Location updated successfully');
    return { success: true, location };
  } catch (error) {
    console.error('Error updating location:', error.message);
    return { success: false, error: error.message };
  }
}