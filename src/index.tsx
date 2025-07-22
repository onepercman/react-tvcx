/**
 * React TVCX - A utility library for building React components with Tailwind CSS
 * This file contains all the core functionality for the library
 */

import type { ClassValue } from 'clsx'
import clsx from 'clsx'
import React from 'react'
import { twMerge } from 'tailwind-merge'
import { tv, type VariantProps } from 'tailwind-variants'

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Combines multiple class names using clsx and tailwind-merge
 * @param inputs - Class names to be combined
 * @returns Merged class names string
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// ============================================================================
// Forward Ref Types and Utilities
// ============================================================================

export type As<BaseProps = any> = React.ElementType<BaseProps>

export type PropsWithAs<ComponentType extends As, ComponentProps> = ComponentProps &
  Omit<React.ComponentPropsWithRef<ComponentType>, 'as' | keyof ComponentProps> & {
    as?: ComponentType
  }

export type PropsFromAs<ComponentType extends As, ComponentProps> = (PropsWithAs<
  ComponentType,
  ComponentProps
> & { as: ComponentType }) &
  PropsWithAs<ComponentType, ComponentProps>

export interface ForwardRefWithAsRenderFunction<
  DefaultComponentType extends As,
  ComponentProps = {},
> {
  (
    props: React.PropsWithChildren<PropsFromAs<DefaultComponentType, ComponentProps>>,
    ref:
      | ((
          instance:
            | (DefaultComponentType extends keyof ElementTagNameMap
                ? ElementTagNameMap[DefaultComponentType]
                : any)
            | null
        ) => void)
      | React.MutableRefObject<
          | (DefaultComponentType extends keyof ElementTagNameMap
              ? ElementTagNameMap[DefaultComponentType]
              : any)
          | null
        >
      | null
  ): React.ReactElement | null
  displayName?: string
  defaultProps?: never
  propTypes?: never
}

interface ExoticComponentWithAs<DefaultComponentType extends As, ComponentProps> {
  (props: PropsWithAs<DefaultComponentType, ComponentProps>): React.ReactElement | null
  <ComponentType extends As>(
    props: PropsWithAs<ComponentType, ComponentProps> & {
      as: ComponentType
    }
  ): React.ReactElement | null
  readonly $$typeof: symbol
}

interface NamedExoticComponentWithAs<DefaultComponentType extends As, ComponentProps>
  extends ExoticComponentWithAs<DefaultComponentType, ComponentProps> {
  displayName?: string
}

export interface ForwardRefExoticComponentWithAs<DefaultComponentType extends As, ComponentProps>
  extends NamedExoticComponentWithAs<DefaultComponentType, ComponentProps> {
  defaultProps?: Partial<PropsWithAs<DefaultComponentType, ComponentProps>>
  // React 19: WeakValidationMap is not exported, so use any or remove
  propTypes?: any
}

/**
 * Enhanced version of React.forwardRef with additional type safety and 'as' prop support
 */
export function forwardRef<DefaultComponentType extends As = 'div', Props = {}>(
  render: ForwardRefWithAsRenderFunction<DefaultComponentType, Props>
) {
  return React.forwardRef(render as any) as ForwardRefExoticComponentWithAs<
    DefaultComponentType,
    Props
  >
}

// ============================================================================
// TVCX Core Types and Interfaces
// ============================================================================

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

export interface ComponentConfig<C extends React.ElementType, TVFN extends Recipe> {
  defaultProps?: Partial<React.ComponentPropsWithoutRef<C> & ComposedTVProps<TVFN> & UnstyledProps>
  displayName?: string
}

type ComponentSlots<T> = {
  [K in keyof T as K extends string ? Uncapitalize<K> : never]: any
}

// ============================================================================
// TVCX Core Functions
// ============================================================================

/**
 * Creates a TVCX component with the given configuration
 */
export const tvcx = <T extends Record<string, any>>(
  config: Parameters<typeof tv>[0] & {
    slots?: Partial<ComponentSlots<T>>
  }
) => {
  return tv(config)
}

/**
 * Creates a component factory with root and slot functionality
 */
export function createComponentFactory<TVFN extends Recipe, Slot extends keyof ReturnType<TVFN>>(
  tvFn: TVFN
) {
  const Ctx = React.createContext<{
    variants?: ReturnType<TVFN>
    classNames?: CtxClassNames<TVFN>
  }>({})

  const useCtx = () => React.useContext(Ctx)

  function withRoot<C extends React.ElementType>(
    Component: C,
    slot?: Slot,
    config?: ComponentConfig<C, TVFN>
  ) {
    const Comp = React.forwardRef<
      React.ElementRef<C>,
      React.ComponentPropsWithoutRef<C> & ComposedTVProps<TVFN> & UnstyledProps
    >(function ({ className, classNames, unstyled, ...props }, ref) {
      const mergedProps = { ...config?.defaultProps, ...props }
      const variants = tvFn(mergedProps) as any

      const _className = React.useMemo(
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
          <Component ref={ref} className={_className} {...(mergedProps as any)} />
        </Ctx.Provider>
      )
    })
    Comp.displayName =
      config?.displayName || (Component as any).displayName || (Component as any).name
    return Comp
  }

  function withSlot<C extends React.ElementType>(
    Component: C,
    slot?: Slot,
    config?: ComponentConfig<C, TVFN>
  ) {
    const Comp = React.forwardRef<
      React.ElementRef<C>,
      React.ComponentPropsWithoutRef<C> & VariantProps<TVFN> & UnstyledProps
    >(function ({ className, unstyled, ...props }, ref) {
      const { variants, classNames } = useCtx()
      const mergedProps = { ...config?.defaultProps, ...props }

      const _className = React.useMemo(
        function () {
          return cn(
            slot && !unstyled ? variants?.[slot]?.() : undefined,
            slot ? (classNames as any)?.[slot] : undefined,
            className
          )
        },
        [variants, classNames, className, slot, unstyled]
      )

      return <Component ref={ref} className={_className} {...(mergedProps as any)} />
    })

    Comp.displayName =
      config?.displayName ||
      (Component as any).displayName ||
      (Component as any).name ||
      'Component'
    return Comp
  }

  return {
    withRoot,
    withSlot,
  }
}

/**
 * Creates a styled component with TVCX functionality
 */
export function styled<TVFN extends Recipe, C extends React.ElementType>(Component: C, tvFn: TVFN) {
  return forwardRef<C, React.ComponentPropsWithoutRef<C> & VariantProps<TVFN>>(function (
    { as: Comp = Component as any, children, className, ...props },
    ref
  ) {
    return (
      <Comp ref={ref} className={cn(tvFn({ ...props, className }))} {...props}>
        {children}
      </Comp>
    )
  })
}

/**
 * Creates a component tree with nested children
 */
export function createComponentTree<
  F extends React.ElementType,
  N extends Readonly<Record<string, React.ElementType | ((...args: any) => any)>>,
>(Factory: F, nestedChildren: Readonly<N>) {
  const c = Factory as F & N
  return Object.assign(c, nestedChildren)
}
