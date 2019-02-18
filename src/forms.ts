let uidSeed = 1

export interface IFormHelper<T extends {}> {
  nameOf: (key: keyof T) => string
  idOf: (key: keyof T) => string
}

export function createFormHelper<T extends {}>(): IFormHelper<T> {
  uidSeed += 1
  const formUid = String(uidSeed)

  return {
    nameOf(key: keyof T) {
      return key as string
    },
    idOf(id: keyof T) {
      return formUid + '_' + id
    },
  }
}

export function extractFormData<T>(form: HTMLFormElement): T {
  const elements = form.elements
  const data: any = {}

  for (let i = 0; i < elements.length; i++) {
    const item = elements.item(i)!
    const name = item.getAttribute('name')
    if (name) {
      data[name] = (item as any).value
    }
  }

  return data
}
