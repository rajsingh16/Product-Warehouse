import React, { useState, useEffect } from 'react';

function App() {
  const [data, setData] = useState([]);

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL}/api/test`)
      .then((response) => response.json())
      .then((data) => setData(data))
      .catch((error) => console.error('Error fetching data:', error));
  }, []);

  return (
    <div>
      <h2>PostgreSQL Data in React</h2>
      <ul>
        {data.map((item, index) => (
          <li key={index}>{item.name}</li> // Replace 'name' with your column
        ))}
      </ul>
    </div>
  );
}

export default App;