// Create a component
import React from 'react'
import ReactDOM from 'react-dom'
function Welcome(props) {
  // Add a new useState, isLoading
  const [isLoading, setIsLoading] = useState(true)
  // When isLoading changes to true, print something
  if (isLoading) {
    return <h1>Loading...</h1>
  }
  // When isLoading changes to false, print something
  useEffect(() => {
    setTimeout(() => {
      setIsLoading(false)
    }, 3000)
  }, [])
  const [isLoading, setIsLoading] = useState(true)

  // Return a header with a welcome message, with blue text and a red background
  return (
    <h1 style={{ color: 'blue', backgroundColor: 'red' }}>
      Welcome {props.name}
    </h1>
  )
}

// use react-navigation
import { createAppContainer } from 'react-navigation'
import { createStackNavigator } from 'react-navigation-stack'
const AppNavigator = createStackNavigator({
  Home: {
    screen: Welcome,
  },
})
const AppContainer = createAppContainer(AppNavigator)
function App() {
  return <AppContainer />
}
