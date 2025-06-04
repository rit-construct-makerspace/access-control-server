import { CurrentUser } from "./CurrentUserProvider";

export function isAdmin(user: CurrentUser) {
    return user.admin;
}

export function isManagerFor(user: CurrentUser, makerspaceID: number) {
    if (isAdmin(user)) {
        return true;
    }

    return user.manager.includes(makerspaceID);
}

export function isManager(user: CurrentUser) {
    if (isAdmin(user)) {
        return true;
    }
    return user.manager.length > 0;
}

export function isStaffFor(user: CurrentUser, makerspaceID: number) {
    if (isManagerFor(user, makerspaceID)) {
        return true;
    }

    return user.staff.includes(makerspaceID);
}

export function isStaff(user: CurrentUser) {
    if (isManager(user)) {
        return true;
    }

    return user.staff.length > 0;
}

export function isTrainerFor(user: CurrentUser, equipmentID: number, makerspaceID: number) {
    if (isManagerFor(user, makerspaceID)) {
        return true;
    }

    return user.trainer.includes(equipmentID);
}