const getIcon = (weatherType) => {
  let weatherStyle

  switch (weatherType) {
    case 'lightrainday':
      weatherStyle = <i className="fas fa-cloud-rain"></i>
      break
    case 'clear':
      weatherStyle = <i className="fas fa-sun"></i>
      break
    case 'mcloudy':
      weatherStyle = <i className="fas fa-cloud"></i>
      break
    case 'cloud':
      weatherStyle = <i className="fas fa-cloud-rain"></i>
      break
    case 'snow':
      weatherStyle = <i className="fa-solid fa-snowflake"></i>
      break
    case 'ts':
      weatherStyle = <i className="fas fa-bolt"></i>
      break
    case 'lightrain':
      weatherStyle = <i className="fas fa-cloud-rain"></i>
      break
    case 'rain':
      weatherStyle = <i className="fas fa-droplet"></i>
      break
    default:
      weatherStyle = <i className="fas fa-sun"></i>
  }
  return weatherStyle
}

const convertToFahrenheit = (celcius) => {
  return (celcius * 9) / 5 + 32
}

const convertToKelvin = (celcius) => {
  return celcius + 273.15
}

const convertUnit = (unit, currentTemp) => {
  let temp
  switch (unit) {
    case 'celcius':
      temp = currentTemp
      break
    case 'fahrenheit':
      temp = convertToFahrenheit(currentTemp)
      break
    case 'kelvin':
      temp = convertToKelvin(currentTemp)
      break
  }
  return temp
}

export { getIcon, convertUnit }
