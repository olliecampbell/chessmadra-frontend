import React, { useCallback, useEffect, useMemo, useRef } from 'react'
import {
  Text,
  Platform,
  Pressable,
  useWindowDimensions,
  View,
  Modal as NativeModal
} from 'react-native'
// import { ExchangeRates } from "app/ExchangeRate";
import { c, s } from 'app/styles'
import { Spacer } from 'app/Space'

export const Modal = ({
  onClose,
  visible,
  children
}: {
  onClose: () => void
  visible
  children: any
}) => {
  return (
    <NativeModal
      animationType="fade"
      transparent={true}
      visible={visible}
      onRequestClose={() => {
        onClose()
      }}
    >
      <Pressable
        onPress={() => {
          onClose()
        }}
        style={s(c.center, { flex: 1 }, c.bg('hsla(0, 0%, 0%, .5)'), c.br(2))}
      >
        <Pressable
          onPress={(e) => {
            e.stopPropagation()
          }}
          style={s(
            c.bg(c.grays[15]),
            c.br(2),
            c.column,
            c.unclickable,
            c.width(400),
            c.maxWidth('calc(100% - 50px)')
          )}
        >
          {children}
        </Pressable>
      </Pressable>
    </NativeModal>
  )
}
