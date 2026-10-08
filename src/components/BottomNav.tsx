import { NavLink } from 'react-router'

const tabs = [
  { to: '/', label: '存档' },
  { to: '/timeline', label: '时间线' },
  { to: '/grid', label: '格子' },
  { to: '/settings', label: '设置' },
]

export default function BottomNav() {
  return (
    <nav className="fixed inset-x-0 bottom-0 border-t border-black/15 bg-white pb-[env(safe-area-inset-bottom)] dark:border-white/20 dark:bg-black">
      <ul className="flex">
        {tabs.map((tab) => (
          <li key={tab.to} className="flex-1">
            <NavLink
              to={tab.to}
              end
              className={({ isActive }) =>
                `block py-3 text-center text-sm ${isActive ? 'font-semibold' : 'opacity-40'}`
              }
            >
              {tab.label}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}
