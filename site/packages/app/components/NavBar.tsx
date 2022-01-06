import {
  Text,
  Platform,
  Pressable,
  useWindowDimensions,
  View,
  Modal
} from 'react-native'
import React from 'react'
import { c, s } from 'app/styles'
import { Spacer } from 'app/Space'
import { useRouter } from 'next/router'
import { intersperse } from 'app/utils/intersperse'
import { useIsMobile } from '../utils/isMobile'

const navItems = [
  {
    path: '/the_climb',
    title: 'The Climb'
  },
  {
    path: '/',
    title: 'Visualization'
  },
  {
    path: '/color_trainer',
    title: 'Colors'
  }
]
export const NavBar = (props: {}) => {
  const router = useRouter()
  const isMobile = useIsMobile()
  return (
    <View
      style={s(
        c.row,
        c.px(16),
        c.alignCenter,
        c.justifyCenter,
        c.height(isMobile ? 64 : 72)
      )}
    >
      {intersperse(
        navItems.map((navItem) => {
          const isActive = router.asPath == navItem.path
          return (
            <Pressable
              key={navItem.title}
              style={s(c.clickable)}
              onPress={() => {
                router.push(navItem.path)
              }}
            >
              <Text
                style={s(
                  c.fg(c.colors.textPrimary),
                  c.weightBold,
                  c.fontSize(isMobile ? 14 : 16),
                  c.pb(isMobile ? 2 : 4),
                  isActive && s(c.borderBottom(`2px solid ${c.grays[60]}`))
                )}
              >
                {navItem.title}
              </Text>
            </Pressable>
          )
        }),
        (i) => {
          return <Spacer key={i} width={isMobile ? 24 : 24} />
        }
      )}
    </View>
  )
}
