import React, { useMemo } from 'react'
import { VariantProps } from 'tailwind-variants'
import type { ClassValue } from 'clsx'
import clsx from 'clsx'
import { twMerge } from 'tailwind-merge'

export interface ComponentMetadata {
  displayName?: string
  defaultProps?: Partial<any>
  id?: string
}

export type Recipe = (...args: any) => any

export type TVSlot2ClassNames<Slots extends string> = Partial<Record<Slots, any>>
export type TVReturn<TVFN extends Recipe> = ReturnType<TVFN>

export type TVSlots<TVFN extends Recipe> = keyof TVReturn<TVFN>

export type TVSlotClassNamesProps<TVFN extends Recipe> =
  TVSlots<TVFN> extends string ? { classNames?: TVSlot2ClassNames<TVSlots<TVFN>> } : object

export type ComposedTVProps<TVFN extends Recipe> = VariantProps<TVFN> & TVSlotClassNamesProps<TVFN>

export type UnstyledProps = {
  unstyled?: boolean
}

export type CtxClassNames<TVFN extends Recipe> =
  ComposedTVProps<TVFN> extends { classNames: any } ? ComposedTVProps<TVFN>['classNames'] : unknown

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function createComponentFactory<TVFN extends Recipe, Slot extends keyof ReturnType<TVFN>>(
  tvFn: TVFN
) {
  const Ctx = React.createContext<{
    variants?: ReturnType<TVFN>
    classNames?: CtxClassNames<TVFN>
  }>({})

  const useCtx = () => React.useContext(Ctx)

  function withRoot<C extends React.ElementType>(Component: C, slot?: Slot) {
    const Comp = React.forwardRef<
      React.ElementRef<C>,
      React.ComponentProps<C> & ComposedTVProps<TVFN> & UnstyledProps
    >(function ({ className, classNames, unstyled, ...props }, ref) {
      const variants = tvFn(props) as any

      const _className = useMemo(
        function () {
          return cn(
            unstyled ? '' : typeof variants === 'string' ? variants : variants?.[slot ?? '']?.(),
            classNames?.[slot],
            className
          )
        },
        [variants, classNames, className, slot, unstyled]
      )

      return (
        <Ctx.Provider value={{ variants, classNames: classNames }}>
          <Component ref={ref} className={_className} {...(props as any)} />
        </Ctx.Provider>
      )
    })
    Comp.displayName = (Component as any).displayName || (Component as any).name
    return Comp
  }

  function withSlot<C extends React.ElementType>(Component: C, slot?: Slot) {
    const Comp = React.forwardRef<
      React.ElementRef<C>,
      React.ComponentProps<C> & VariantProps<TVFN> & UnstyledProps
    >(function ({ className, unstyled, ...props }, ref) {
      const { variants, classNames } = useCtx()

      const _className = useMemo(
        function () {
          return cn(
            slot && !unstyled ? variants?.[slot]?.() : undefined,
            slot ? (classNames as any)?.[slot] : undefined,
            className
          )
        },
        [variants, classNames, className, slot, unstyled]
      )

      return <Component ref={ref} className={_className} {...(props as any)} />
    })

    Comp.displayName = (Component as any).displayName || (Component as any).name || 'Component'
    return Comp
  }

  return {
    withRoot,
    withSlot,
  }
}

export function createComponentTree<
  F extends React.ElementType,
  N extends Readonly<Record<string, React.ElementType | ((...args: any) => any)>>,
>(Factory: F, nestedChildren: Readonly<N>) {
  const c = Factory as F & N
  return Object.assign(c, nestedChildren)
}
