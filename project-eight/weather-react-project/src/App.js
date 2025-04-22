import { useEffect, useState } from 'react'
import TodayDisplay from './components/TodayDisplay'
import Card from './components/Card'
import UnitContainer from './components/UnitContainer'

const App = () => {
  // Keep track of location, error, weather data, and unit preference
  const [location, setLocation] = useState(null)
  const [error, setError] = useState(null)
  const [data, setData] = useState(null)
  const [unit, setUnit] = useState('celcius')
  // Add loading state - start as true since we fetch on load
  const [loading, setLoading] = useState(true)

  // Function to fetch weather data based on coordinates
  const fetchData = (coords) => {
    const latitude = coords?.latitude
    const longitude = coords?.longitude

    // Ensure we have coordinates before fetching
    if (!latitude || !longitude) {
      setError('Could not get coordinates for fetching weather.')
      setLoading(false) // Stop loading if coordinates are missing
      return
    }

    // Set loading to true before starting the fetch
    setLoading(true)
    setError(null) // Clear previous errors

    fetch(
      // Use HTTPS for API calls if available, otherwise stick to HTTP if required by the API
      `https://www.7timer.info/bin/api.pl?lon=${longitude}&lat=${latitude}&product=civillight&output=json`
      // Note: Switched to HTTPS assuming the API supports it. If not, revert to http.
    )
      .then((response) => {
        if (!response.ok) {
          // Handle HTTP errors (e.g., 404, 500)
          throw new Error(`HTTP error! status: ${response.status}`)
        }
        return response.json()
      })
      .then((json) => {
        setData(json)
        // Successfully fetched data, stop loading
        setLoading(false)
      })
      .catch((err) => {
        console.error('Fetch Error:', err)
        setError(`Failed to fetch weather data. ${err.message}`)
        // Fetch failed, stop loading
        setLoading(false)
        setData(null) // Clear potentially stale data on error
      })
  }

  // Function to get user's location
  const getLocation = () => {
    // Reset states before trying to get location
    setError(null)
    setLoading(true)
    setData(null)
    setLocation(null)

    if (!navigator.geolocation) {
      setError('Location API is not supported by your browser')
      setLoading(false) // Stop loading if geolocation isn't supported
    } else {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          // Successfully got location, now fetch data
          setLocation(position.coords)
          fetchData(position.coords) // Pass coords directly to fetchData
        },
        (geoError) => {
          // Failed to get location
          console.error('Geolocation Error:', geoError)
          // Provide more specific error messages if possible
          switch (geoError.code) {
            case geoError.PERMISSION_DENIED:
              setError('Location permission denied. Please enable location services.')
              break
            case geoError.POSITION_UNAVAILABLE:
              setError('Location information is unavailable.')
              break
            case geoError.TIMEOUT:
              setError('The request to get user location timed out.')
              break
            default:
              setError('An unknown error occurred while getting location.')
              break
          }
          setLoading(false) // Stop loading on geolocation error
        },
        // Optional: Add options like timeout or maximumAge
        { timeout: 10000 }
      )
    }
  }

  // Run getLocation once when the component mounts
  useEffect(() => {
    getLocation()
    // Intentionally empty dependency array to run only once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Handler for changing temperature units
  const handleClick = (e) => {
    setUnit(e.target.id)
  }

  // --- Conditional Rendering Logic ---

  // 1. Show loading indicator
  if (loading) {
    return (
      <div className="weather-app loading">
        <p>Loading weather data...</p>
        {/* You could add a spinner icon here */}
      </div>
    )
  }

  // 2. Show error message if something went wrong
  if (error) {
    return (
      <div className="weather-app error">
        <p className="error-message">{error}</p>
        {/* Optionally add a button to retry fetching location */}
        <button onClick={getLocation} className="retry-button">Try Again</button>
      </div>
    )
  }

  // 3. Show weather data if loading is finished and there's no error
  // Ensure data and data.dataseries exist before trying to access them
  if (data && data.dataseries) {
    return (
      <div className="weather-app">
        {/* Pass location only if needed by TodayDisplay */}
        <TodayDisplay today={data.dataseries[0]} location={location} />
        <div className="cards-container">
          {data.dataseries.map((day, index) => (
            <Card key={index} day={day} index={index} unit={unit} />
          ))}
        </div>
        <UnitContainer handleClick={handleClick} unit={unit} />
      </div>
    )
  }

  // Fallback case (should ideally not be reached with the current logic,
  // but good practice to have a default return)
  return (
    <div className="weather-app">
      <p>Unable to display weather information.</p>
    </div>
  )
}

export default App
