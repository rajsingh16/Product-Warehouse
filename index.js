import { useEffect, useState } from 'react';

function App() {
  const [profile, setProfile] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL}/api/profile`, {
      method: 'GET',
      credentials: 'include',
    })
      .then(async (response) => {
        const result = await response.json();

        if (!response.ok) {
          throw new Error(result?.message || 'Failed to load profile');
        }

        return result;
      })
      .then((result) => {
        setProfile(result.data);
      })
      .catch((error) => {
        console.error('Profile API error:', error);
        setError(error.message);
      });
  }, []);

  return (
    <div>
      <h2>Profile API Test</h2>

      {error && (
        <p style={{ color: 'red' }}>
          {error}
        </p>
      )}

      {profile && (
        <div>
          <p>Name: {profile.user_name}</p>
          <p>Employee ID: {profile.emp_id}</p>
          <p>Email: {profile.email}</p>
          <p>Mobile: {profile.mobile}</p>
          <p>Designation: {profile.designation}</p>
          <p>Account Type: {profile.user_type}</p>
          <p>Status: {profile.status}</p>
        </div>
      )}
    </div>
  );
}

export default App;