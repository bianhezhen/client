import {StackActions, CommonActions} from '@react-navigation/core'
import shallowEqual from 'shallowequal'
import * as RouteTreeGen from '../actions/route-tree-gen'
import * as Constants from '../constants/router2'
import * as Tabs from '../constants/tabs'
//import {modalRoutes, tabRoots} from './routes'
import logger from '../logger'
// TODO move
import {getActiveKey} from '../router-v2/util'

//const getNumModals = navigation => {
//const path = Constants._getModalStackForNavigator(navigation.state)
//let numModals = 0
//path.reverse().some(p => {
//if (modalRoutes[p.routeName]) {
//numModals++
//return false
//}
//return true
//})
//return numModals
//}

export const mobileTabs = [Tabs.peopleTab, Tabs.chatTab, Tabs.fsTab, Tabs.teamsTab, Tabs.settingsTab]
export const desktopTabs = [
  Tabs.peopleTab,
  Tabs.chatTab,
  Tabs.cryptoTab,
  Tabs.fsTab,
  Tabs.teamsTab,
  Tabs.walletsTab,
  Tabs.gitTab,
  Tabs.devicesTab,
  Tabs.settingsTab,
]

// Helper to convert old route tree actions to new actions. Likely goes away as we make
// actual routing actions (or make RouteTreeGen append/up the only action)
export const oldActionToNewActions = (action: any, navigation: any, allowAppendDupe?: boolean) => {
  switch (action.type) {
    case RouteTreeGen.navigateAppend: {
      if (!navigation) {
        return
      }
      const p = action.payload.path.last
        ? action.payload.path.last()
        : action.payload.path[action.payload.path.length - 1]
      if (!p) {
        return
      }
      let routeName: string | null = null
      let params: any | undefined

      if (typeof p === 'string') {
        routeName = p
      } else {
        routeName = p.selected
        params = p.props
      }

      if (!routeName) {
        return
      }

      const path = Constants._getVisiblePathForNavigator(navigation.state)
      const visible = path[path.length - 1]
      // Just handle this in this reduce, should work
      // if (visible) {
      // if (!allowAppendDupe && routeName === visible.routeName && shallowEqual(visible.params, params)) {
      // console.log('Skipping append dupe')
      // return
      // }
      // }

      // TODO make a navSafe hook, like safe submit
      // if (action.payload.fromKey) {
      // const {fromKey} = action.payload
      // const activeKey = getActiveKey(navigation.getRootState())
      // if (fromKey !== activeKey) {
      // logger.warn('Skipping append on wrong screen')
      // return
      // }
      // }

      if (action.payload.replace) {
        return [StackActions.replace(routeName, params)]
      }

      return [StackActions.push(routeName, params)]
    }
    case RouteTreeGen.switchTab: {
      return [CommonActions.navigate(action.payload.tab)]
    }
    case RouteTreeGen.switchLoggedIn: {
      // TODO remove
      return
      //return [CommonActions.navigate({routeName: action.payload.loggedIn ? 'loggedIn' : 'loggedOut'})]
    }
    case RouteTreeGen.clearModals: {
      // TODO maybe use reset?
      return
      //const numModals = getNumModals(navigation)
      //return numModals ? [StackActions.pop(numModals)] : []
    }
    case RouteTreeGen.navigateUp:
      // TODO key handling
      return [CommonActions.goBack()]
    //return [{...CommonActions.goBack(), source: action.payload.fromKey, target: navigation.state.key}]
    case RouteTreeGen.navUpToScreen: {
      const fullPath = Constants._getFullRouteForNavigator(navigation.state)
      const popActions: Array<unknown> = []
      const isInStack = fullPath.reverse().some(r => {
        if (r.routeName === action.payload.routeName) {
          return true
        }
        popActions.push(StackActions.pop())
        return false
      })
      return isInStack ? popActions : []
    }
    case RouteTreeGen.resetStack: {
      // TODO maybe
      return
      // TODO check for append dupes within these
      //const actions = action.payload.actions.reduce(
      //(arr, a) => [...arr, ...(oldActionToNewActions(a, navigation, true) || [])],
      //// 'loggedOut' is the root
      //action.payload.tab === 'loggedOut'
      //? []
      //: [StackActions.push(tabRoots[action.payload.tab])]
      //)
      //return [
      //StackActions.reset({
      //actions,
      //index: action.payload.index,
      //key: action.payload.tab,
      //}),
      //]
    }
    default:
      return undefined
  }
}
