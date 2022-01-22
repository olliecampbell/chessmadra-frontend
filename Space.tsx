import React from 'react'
import { View } from 'react-native'

export const Spacer = ({
  width = null,
  height = null,
  grow = false,
  isMobile = null
}) => {
  let styles: any = { flexGrow: grow ? 1 : 0 }
  if (isMobile === true) {
    styles.height = height
  }
  if (isMobile === false) {
    styles.width = width
  }
  if (height) {
    styles.height = height
  }
  if (width) {
    styles.width = width
  }
  return <View style={styles}></View>
}
