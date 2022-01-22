import { c } from 'app/styles'
import React from 'react'
import { Pressable, View, Text, Animated } from 'react-native'
const AnimatedPressable = Animated.createAnimatedComponent(Pressable)

export const Button = ({ onPress, style, children }) => {
  let inner = children
  if (typeof inner === 'string') {
    inner = <Text style={style.textStyles}>{inner}</Text>
  }
  return (
    <AnimatedPressable style={style} onPress={onPress}>
      {inner}
    </AnimatedPressable>
  )
}
