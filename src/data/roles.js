export const ROLES_VALIDOS = [
  'Cliente',
  'Locutor',
  'Administrador',
]

export function esRolValido(rol) {
  return ROLES_VALIDOS.includes(rol)
}