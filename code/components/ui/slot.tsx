import * as React from 'react'

// Lightweight replacement for @radix-ui/react-slot.
// It clones the single child element and merges any props passed to Slot
// onto that child. This preserves the common `asChild` pattern used in
// our UI primitives without pulling the Radix dependency.
export function Slot({ children, ...props }: any) {
  if (!children) return null

  const child = React.Children.only(children) as React.ReactElement

  // Merge props: props passed to Slot should override child's props when
  // there's a conflict. Cast to `any` to satisfy TS in this small helper.
  return React.cloneElement(child, {
    ...(child.props as any),
    ...(props as any),
  })
}

export default Slot
