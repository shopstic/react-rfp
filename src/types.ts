import React from 'react'

export type Constructor<T> = new (...args: any[]) => T

export function delay<T>(value: T, timeout: number): Promise<T> {
  return new Promise(resolve => {
    setTimeout(() => resolve(value), timeout)
  })
}

export type DefaultProps<P, DP extends Partial<P>> = Partial<DP> &
  Pick<P, Exclude<keyof P, keyof DP>>

export type PropsExcludeFrom<P, E> = Pick<P, Exclude<keyof P, E>>

export type PropsWithout<C, E extends keyof PropsOf<C>> = PropsExcludeFrom<PropsOf<C>, E>

export type PropsPick<C, E extends keyof PropsOf<C>> = Pick<PropsOf<C>, E>

export type Merge<A, B> = Pick<A, Exclude<keyof A, keyof B>> & B

export type Omit<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>

export const withDefaultProps = <P extends object, DP extends Partial<P> = Partial<P>>(
  Cmp: React.ComponentType<P>,
  defaultProps: DP,
): React.ComponentType<DefaultProps<P, DP>> => {
  Cmp.defaultProps = defaultProps
  return Cmp as React.ComponentType<any>
}

export type PropsOf<T> = T extends React.ComponentType<DefaultProps<infer A, infer B>>
  ? DefaultProps<A, B>
  : (T extends React.ComponentType<infer P> ? P : any)

export type ReturnOf<T> = T extends (...args: any[]) => infer R ? R : never

export const nameOf = <T>(name: keyof T) => name
