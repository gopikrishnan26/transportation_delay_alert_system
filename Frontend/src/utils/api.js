export const updateBusLocation = async (token, busId, location) => {
  const response = await fetch(`${process.env.REACT_APP_API_BASE_URL}/bus/update-location`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ busId, location }),
  });
  return response.json();
};