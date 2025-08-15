import { CurrentUser } from "./context.js";


export function isAdmin(user: CurrentUser) {
  return user.admin;
}

export function isManager(user: CurrentUser) {
  if (isAdmin(user)) {
    return true;
  }

  return user.manager.length > 0;
}

export function isStaff(user: CurrentUser) {
  if (isManager(user)) {
    return true;
  }

  return user.staff.length > 0;
}

