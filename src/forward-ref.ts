import React from 'react'

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

  /**
   * Inherited from React.ExoticComponent
   */
  readonly $$typeof: symbol
}

interface NamedExoticComponentWithAs<DefaultComponentType extends As, ComponentProps>
  extends ExoticComponentWithAs<DefaultComponentType, ComponentProps> {
  /**
   * Inherited from React.NamedExoticComponent
   */
  displayName?: string
}

export interface ForwardRefExoticComponentWithAs<DefaultComponentType extends As, ComponentProps>
  extends NamedExoticComponentWithAs<DefaultComponentType, ComponentProps> {
  defaultProps?: Partial<PropsWithAs<DefaultComponentType, ComponentProps>>
  propTypes?: React.WeakValidationMap<PropsWithAs<DefaultComponentType, ComponentProps>>
}

export function forwardRef<DefaultComponentType extends As = 'div', Props = {}>(
  render: ForwardRefWithAsRenderFunction<DefaultComponentType, Props>
) {
  return React.forwardRef(render as any) as ForwardRefExoticComponentWithAs<
    DefaultComponentType,
    Props
  >
}
